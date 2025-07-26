// ==================================================
// FVStudios Dashboard - API de Logs de Integração
// Endpoint para consultar logs das integrações
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET - Buscar logs de integração
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { searchParams } = new URL(request.url)
    
    const integrationId = searchParams.get('integration_id')
    const agencyId = searchParams.get('agency_id') 
    const status = searchParams.get('status')
    const operation = searchParams.get('operation')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!integrationId && !agencyId) {
      return NextResponse.json(
        { error: 'integration_id ou agency_id é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('integration_logs')
      .select(`
        id,
        integration_id,
        operation,
        method,
        endpoint,
        response_status,
        duration_ms,
        error_message,
        status,
        created_at,
        api_integrations!inner(
          id,
          name,
          provider,
          provider_type
        )
      `)

    // Filtros
    if (integrationId) {
      query = query.eq('integration_id', integrationId)
    }

    if (agencyId) {
      query = query.eq('api_integrations.agency_id', agencyId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (operation) {
      query = query.eq('operation', operation)
    }

    // Paginação e ordenação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: logs, error } = await query

    if (error) {
      console.error('Erro ao buscar logs:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar total de registros para paginação
    let countQuery = supabase
      .from('integration_logs')
      .select('id', { count: 'exact', head: true })

    if (integrationId) {
      countQuery = countQuery.eq('integration_id', integrationId)
    }

    if (agencyId) {
      countQuery = countQuery.eq('api_integrations.agency_id', agencyId)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    if (operation) {
      countQuery = countQuery.eq('operation', operation)
    }

    const { count } = await countQuery

    return NextResponse.json({
      logs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    })

  } catch (error) {
    console.error('Erro na API de logs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar log de integração (para uso interno)
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const {
      integration_id,
      operation,
      method,
      endpoint,
      request_headers,
      request_body,
      response_status,
      response_headers,
      response_body,
      duration_ms,
      error_message,
      status
    } = await request.json()

    if (!integration_id || !operation || !method || !endpoint || !status) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: integration_id, operation, method, endpoint, status' },
        { status: 400 }
      )
    }

    const { data: log, error } = await supabase
      .from('integration_logs')
      .insert({
        integration_id,
        operation,
        method,
        endpoint,
        request_headers,
        request_body,
        response_status,
        response_headers,
        response_body,
        duration_ms,
        error_message,
        status
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar log:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ log }, { status: 201 })

  } catch (error) {
    console.error('Erro na criação de log:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}