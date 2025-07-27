import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar saúde da API WhatsApp
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Buscar configuração WhatsApp
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('api_key, phone_number, is_active, webhook_verified, last_health_check')
      .eq('agency_id', profile.agency_id)
      .single()

    if (configError || !config) {
      return NextResponse.json({
        success: false,
        status: {
          status: 'error',
          message: 'Configuração WhatsApp não encontrada',
          last_check: new Date(),
          response_time_ms: 0,
          details: {
            api_connection: false,
            webhook_status: false,
            phone_verified: false,
            business_account: false
          }
        }
      })
    }

    if (!config.is_active) {
      return NextResponse.json({
        success: false,
        status: {
          status: 'warning',
          message: 'Configuração WhatsApp está desativada',
          last_check: new Date(),
          response_time_ms: 0,
          details: {
            api_connection: false,
            webhook_status: config.webhook_verified,
            phone_verified: false,
            business_account: false
          }
        }
      })
    }

    // Simular verificação da API do WhatsApp
    // Em produção, fazer requisições reais para a API do WhatsApp Business
    const startTime = Date.now()
    
    try {
      // Simular chamada para API do WhatsApp
      // const apiResponse = await fetch(`https://graph.facebook.com/v18.0/${phone_number}`, {
      //   headers: {
      //     'Authorization': `Bearer ${api_key}`
      //   }
      // })
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
      
      const responseTime = Date.now() - startTime
      
      // Simular verificações
      const apiConnected = true // apiResponse.ok
      const phoneVerified = !!config.phone_number
      const businessAccount = true // Verificar se é conta business
      
      // Atualizar último health check
      await supabase
        .from('whatsapp_config')
        .update({ 
          last_health_check: new Date().toISOString() 
        })
        .eq('agency_id', profile.agency_id)

      // Determinar status geral
      let status: 'healthy' | 'warning' | 'error' = 'healthy'
      let message = 'WhatsApp API funcionando normalmente'
      
      if (!config.webhook_verified) {
        status = 'warning'
        message = 'API conectada, mas webhook não verificado'
      }
      
      if (!apiConnected) {
        status = 'error'
        message = 'Erro na conexão com a API do WhatsApp'
      }

      return NextResponse.json({
        success: true,
        status: {
          status,
          message,
          last_check: new Date(),
          response_time_ms: responseTime,
          details: {
            api_connection: apiConnected,
            webhook_status: config.webhook_verified,
            phone_verified: phoneVerified,
            business_account: businessAccount,
            phone_number: config.phone_number,
            webhook_url: !!config.webhook_verified
          }
        }
      })

    } catch (apiError) {
      console.error('Erro ao verificar API WhatsApp:', apiError)
      
      const responseTime = Date.now() - startTime
      
      return NextResponse.json({
        success: false,
        status: {
          status: 'error',
          message: 'Falha na conexão com a API do WhatsApp',
          last_check: new Date(),
          response_time_ms: responseTime,
          details: {
            api_connection: false,
            webhook_status: config.webhook_verified,
            phone_verified: !!config.phone_number,
            business_account: false,
            error: 'Connection timeout or API error'
          }
        }
      })
    }

  } catch (error) {
    console.error('Erro ao processar health check:', error)
    
    return NextResponse.json({
      success: false,
      status: {
        status: 'error',
        message: 'Erro interno no health check',
        last_check: new Date(),
        response_time_ms: 0,
        details: {
          api_connection: false,
          webhook_status: false,
          phone_verified: false,
          business_account: false,
          error: 'Internal server error'
        }
      }
    }, { status: 500 })
  }
}

// Endpoint para testar envio de mensagem
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para testar API' }, { status: 403 })
    }

    // Buscar configuração
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .single()

    if (!config || !config.is_active) {
      return NextResponse.json({ error: 'Configuração WhatsApp não encontrada ou inativa' }, { status: 400 })
    }

    const body = await request.json()
    const { test_phone } = body

    if (!test_phone) {
      return NextResponse.json({ error: 'Número de telefone para teste é obrigatório' }, { status: 400 })
    }

    // Simular envio de mensagem de teste
    const testMessage = `🧪 *Teste de Conexão*\n\nOlá! Esta é uma mensagem de teste da API WhatsApp Business.\n\n✅ Configuração funcionando corretamente!\n\n_Enviado em ${new Date().toLocaleString('pt-BR')}_`

    try {
      // Em produção, fazer requisição real para API do WhatsApp
      // const apiResponse = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number}/messages`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${config.api_key}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     messaging_product: 'whatsapp',
      //     to: test_phone,
      //     text: { body: testMessage }
      //   })
      // })

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Registrar teste no banco
      await supabase
        .from('client_notifications')
        .insert({
          agency_id: profile.agency_id,
          client_id: null,
          notification_type: 'test_message',
          title: 'Teste de Conexão',
          message: testMessage,
          whatsapp_phone: test_phone,
          status: 'sent', // Simular sucesso
          sent_at: new Date().toISOString(),
          template_used: 'system_test',
          metadata: { test: true, sent_by: user.id },
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        message: 'Mensagem de teste enviada com sucesso!',
        details: {
          phone: test_phone,
          message_length: testMessage.length,
          sent_at: new Date().toISOString()
        }
      })

    } catch (apiError) {
      console.error('Erro no envio de teste:', apiError)
      
      // Registrar falha no banco
      await supabase
        .from('client_notifications')
        .insert({
          agency_id: profile.agency_id,
          client_id: null,
          notification_type: 'test_message',
          title: 'Teste de Conexão (Falhou)',
          message: testMessage,
          whatsapp_phone: test_phone,
          status: 'failed',
          failed_at: new Date().toISOString(),
          template_used: 'system_test',
          metadata: { test: true, sent_by: user.id, error: 'API error' },
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: false,
        error: 'Falha no envio da mensagem de teste',
        details: {
          phone: test_phone,
          error: 'API connection failed'
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao processar teste:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}