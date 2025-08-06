import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    const supabase = await supabaseServer()

    // Buscar convite pelo ID (token)
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select(`
        *,
        agencies (
          name
        )
      `)
      .eq('id', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
    }

    // Verificar se o convite ainda é válido
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Convite já foi utilizado' }, { status: 400 })
    }

    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 400 })
    }

    // Retornar dados do convite (sem informações sensíveis)
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        company: invitation.company,
        phone: invitation.phone,
        welcome_message: invitation.welcome_message,
        agency_name: invitation.agencies?.name,
        expires_at: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('Erro ao validar convite:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}