import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Plataformas suportadas
const SUPPORTED_PLATFORMS = [
  'instagram',
  'facebook', 
  'linkedin',
  'tiktok',
  'google_ads',
  'meta_ads',
  'tiktok_ads',
  'rd_station',
  'mailchimp',
  'sendgrid'
] as const

type Platform = typeof SUPPORTED_PLATFORMS[number]

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')

    let query = supabase
      .from('social_media_keys')
      .select(`
        id,
        platform,
        is_active,
        expires_at,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)

    if (platform && SUPPORTED_PLATFORMS.includes(platform as Platform)) {
      query = query.eq('platform', platform)
    }

    const { data: keys, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching social media keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch social media keys' },
        { status: 500 }
      )
    }

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error in social media keys GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { 
      platform, 
      api_key, 
      access_token, 
      refresh_token, 
      app_id, 
      app_secret, 
      additional_config,
      expires_at 
    } = body

    // Validate platform
    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Supported platforms: ' + SUPPORTED_PLATFORMS.join(', ') },
        { status: 400 }
      )
    }

    // Upsert the key (insert or update if exists)
    const { data: key, error } = await supabase
      .from('social_media_keys')
      .upsert({
        user_id: user.id,
        platform,
        api_key,
        access_token,
        refresh_token,
        app_id,
        app_secret,
        additional_config: additional_config || {},
        expires_at,
        is_active: true
      }, {
        onConflict: 'user_id,platform'
      })
      .select(`
        id,
        platform,
        is_active,
        expires_at,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Error creating/updating social media key:', error)
      return NextResponse.json(
        { error: 'Failed to save social media key' },
        { status: 500 }
      )
    }

    return NextResponse.json({ key })
  } catch (error) {
    console.error('Error in social media keys POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')

    if (!platform || !SUPPORTED_PLATFORMS.includes(platform as Platform)) {
      return NextResponse.json(
        { error: 'Invalid platform specified' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('social_media_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform)

    if (error) {
      console.error('Error deleting social media key:', error)
      return NextResponse.json(
        { error: 'Failed to delete social media key' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in social media keys DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}