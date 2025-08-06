import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only allow the main admin to fix permissions
    if (user.email !== 'franco@fvstudios.com.br') {
      return NextResponse.json({ error: 'Only main admin can fix permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userEmail, grantTeamManagement } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }

    // Find the user by email
    const { data: targetUser, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      return NextResponse.json({ error: 'Failed to list users: ' + userError.message }, { status: 500 })
    }

    const foundUser = targetUser.users.find(u => u.email === userEmail)
    if (!foundUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user profile to grant team management permissions
    const updateData: any = {}
    
    if (grantTeamManagement) {
      updateData.can_manage_team = true
      // Also ensure they have a role that supports team management
      updateData.role = 'agency_manager'
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', foundUser.id)
      .select()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Permissions updated for ${userEmail}`,
      updatedProfile: updatedProfile[0]
    })

  } catch (error) {
    console.error('Fix permissions error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}