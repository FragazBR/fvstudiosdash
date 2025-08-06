import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // Get agency permissions
    const { data: agencyPermissions, error: agencyError } = await supabase
      .from('user_agency_permissions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile,
      profileError: profileError,
      agencyPermissions: agencyPermissions,
      agencyError: agencyError,
      checks: {
        isMainAdmin: user.email === 'franco@fvstudios.com.br',
        hasAgencyPermissions: agencyPermissions && ['admin', 'agency_owner'].includes(agencyPermissions.role),
        canManageTeam: profile?.can_manage_team === true,
        isAgencyManager: profile && ['agency_owner', 'agency_manager'].includes(profile.role),
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}