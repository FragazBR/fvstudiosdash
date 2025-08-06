import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only allow the main admin
    if (user.email !== 'franco@fvstudios.com.br') {
      return NextResponse.json({ error: 'Only main admin can setup permissions' }, { status: 403 })
    }

    console.log('🔧 Setting up permissions for agency users...')

    // Update all agency_owner and agency_manager users to have can_manage_team = true
    const { data: updatedProfiles, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        can_manage_team: true,
        can_assign_tasks: true,
        can_view_team_metrics: true
      })
      .in('role', ['agency_owner', 'agency_manager'])
      .select('id, email, role')

    if (updateError) {
      console.error('Error updating permissions:', updateError)
      return NextResponse.json({ error: 'Failed to update permissions: ' + updateError.message }, { status: 500 })
    }

    console.log('✅ Updated permissions for users:', updatedProfiles)

    return NextResponse.json({
      success: true,
      message: `Updated permissions for ${updatedProfiles?.length || 0} users`,
      updatedUsers: updatedProfiles
    })

  } catch (error) {
    console.error('Setup permissions error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}