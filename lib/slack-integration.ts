import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SlackWorkspace {
  id: string
  agency_id: string
  team_id: string
  team_name: string
  access_token: string
  refresh_token?: string
  bot_token: string
  scope: string
  bot_user_id?: string
  is_active: boolean
  auto_create_channels: boolean
  default_channel: string
  installed_by?: string
  installed_at: string
  last_used_at?: string
  created_at: string
  updated_at: string
}

export interface SlackChannel {
  id: string
  workspace_id: string
  channel_id: string
  channel_name: string
  purpose?: string
  is_private: boolean
  is_archived: boolean
  notification_types: string[]
  message_format: 'simple' | 'rich' | 'blocks'
  filters: Record<string, any>
  total_messages: number
  last_message_at?: string
  created_at: string
  updated_at: string
}

export interface SlackNotification {
  id: string
  workspace_id: string
  channel_id: string
  event_type: string
  event_data: any
  message_text: string
  message_blocks?: any
  thread_ts?: string
  status: 'pending' | 'sent' | 'failed' | 'retrying'
  slack_message_ts?: string
  slack_channel_id?: string
  slack_response?: any
  error_message?: string
  sent_at?: string
  duration_ms?: number
  retry_count: number
  max_retries: number
  next_retry_at?: string
  created_at: string
}

export interface SlackMessageTemplate {
  id: string
  agency_id?: string
  name: string
  description?: string
  event_type: string
  message_format: 'simple' | 'rich' | 'blocks'
  template_text?: string
  template_blocks?: any
  use_threading: boolean
  mention_users: string[]
  mention_channels: string[]
  is_system_template: boolean
  is_active: boolean
  usage_count: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SlackUser {
  id: string
  workspace_id: string
  slack_user_id: string
  slack_username?: string
  display_name?: string
  real_name?: string
  email?: string
  system_user_id?: string
  is_active: boolean
  is_bot: boolean
  is_admin: boolean
  receive_notifications: boolean
  notification_preferences: Record<string, any>
  profile_image?: string
  timezone?: string
  last_seen_at?: string
  created_at: string
  updated_at: string
}

export class SlackIntegration {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly signingSecret: string

  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID!
    this.clientSecret = process.env.SLACK_CLIENT_SECRET!
    this.signingSecret = process.env.SLACK_SIGNING_SECRET!
  }

  // ==================== OAUTH FLOW ====================

  /**
   * Gera URL de autorização OAuth do Slack
   */
  generateAuthUrl(agencyId: string, redirectUri: string): string {
    const scopes = [
      'channels:read',
      'channels:write',
      'channels:history',
      'chat:write',
      'chat:write.public',
      'groups:read',
      'groups:write',
      'users:read',
      'users:read.email',
      'team:read',
      'incoming-webhook'
    ].join(',')

    const state = this.generateState(agencyId)

    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
      user_scope: 'identify'
    })

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`
  }

  /**
   * Troca código de autorização por tokens de acesso
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    access_token: string
    refresh_token?: string
    bot_token: string
    team: any
    bot_user_id: string
    scope: string
  } | null> {
    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: redirectUri
        })
      })

      const data = await response.json()

      if (!data.ok) {
        console.error('Erro OAuth Slack:', data.error)
        return null
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        bot_token: data.bot_token,
        team: data.team,
        bot_user_id: data.bot_user_id,
        scope: data.scope
      }
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error)
      return null
    }
  }

  /**
   * Instala workspace Slack na agência
   */
  async installWorkspace(agencyId: string, oauthData: any, installedBy: string): Promise<string | null> {
    try {
      // Criptografar tokens
      const encryptedAccessToken = this.encryptToken(oauthData.access_token)
      const encryptedBotToken = this.encryptToken(oauthData.bot_token)
      const encryptedRefreshToken = oauthData.refresh_token ? 
        this.encryptToken(oauthData.refresh_token) : null

      const { data, error } = await supabase
        .from('slack_workspaces')
        .insert({
          agency_id: agencyId,
          team_id: oauthData.team.id,
          team_name: oauthData.team.name,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          bot_token: encryptedBotToken,
          scope: oauthData.scope,
          bot_user_id: oauthData.bot_user_id,
          installed_by: installedBy
        })
        .select('id')
        .single()

      if (error) {
        console.error('Erro ao instalar workspace:', error)
        return null
      }

      // Sincronizar canais iniciais
      await this.syncWorkspaceChannels(data.id)

      return data.id
    } catch (error) {
      console.error('Erro ao instalar workspace:', error)
      return null
    }
  }

  // ==================== CHANNEL MANAGEMENT ====================

  /**
   * Sincroniza canais do workspace Slack
   */
  async syncWorkspaceChannels(workspaceId: string): Promise<boolean> {
    try {
      const workspace = await this.getWorkspace(workspaceId)
      if (!workspace) return false

      const botToken = this.decryptToken(workspace.bot_token)
      
      // Buscar canais públicos
      const publicChannels = await this.fetchSlackChannels(botToken, 'public_channel')
      
      // Buscar canais privados (se tiver permissão)
      const privateChannels = await this.fetchSlackChannels(botToken, 'private_channel')
      
      const allChannels = [...publicChannels, ...privateChannels]

      // Inserir/atualizar canais no banco
      for (const channel of allChannels) {
        await supabase
          .from('slack_channels')
          .upsert({
            workspace_id: workspaceId,
            channel_id: channel.id,
            channel_name: channel.name,
            purpose: channel.purpose?.value,
            is_private: channel.is_private,
            is_archived: channel.is_archived,
            notification_types: [], // Configurado depois pelo usuário
            message_format: 'rich'
          }, {
            onConflict: 'workspace_id,channel_id'
          })
      }

      return true
    } catch (error) {
      console.error('Erro ao sincronizar canais:', error)
      return false
    }
  }

  private async fetchSlackChannels(botToken: string, types: string): Promise<any[]> {
    try {
      let cursor = ''
      let allChannels: any[] = []

      do {
        const params = new URLSearchParams({
          types: types,
          limit: '200'
        })

        if (cursor) {
          params.set('cursor', cursor)
        }

        const response = await fetch(`https://slack.com/api/conversations.list?${params}`, {
          headers: {
            'Authorization': `Bearer ${botToken}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()

        if (data.ok) {
          allChannels = allChannels.concat(data.channels)
          cursor = data.response_metadata?.next_cursor || ''
        } else {
          console.error('Erro ao buscar canais:', data.error)
          break
        }
      } while (cursor)

      return allChannels
    } catch (error) {
      console.error('Erro ao buscar canais Slack:', error)
      return []
    }
  }

  // ==================== MESSAGE SENDING ====================

  /**
   * Envia notificação para Slack
   */
  async sendNotification(
    workspaceId: string,
    channelId: string,
    eventType: string,
    eventData: any
  ): Promise<boolean> {
    try {
      const workspace = await this.getWorkspace(workspaceId)
      const channel = await this.getChannel(channelId)
      
      if (!workspace || !channel || !workspace.is_active) {
        return false
      }

      // Verificar se o canal deve receber este tipo de evento
      if (!channel.notification_types.includes(eventType)) {
        return false
      }

      // Aplicar filtros se existirem
      if (!this.matchesFilters(eventData, channel.filters)) {
        return false
      }

      // Buscar template apropriado
      const template = await this.getMessageTemplate(workspace.agency_id, eventType)
      if (!template) {
        console.log(`Template não encontrado para evento ${eventType}`)
        return false
      }

      // Gerar mensagem
      const message = this.generateMessage(template, eventData)

      // Criar registro de notificação
      const { data: notification, error } = await supabase
        .from('slack_notifications')
        .insert({
          workspace_id: workspaceId,
          channel_id: channelId,
          event_type: eventType,
          event_data: eventData,
          message_text: message.text,
          message_blocks: message.blocks,
          status: 'pending'
        })
        .select('id')
        .single()

      if (error || !notification) {
        console.error('Erro ao criar notificação:', error)
        return false
      }

      // Enviar mensagem
      return await this.sendSlackMessage(notification.id, workspace, channel, message)

    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      return false
    }
  }

  private async sendSlackMessage(
    notificationId: string,
    workspace: SlackWorkspace,
    channel: SlackChannel,
    message: { text: string; blocks?: any }
  ): Promise<boolean> {
    const startTime = Date.now()

    try {
      const botToken = this.decryptToken(workspace.bot_token)

      const payload: any = {
        channel: channel.channel_id,
        text: message.text
      }

      if (message.blocks && channel.message_format === 'blocks') {
        payload.blocks = message.blocks
      }

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      if (data.ok) {
        // Atualizar como enviado
        await supabase
          .from('slack_notifications')
          .update({
            status: 'sent',
            slack_message_ts: data.ts,
            slack_channel_id: data.channel,
            slack_response: data,
            sent_at: new Date().toISOString(),
            duration_ms: duration
          })
          .eq('id', notificationId)

        // Atualizar último uso do workspace
        await supabase
          .from('slack_workspaces')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', workspace.id)

        return true
      } else {
        // Atualizar como falha
        await supabase
          .from('slack_notifications')
          .update({
            status: 'failed',
            error_message: data.error,
            slack_response: data,
            duration_ms: duration
          })
          .eq('id', notificationId)

        console.error('Erro Slack API:', data.error)
        return false
      }

    } catch (error: any) {
      const duration = Date.now() - startTime

      await supabase
        .from('slack_notifications')
        .update({
          status: 'failed',
          error_message: error.message,
          duration_ms: duration
        })
        .eq('id', notificationId)

      console.error('Erro ao enviar mensagem Slack:', error)
      return false
    }
  }

  // ==================== TEMPLATE ENGINE ====================

  private async getMessageTemplate(agencyId: string, eventType: string): Promise<SlackMessageTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('slack_message_templates')
        .select('*')
        .or(`and(agency_id.eq.${agencyId},event_type.eq.${eventType}),and(is_system_template.eq.true,event_type.eq.${eventType})`)
        .eq('is_active', true)
        .order('is_system_template', { ascending: true }) // Priorizar templates da agência
        .limit(1)
        .single()

      if (error) {
        console.error('Erro ao buscar template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar template:', error)
      return null
    }
  }

  private generateMessage(template: SlackMessageTemplate, eventData: any): { text: string; blocks?: any } {
    const text = this.interpolateTemplate(template.template_text || '', eventData)
    
    let blocks = null
    if (template.template_blocks && template.message_format === 'blocks') {
      blocks = this.interpolateBlocks(template.template_blocks, eventData)
    }

    return { text, blocks }
  }

  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim())
      return value !== undefined ? String(value) : match
    })
  }

  private interpolateBlocks(blocks: any, data: any): any {
    const json = JSON.stringify(blocks)
    const interpolated = this.interpolateTemplate(json, data)
    return JSON.parse(interpolated)
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // ==================== UTILITY METHODS ====================

  private generateState(agencyId: string): string {
    const timestamp = Date.now().toString()
    const data = `${agencyId}:${timestamp}`
    return Buffer.from(data).toString('base64')
  }

  private encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm'
    const key = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex')
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher(algorithm, key)
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return `${iv.toString('hex')}:${encrypted}`
  }

  private decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-gcm'
    const key = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex')
    const [ivHex, encrypted] = encryptedToken.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    
    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  private matchesFilters(data: any, filters: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(filters)) {
      const actualValue = this.getNestedValue(data, key)
      if (expectedValue !== actualValue) {
        return false
      }
    }
    return true
  }

  // ==================== DATABASE HELPERS ====================

  async getWorkspace(workspaceId: string): Promise<SlackWorkspace | null> {
    try {
      const { data, error } = await supabase
        .from('slack_workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()

      if (error) {
        console.error('Erro ao buscar workspace:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar workspace:', error)
      return null
    }
  }

  async getChannel(channelId: string): Promise<SlackChannel | null> {
    try {
      const { data, error } = await supabase
        .from('slack_channels')
        .select('*')
        .eq('id', channelId)
        .single()

      if (error) {
        console.error('Erro ao buscar canal:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar canal:', error)
      return null
    }
  }

  async getWorkspacesByAgency(agencyId: string): Promise<SlackWorkspace[]> {
    try {
      const { data, error } = await supabase
        .from('slack_workspaces')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar workspaces:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar workspaces:', error)
      return []
    }
  }

  async getChannelsByWorkspace(workspaceId: string): Promise<SlackChannel[]> {
    try {
      const { data, error } = await supabase
        .from('slack_channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_archived', false)
        .order('channel_name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar canais:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar canais:', error)
      return []
    }
  }

  // ==================== STATISTICS ====================

  async getSlackStats(agencyId?: string): Promise<{
    total_workspaces: number
    active_workspaces: number
    total_channels: number
    total_notifications: number
    successful_notifications: number
    failed_notifications: number
    success_rate: number
    notifications_last_24h: number
  }> {
    try {
      // Estatísticas de workspaces
      let workspaceQuery = supabase
        .from('slack_workspaces')
        .select('id, is_active')

      if (agencyId) {
        workspaceQuery = workspaceQuery.eq('agency_id', agencyId)
      }

      const { data: workspaces } = await workspaceQuery

      const totalWorkspaces = workspaces?.length || 0
      const activeWorkspaces = workspaces?.filter(w => w.is_active).length || 0

      // Estatísticas de canais
      let channelQuery = supabase.from('slack_channels').select('id')
      
      if (agencyId) {
        channelQuery = channelQuery.in('workspace_id', 
          workspaces?.map(w => w.id) || []
        )
      }

      const { data: channels } = await channelQuery
      const totalChannels = channels?.length || 0

      // Estatísticas de notificações
      let notificationQuery = supabase
        .from('slack_notifications')
        .select('status, created_at')

      if (agencyId) {
        notificationQuery = notificationQuery.in('workspace_id',
          workspaces?.map(w => w.id) || []
        )
      }

      const { data: notifications } = await notificationQuery

      const totalNotifications = notifications?.length || 0
      const successfulNotifications = notifications?.filter(n => n.status === 'sent').length || 0
      const failedNotifications = notifications?.filter(n => n.status === 'failed').length || 0
      const successRate = totalNotifications > 0 ? 
        (successfulNotifications / totalNotifications) * 100 : 0

      // Notificações das últimas 24 horas
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const notificationsLast24h = notifications?.filter(n => 
        new Date(n.created_at) > yesterday
      ).length || 0

      return {
        total_workspaces: totalWorkspaces,
        active_workspaces: activeWorkspaces,
        total_channels: totalChannels,
        total_notifications: totalNotifications,
        successful_notifications: successfulNotifications,
        failed_notifications: failedNotifications,
        success_rate: Number(successRate.toFixed(2)),
        notifications_last_24h: notificationsLast24h
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas Slack:', error)
      return {
        total_workspaces: 0,
        active_workspaces: 0,
        total_channels: 0,
        total_notifications: 0,
        successful_notifications: 0,
        failed_notifications: 0,
        success_rate: 0,
        notifications_last_24h: 0
      }
    }
  }
}

export const slackIntegration = new SlackIntegration()