import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Webhook {
  id: string
  agency_id?: string
  name: string
  description?: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers: Record<string, string>
  secret_token?: string
  events: string[]
  is_active: boolean
  retry_attempts: number
  retry_delay_seconds: number
  timeout_seconds: number
  filters: Record<string, any>
  total_requests: number
  successful_requests: number
  failed_requests: number
  last_triggered?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface WebhookEvent {
  id: string
  webhook_id: string
  event_type: string
  event_data: any
  status: 'pending' | 'sending' | 'success' | 'failed' | 'retrying'
  http_status_code?: number
  response_body?: string
  error_message?: string
  triggered_at: string
  completed_at?: string
  duration_ms?: number
  attempt_number: number
  next_retry_at?: string
  request_headers?: Record<string, string>
  request_body?: string
}

export interface WebhookEventType {
  id: string
  name: string
  description?: string
  category: string
  payload_schema?: any
  is_active: boolean
  created_at: string
}

export class WebhookSystem {
  
  // ==================== WEBHOOK MANAGEMENT ====================
  
  async createWebhook(webhook: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'total_requests' | 'successful_requests' | 'failed_requests'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          ...webhook,
          headers: webhook.headers || {},
          filters: webhook.filters || {}
        })
        .select('id')
        .single()

      if (error) {
        console.error('Erro ao criar webhook:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Erro ao criar webhook:', error)
      return null
    }
  }

  async updateWebhook(webhookId: string, updates: Partial<Webhook>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', webhookId)

      if (error) {
        console.error('Erro ao atualizar webhook:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error)
      return false
    }
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)

      if (error) {
        console.error('Erro ao deletar webhook:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar webhook:', error)
      return false
    }
  }

  async getWebhooks(agencyId?: string, isActive?: boolean): Promise<Webhook[]> {
    try {
      let query = supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false })

      if (agencyId) {
        query = query.eq('agency_id', agencyId)
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar webhooks:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar webhooks:', error)
      return []
    }
  }

  async getWebhook(webhookId: string): Promise<Webhook | null> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .single()

      if (error) {
        console.error('Erro ao buscar webhook:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar webhook:', error)
      return null
    }
  }

  // ==================== EVENT TYPES ====================

  async getEventTypes(category?: string): Promise<WebhookEventType[]> {
    try {
      let query = supabase
        .from('webhook_event_types')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar tipos de eventos:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar tipos de eventos:', error)
      return []
    }
  }

  // ==================== EVENT TRIGGERING ====================

  async triggerEvent(eventType: string, eventData: any, agencyId?: string): Promise<void> {
    try {
      // Buscar webhooks que estão inscritos neste evento
      let query = supabase
        .from('webhook_subscriptions')
        .select(`
          webhook_id,
          webhooks!inner (
            id, name, url, method, headers, secret_token,
            is_active, retry_attempts, timeout_seconds, filters
          )
        `)
        .eq('event_type', eventType)
        .eq('is_active', true)
        .eq('webhooks.is_active', true)

      if (agencyId) {
        query = query.eq('webhooks.agency_id', agencyId)
      }

      const { data: subscriptions, error } = await query

      if (error) {
        console.error('Erro ao buscar assinaturas de webhook:', error)
        return
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`Nenhum webhook inscrito no evento ${eventType}`)
        return
      }

      // Processar cada webhook
      const promises = subscriptions.map(subscription => {
        const webhook = subscription.webhooks as any
        return this.executeWebhook(webhook, eventType, eventData)
      })

      await Promise.all(promises)
    } catch (error) {
      console.error('Erro ao disparar evento:', error)
    }
  }

  private async executeWebhook(webhook: any, eventType: string, eventData: any): Promise<void> {
    // Aplicar filtros se existirem
    if (webhook.filters && Object.keys(webhook.filters).length > 0) {
      if (!this.matchesFilters(eventData, webhook.filters)) {
        console.log(`Evento ${eventType} não passou nos filtros do webhook ${webhook.name}`)
        return
      }
    }

    // Criar registro do evento
    const { data: eventRecord, error: eventError } = await supabase
      .from('webhook_events')
      .insert({
        webhook_id: webhook.id,
        event_type: eventType,
        event_data: eventData,
        status: 'pending'
      })
      .select('id')
      .single()

    if (eventError || !eventRecord) {
      console.error('Erro ao criar registro do evento:', eventError)
      return
    }

    // Executar webhook
    await this.sendWebhookRequest(eventRecord.id, webhook, eventType, eventData)
  }

  private async sendWebhookRequest(
    eventId: string, 
    webhook: any, 
    eventType: string, 
    eventData: any,
    attemptNumber = 1
  ): Promise<void> {
    const startTime = Date.now()

    try {
      // Atualizar status para 'sending'
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'sending',
          attempt_number: attemptNumber
        })
        .eq('id', eventId)

      // Preparar payload
      const payload = {
        event_type: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        webhook: {
          id: webhook.id,
          name: webhook.name
        }
      }

      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'FVStudios-Webhook/1.0',
        ...webhook.headers
      }

      // Adicionar assinatura HMAC se tiver secret token
      if (webhook.secret_token) {
        const signature = this.generateSignature(JSON.stringify(payload), webhook.secret_token)
        headers['X-FVStudios-Signature'] = signature
      }

      // Fazer requisição HTTP
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body: webhook.method !== 'GET' ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(webhook.timeout_seconds * 1000)
      })

      const responseBody = await response.text()
      const duration = Date.now() - startTime

      // Atualizar registro com sucesso
      await supabase
        .from('webhook_events')
        .update({
          status: 'success',
          http_status_code: response.status,
          response_body: responseBody.substring(0, 10000), // Limitar tamanho
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          request_headers: headers,
          request_body: webhook.method !== 'GET' ? JSON.stringify(payload) : null
        })
        .eq('id', eventId)

    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorMessage = error.message || 'Erro desconhecido'

      // Verificar se deve tentar novamente
      const shouldRetry = attemptNumber < webhook.retry_attempts && 
                         !errorMessage.includes('timeout') &&
                         !errorMessage.includes('400') &&
                         !errorMessage.includes('401') &&
                         !errorMessage.includes('403')

      if (shouldRetry) {
        // Agendar retry
        const nextRetryAt = new Date(Date.now() + webhook.retry_delay_seconds * 1000)
        
        await supabase
          .from('webhook_events')
          .update({
            status: 'retrying',
            error_message: errorMessage,
            duration_ms: duration,
            next_retry_at: nextRetryAt.toISOString()
          })
          .eq('id', eventId)

        // Agendar próxima tentativa (em um ambiente real, usaria um job queue)
        setTimeout(() => {
          this.sendWebhookRequest(eventId, webhook, eventType, eventData, attemptNumber + 1)
        }, webhook.retry_delay_seconds * 1000)

      } else {
        // Falhou definitivamente
        await supabase
          .from('webhook_events')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
            duration_ms: duration
          })
          .eq('id', eventId)
      }
    }
  }

  // ==================== EVENT HISTORY ====================

  async getWebhookEvents(
    webhookId?: string,
    eventType?: string,
    status?: string,
    limit = 50
  ): Promise<WebhookEvent[]> {
    try {
      let query = supabase
        .from('webhook_events')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(limit)

      if (webhookId) {
        query = query.eq('webhook_id', webhookId)
      }

      if (eventType) {
        query = query.eq('event_type', eventType)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar eventos de webhook:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar eventos de webhook:', error)
      return []
    }
  }

  async retryWebhookEvent(eventId: string): Promise<boolean> {
    try {
      // Buscar evento e webhook
      const { data: event, error: eventError } = await supabase
        .from('webhook_events')
        .select(`
          *,
          webhooks (*)
        `)
        .eq('id', eventId)
        .single()

      if (eventError || !event) {
        console.error('Evento não encontrado:', eventError)
        return false
      }

      // Executar novamente
      await this.sendWebhookRequest(
        eventId,
        event.webhooks,
        event.event_type,
        event.event_data,
        event.attempt_number + 1
      )

      return true
    } catch (error) {
      console.error('Erro ao repetir evento de webhook:', error)
      return false
    }
  }

  // ==================== UTILITY METHODS ====================

  private matchesFilters(data: any, filters: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(filters)) {
      const actualValue = this.getNestedValue(data, key)
      
      if (expectedValue !== actualValue) {
        return false
      }
    }
    return true
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  // ==================== TESTING ====================

  async testWebhook(webhookId: string): Promise<{
    success: boolean
    status_code?: number
    response_body?: string
    error?: string
    duration_ms: number
  }> {
    const startTime = Date.now()

    try {
      const webhook = await this.getWebhook(webhookId)
      if (!webhook) {
        return {
          success: false,
          error: 'Webhook não encontrado',
          duration_ms: Date.now() - startTime
        }
      }

      // Payload de teste
      const testPayload = {
        event_type: 'webhook.test',
        data: {
          message: 'Este é um teste do webhook',
          timestamp: new Date().toISOString()
        },
        webhook: {
          id: webhook.id,
          name: webhook.name
        }
      }

      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'FVStudios-Webhook-Test/1.0',
        ...webhook.headers
      }

      // Adicionar assinatura se tiver secret
      if (webhook.secret_token) {
        const signature = this.generateSignature(JSON.stringify(testPayload), webhook.secret_token)
        headers['X-FVStudios-Signature'] = signature
      }

      // Fazer requisição
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body: webhook.method !== 'GET' ? JSON.stringify(testPayload) : undefined,
        signal: AbortSignal.timeout(webhook.timeout_seconds * 1000)
      })

      const responseBody = await response.text()

      return {
        success: response.ok,
        status_code: response.status,
        response_body: responseBody.substring(0, 1000),
        duration_ms: Date.now() - startTime
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        duration_ms: Date.now() - startTime
      }
    }
  }

  // ==================== STATISTICS ====================

  async getWebhookStats(webhookId?: string, agencyId?: string): Promise<{
    total_webhooks: number
    active_webhooks: number
    total_events: number
    successful_events: number
    failed_events: number
    success_rate: number
    events_last_24h: number
  }> {
    try {
      // Estatísticas de webhooks
      let webhookQuery = supabase
        .from('webhooks')
        .select('id, is_active')

      if (agencyId) {
        webhookQuery = webhookQuery.eq('agency_id', agencyId)
      }

      const { data: webhooks } = await webhookQuery

      const totalWebhooks = webhooks?.length || 0
      const activeWebhooks = webhooks?.filter(w => w.is_active).length || 0

      // Estatísticas de eventos
      let eventQuery = supabase
        .from('webhook_events')
        .select('status, triggered_at')

      if (webhookId) {
        eventQuery = eventQuery.eq('webhook_id', webhookId)
      }

      const { data: events } = await eventQuery

      const totalEvents = events?.length || 0
      const successfulEvents = events?.filter(e => e.status === 'success').length || 0
      const failedEvents = events?.filter(e => e.status === 'failed').length || 0
      const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0

      // Eventos das últimas 24 horas
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const eventsLast24h = events?.filter(e => 
        new Date(e.triggered_at) > yesterday
      ).length || 0

      return {
        total_webhooks: totalWebhooks,
        active_webhooks: activeWebhooks,
        total_events: totalEvents,
        successful_events: successfulEvents,
        failed_events: failedEvents,
        success_rate: Number(successRate.toFixed(2)),
        events_last_24h: eventsLast24h
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return {
        total_webhooks: 0,
        active_webhooks: 0,
        total_events: 0,
        successful_events: 0,
        failed_events: 0,
        success_rate: 0,
        events_last_24h: 0
      }
    }
  }
}

export const webhookSystem = new WebhookSystem()