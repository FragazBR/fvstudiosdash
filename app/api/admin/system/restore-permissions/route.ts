import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Só permitir para o admin principal
    if (user.email !== 'franco@fvstudios.com.br') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas o admin principal pode restaurar permissões.' 
      }, { status: 403 })
    }

    console.log('🔑 Iniciando restauração de permissões admin...')

    // Verificar se Franco existe no auth.users
    const { data: francoUser, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail('franco@fvstudios.com.br')
    
    if (userError || !francoUser?.user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário franco@fvstudios.com.br não encontrado no sistema de autenticação',
        details: userError?.message
      }, { status: 404 })
    }

    console.log('✅ Usuário Franco encontrado:', francoUser.user.id)

    // Verificar se já existe permissões
    const { data: existingPermissions, error: checkError } = await supabaseAdmin
      .from('user_agency_permissions')
      .select('*')
      .eq('user_id', francoUser.user.id)
      .eq('role', 'admin')
      .maybeSingle()

    console.log('🔍 Permissões existentes:', existingPermissions)

    const adminPermissions = {
      manage_users: 'true',
      manage_agencies: 'true', 
      manage_payments: 'true',
      view_analytics: 'true',
      manage_settings: 'true',
      super_admin: 'true'
    }

    let permissionsData
    if (existingPermissions) {
      // Atualizar permissões existentes
      const { data: updatedPermissions, error: updateError } = await supabaseAdmin
        .from('user_agency_permissions')
        .update({
          role: 'admin',
          permissions: adminPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', francoUser.user.id)
        .eq('role', 'admin')
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar permissões:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao atualizar permissões existentes',
          details: updateError.message
        }, { status: 500 })
      }

      permissionsData = updatedPermissions
      console.log('✅ Permissões atualizadas com sucesso')
    } else {
      // Criar novas permissões
      const { data: newPermissions, error: insertError } = await supabaseAdmin
        .from('user_agency_permissions')
        .insert({
          user_id: francoUser.user.id,
          role: 'admin',
          permissions: adminPermissions,
          granted_by: francoUser.user.id
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Erro ao criar permissões:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Erro ao criar novas permissões',
          details: insertError.message
        }, { status: 500 })
      }

      permissionsData = newPermissions
      console.log('✅ Novas permissões criadas com sucesso')
    }

    // Log da ação
    await supabaseAdmin
      .from('admin_action_logs')
      .insert({
        admin_user_id: francoUser.user.id,
        action: 'restore_admin_permissions',
        target_user_id: francoUser.user.id,
        target_email: 'franco@fvstudios.com.br',
        details: {
          permissions_restored: adminPermissions,
          operation: existingPermissions ? 'updated' : 'created'
        },
        ip_address: getClientIP(request)
      })

    return NextResponse.json({
      success: true,
      message: existingPermissions 
        ? 'Permissões administrativas atualizadas com sucesso!' 
        : 'Permissões administrativas criadas com sucesso!',
      details: {
        email: francoUser.user.email,
        role: permissionsData.role,
        permissions: permissionsData.permissions,
        operation: existingPermissions ? 'updated' : 'created',
        user_id: francoUser.user.id
      }
    })

  } catch (error) {
    console.error('❌ Erro na restauração de permissões:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Função para obter IP do cliente
function getClientIP(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}