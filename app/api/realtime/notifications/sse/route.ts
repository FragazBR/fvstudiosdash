import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Server-Sent Events para notificações em tempo real
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const agencyId = searchParams.get('agency_id')

  if (!userId) {
    return new Response('user_id é obrigatório', { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return new Response('Não autorizado', { status: 401 })
    }

    // Configurar headers para SSE
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    // Criar stream para SSE
    const stream = new ReadableStream({
      start(controller) {
        // Enviar evento inicial de conexão
        const initialData = {
          type: 'connected',
          timestamp: new Date().toISOString(),
          message: 'Conectado ao stream de notificações'
        }
        
        controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`)

        // Configurar heartbeat para manter conexão ativa
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = {
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            }
            controller.enqueue(`data: ${JSON.stringify(heartbeat)}\n\n`)
          } catch (error) {
            console.error('Erro no heartbeat:', error)
            clearInterval(heartbeatInterval)
          }
        }, 30000) // 30 segundos

        // Inscrever-se em mudanças na tabela de notificações
        const channel = supabase
          .channel(`notifications_sse_${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'realtime_notification_events',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              try {
                const notification = {
                  type: 'notification_event',
                  timestamp: new Date().toISOString(),
                  data: payload.new
                }
                controller.enqueue(`data: ${JSON.stringify(notification)}\n\n`)
              } catch (error) {
                console.error('Erro ao enviar notificação via SSE:', error)
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'push_notification_logs',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              try {
                const pushNotification = {
                  type: 'push_notification',
                  timestamp: new Date().toISOString(),
                  data: payload.new
                }
                controller.enqueue(`data: ${JSON.stringify(pushNotification)}\n\n`)
              } catch (error) {
                console.error('Erro ao enviar push notification via SSE:', error)
              }
            }
          )
          .subscribe((status) => {
            console.log(`SSE Subscription status for ${userId}:`, status)
            
            if (status === 'SUBSCRIBED') {
              const subscribed = {
                type: 'subscribed',
                timestamp: new Date().toISOString(),
                message: 'Inscrito em notificações em tempo real'
              }
              controller.enqueue(`data: ${JSON.stringify(subscribed)}\n\n`)
            } else if (status === 'CHANNEL_ERROR') {
              const error = {
                type: 'error',
                timestamp: new Date().toISOString(),
                message: 'Erro na conexão de tempo real'
              }
              controller.enqueue(`data: ${JSON.stringify(error)}\n\n`)
            }
          })

        // Cleanup quando a conexão for fechada
        const cleanup = () => {
          clearInterval(heartbeatInterval)
          supabase.removeChannel(channel)
          console.log(`SSE connection closed for user ${userId}`)
        }

        // Detectar quando o cliente desconecta
        request.signal.addEventListener('abort', cleanup)

        // Cleanup automático após 1 hora para evitar conexões órfãs
        setTimeout(() => {
          console.log(`Auto-closing SSE connection for user ${userId} after 1 hour`)
          cleanup()
          controller.close()
        }, 60 * 60 * 1000) // 1 hora
      },

      cancel() {
        console.log(`SSE stream cancelled for user ${userId}`)
      }
    })

    return new Response(stream, { headers })

  } catch (error) {
    console.error('Erro ao configurar SSE:', error)
    return new Response('Erro interno do servidor', { status: 500 })
  }
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}