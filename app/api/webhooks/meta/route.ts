// ==================================================
// FVStudios Dashboard - Webhook para Meta (Facebook/Instagram)
// Receber notificações em tempo real do Meta Business API
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import crypto from 'crypto'

const META_APP_SECRET = process.env.META_APP_SECRET || ''

// GET - Verificação do webhook (Facebook requer isso)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    // Token de verificação configurado no Meta Developer Console
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'fvstudios_meta_webhook_token'

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook Meta verificado com sucesso')
      return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse('Forbidden', { status: 403 })

  } catch (error) {
    console.error('Erro na verificação do webhook Meta:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST - Receber notificações do Meta
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    // Verificar assinatura do webhook
    if (!verifySignature(body, signature)) {
      console.error('Assinatura do webhook inválida')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = JSON.parse(body)

    // Processar cada entrada do webhook
    for (const entry of data.entry || []) {
      try {
        await processWebhookEntry(supabase, entry)
      } catch (entryError) {
        console.error('Erro ao processar entrada do webhook:', entryError)
      }
    }

    return new NextResponse('OK', { status: 200 })

  } catch (error) {
    console.error('Erro no webhook Meta:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Verificar assinatura do webhook
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature || !META_APP_SECRET) {
    return false
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', META_APP_SECRET)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Processar entrada do webhook
async function processWebhookEntry(supabase: any, entry: any) {
  const accountId = entry.id
  const time = entry.time

  // Buscar integração relacionada a esta conta
  const { data: integrations, error } = await supabase
    .from('api_integrations')
    .select('*')
    .eq('provider', 'meta')
    .eq('status', 'active')

  if (error || !integrations?.length) {
    console.log('Nenhuma integração ativa encontrada para a conta:', accountId)
    return
  }

  // Processar mudanças
  for (const change of entry.changes || []) {
    try {
      await processChange(supabase, integrations, change, accountId, time)
    } catch (changeError) {
      console.error('Erro ao processar mudança:', changeError)
    }
  }
}

// Processar mudança específica
async function processChange(supabase: any, integrations: any[], change: any, accountId: string, time: number) {
  const { field, value } = change

  // Log da mudança
  for (const integration of integrations) {
    await supabase
      .from('integration_logs')
      .insert({
        integration_id: integration.id,
        operation: 'webhook',
        method: 'POST',
        endpoint: `/webhooks/meta/${field}`,
        response_status: 200,
        response_body: { field, value, account_id: accountId },
        status: 'success',
        duration_ms: 0
      })
  }

  // Processar baseado no tipo de mudança
  switch (field) {
    case 'campaigns':
      await processCampaignChanges(supabase, integrations, value, accountId)
      break
    
    case 'adsets':
      await processAdSetChanges(supabase, integrations, value, accountId)
      break
    
    case 'ads':
      await processAdChanges(supabase, integrations, value, accountId)
      break
    
    case 'insights':
      await processInsightsChanges(supabase, integrations, value, accountId)
      break
    
    default:
      console.log('Tipo de mudança não tratado:', field)
  }
}

// Processar mudanças em campanhas
async function processCampaignChanges(supabase: any, integrations: any[], value: any, accountId: string) {
  console.log('Processando mudanças em campanhas:', value)
  
  // Agendar sincronização de campanhas para as integrações afetadas
  for (const integration of integrations) {
    await supabase
      .from('sync_jobs')
      .insert({
        integration_id: integration.id,
        job_type: 'incremental_sync',
        status: 'pending',
        next_run_at: new Date().toISOString()
      })
  }
}

// Processar mudanças em ad sets
async function processAdSetChanges(supabase: any, integrations: any[], value: any, accountId: string) {
  console.log('Processando mudanças em ad sets:', value)
  
  // Similar ao processamento de campanhas
  for (const integration of integrations) {
    await supabase
      .from('sync_jobs')
      .insert({
        integration_id: integration.id,
        job_type: 'incremental_sync',
        status: 'pending',
        next_run_at: new Date().toISOString()
      })
  }
}

// Processar mudanças em anúncios
async function processAdChanges(supabase: any, integrations: any[], value: any, accountId: string) {
  console.log('Processando mudanças em anúncios:', value)
  
  // Processar mudanças específicas em anúncios
  for (const integration of integrations) {
    await supabase
      .from('sync_jobs')
      .insert({
        integration_id: integration.id,
        job_type: 'incremental_sync',
        status: 'pending',
        next_run_at: new Date().toISOString()
      })
  }
}

// Processar mudanças em insights (métricas)
async function processInsightsChanges(supabase: any, integrations: any[], value: any, accountId: string) {
  console.log('Processando mudanças em insights:', value)
  
  // Agendar sincronização de métricas
  for (const integration of integrations) {
    await supabase
      .from('sync_jobs')
      .insert({
        integration_id: integration.id,
        job_type: 'sync_metrics',
        status: 'pending',
        next_run_at: new Date().toISOString()
      })
  }
}