import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Buscar conversas usando a função do banco
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', {
        p_user_id: session.user.id,
        p_limit: limit
      })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations || [] })

  } catch (error) {
    console.error('Conversations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, name, description, project_id, participant_ids = [] } = await request.json()

    if (!type || !['direct', 'group', 'project'].includes(type)) {
      return NextResponse.json({ error: 'Valid type is required (direct, group, project)' }, { status: 400 })
    }

    // Buscar agency_id do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 })
    }

    // Criar a conversa
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        type,
        name,
        description,
        project_id,
        agency_id: userProfile.agency_id,
        created_by: session.user.id
      })
      .select()
      .single()

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Adicionar participantes (incluindo o criador)
    const participantsToAdd = [session.user.id, ...participant_ids].filter((id, index, arr) => arr.indexOf(id) === index)
    
    const participantInserts = participantsToAdd.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId
    }))

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts)

    if (participantsError) {
      console.error('Error adding participants:', participantsError)
      // Rollback - deletar a conversa se falhar ao adicionar participantes
      await supabase.from('conversations').delete().eq('id', conversation.id)
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
    }

    return NextResponse.json({ conversation })

  } catch (error) {
    console.error('Create conversation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}