import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { webSocketManager } from '@/lib/websocket-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomType = searchParams.get('type')
    const agencyId = searchParams.get('agency_id')

    // Obter perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    // Buscar salas do banco de dados (se implementado)
    let query = supabase
      .from('chat_rooms')
      .select(`
        id,
        name,
        type,
        description,
        created_by,
        agency_id,
        is_private,
        created_at,
        updated_at,
        chat_room_members!inner(user_id)
      `)

    // Filtrar por tipo se especificado
    if (roomType) {
      query = query.eq('type', roomType)
    }

    // Filtrar por agência
    const targetAgencyId = agencyId || profile?.agency_id
    if (targetAgencyId) {
      query = query.eq('agency_id', targetAgencyId)
    }

    // Verificar permissões - usuário deve ser membro da sala ou admin
    if (profile?.role !== 'admin') {
      query = query.eq('chat_room_members.user_id', user.id)
    }

    const { data: rooms, error } = await query

    if (error) {
      console.error('Erro ao buscar salas:', error)
      // Se não há tabela de salas, retornar salas padrão
      const defaultRooms = [
        {
          id: `agency:${targetAgencyId}`,
          name: 'Geral',
          type: 'agency',
          description: 'Sala geral da agência',
          created_by: null,
          agency_id: targetAgencyId,
          is_private: false,
          created_at: new Date().toISOString(),
          members_count: 0,
          online_count: 0
        }
      ]

      return NextResponse.json({
        success: true,
        data: defaultRooms
      })
    }

    // Enriquecer salas com dados do WebSocket
    const enrichedRooms = (rooms || []).map(room => {
      const onlineUsers = webSocketManager.getOnlineUsers(room.agency_id)
      const roomMembers = room.chat_room_members || []
      
      return {
        ...room,
        members_count: roomMembers.length,
        online_count: onlineUsers.filter(u => 
          roomMembers.some((m: any) => m.user_id === u.id)
        ).length
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedRooms
    })

  } catch (error) {
    console.error('Erro ao listar salas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      type = 'public',
      description,
      agency_id,
      is_private = false,
      members = []
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da sala é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar permissões
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    const targetAgencyId = agency_id || profile?.agency_id

    if (!profile || (!['admin', 'agency_owner', 'agency_manager'].includes(profile.role) && 
        profile.agency_id !== targetAgencyId)) {
      return NextResponse.json({ error: 'Sem permissão para criar salas' }, { status: 403 })
    }

    // Criar sala no banco (assumindo que existe tabela chat_rooms)
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        type,
        description,
        agency_id: targetAgencyId,
        is_private,
        created_by: user.id
      })
      .select()
      .single()

    if (roomError) {
      console.error('Erro ao criar sala:', roomError)
      return NextResponse.json(
        { error: 'Erro ao criar sala no banco de dados' },
        { status: 500 }
      )
    }

    // Adicionar membros à sala
    const roomMembers = [user.id, ...members].map(memberId => ({
      room_id: room.id,
      user_id: memberId,
      joined_at: new Date().toISOString(),
      role: memberId === user.id ? 'admin' : 'member'
    }))

    const { error: membersError } = await supabase
      .from('chat_room_members')
      .insert(roomMembers)

    if (membersError) {
      console.error('Erro ao adicionar membros:', membersError)
    }

    // Notificar membros via WebSocket
    members.forEach((memberId: string) => {
      webSocketManager.sendToUser(memberId, 'room_created', {
        room: {
          ...room,
          members_count: roomMembers.length
        },
        invited_by: user.id
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        members_count: roomMembers.length
      },
      message: 'Sala criada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao criar sala:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('room_id')

    if (!roomId) {
      return NextResponse.json(
        { error: 'room_id é obrigatório' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, is_private } = body

    // Verificar se usuário pode editar a sala
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('*, chat_room_members!inner(user_id, role)')
      .eq('id', roomId)
      .eq('chat_room_members.user_id', user.id)
      .single()

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    const userRole = room.chat_room_members[0]?.role
    if (userRole !== 'admin' && room.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta sala' },
        { status: 403 }
      )
    }

    // Atualizar sala
    const { data: updatedRoom, error } = await supabase
      .from('chat_rooms')
      .update({
        name: name || room.name,
        description: description !== undefined ? description : room.description,
        is_private: is_private !== undefined ? is_private : room.is_private,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar sala:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar sala' },
        { status: 500 }
      )
    }

    // Notificar membros da sala
    webSocketManager.sendToAgency(room.agency_id, 'room_updated', {
      room: updatedRoom,
      updated_by: user.id
    })

    return NextResponse.json({
      success: true,
      data: updatedRoom,
      message: 'Sala atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar sala:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('room_id')

    if (!roomId) {
      return NextResponse.json(
        { error: 'room_id é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar permissões
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se é o criador ou admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (room.created_by !== user.id && 
        (!profile || !['admin', 'agency_owner'].includes(profile.role))) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar esta sala' },
        { status: 403 }
      )
    }

    // Deletar sala (cascade vai deletar membros)
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId)

    if (error) {
      console.error('Erro ao deletar sala:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar sala' },
        { status: 500 }
      )
    }

    // Notificar membros
    webSocketManager.sendToAgency(room.agency_id, 'room_deleted', {
      room_id: roomId,
      room_name: room.name,
      deleted_by: user.id
    })

    return NextResponse.json({
      success: true,
      message: 'Sala deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar sala:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}