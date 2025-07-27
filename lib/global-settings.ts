import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface GlobalSetting {
  id: string
  key: string
  value: any
  category: string
  description?: string
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'url' | 'email'
  is_public: boolean
  is_encrypted: boolean
  validation_rules?: any
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AgencySetting {
  id: string
  agency_id: string
  key: string
  value: any
  category: string
  description?: string
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'url' | 'email'
  is_encrypted: boolean
  validation_rules?: any
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SettingsHistory {
  id: string
  setting_type: 'global' | 'agency'
  setting_id: string
  agency_id?: string
  key: string
  old_value?: any
  new_value: any
  change_reason: string
  changed_by?: string
  changed_at: string
}

export interface SettingsTemplate {
  id: string
  name: string
  description?: string
  category: string
  template_data: any
  is_default: boolean
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export class GlobalSettingsManager {
  
  // ==================== GLOBAL SETTINGS ====================
  
  async getGlobalSetting(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('value, data_type')
        .eq('key', key)
        .single()

      if (error) {
        console.error(`Erro ao buscar configuração global ${key}:`, error)
        return null
      }

      return this.parseValue(data.value, data.data_type)
    } catch (error) {
      console.error(`Erro ao buscar configuração global ${key}:`, error)
      return null
    }
  }

  async getAllGlobalSettings(category?: string, publicOnly = false): Promise<Record<string, any>> {
    try {
      let query = supabase
        .from('global_settings')
        .select('key, value, data_type, category, is_public')

      if (category) {
        query = query.eq('category', category)
      }

      if (publicOnly) {
        query = query.eq('is_public', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar configurações globais:', error)
        return {}
      }

      const settings: Record<string, any> = {}
      data.forEach(setting => {
        settings[setting.key] = this.parseValue(setting.value, setting.data_type)
      })

      return settings
    } catch (error) {
      console.error('Erro ao buscar configurações globais:', error)
      return {}
    }
  }

  async setGlobalSetting(
    key: string, 
    value: any, 
    options: {
      category?: string
      description?: string
      data_type?: string
      is_public?: boolean
      is_encrypted?: boolean
      validation_rules?: any
      change_reason?: string
    } = {}
  ): Promise<boolean> {
    try {
      const serializedValue = this.serializeValue(value, options.data_type || 'string')

      const { error } = await supabase
        .from('global_settings')
        .upsert({
          key,
          value: serializedValue,
          category: options.category || 'system',
          description: options.description,
          data_type: options.data_type || 'string',
          is_public: options.is_public || false,
          is_encrypted: options.is_encrypted || false,
          validation_rules: options.validation_rules,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error(`Erro ao definir configuração global ${key}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao definir configuração global ${key}:`, error)
      return false
    }
  }

  async deleteGlobalSetting(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('global_settings')
        .delete()
        .eq('key', key)

      if (error) {
        console.error(`Erro ao deletar configuração global ${key}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar configuração global ${key}:`, error)
      return false
    }
  }

  // ==================== AGENCY SETTINGS ====================

  async getAgencySetting(agencyId: string, key: string): Promise<any> {
    try {
      // Primeiro tenta buscar configuração específica da agência
      const { data: agencySetting, error: agencyError } = await supabase
        .from('agency_settings')
        .select('value, data_type')
        .eq('agency_id', agencyId)
        .eq('key', key)
        .single()

      if (!agencyError && agencySetting) {
        return this.parseValue(agencySetting.value, agencySetting.data_type)
      }

      // Se não encontrou na agência, busca configuração global
      return await this.getGlobalSetting(key)
    } catch (error) {
      console.error(`Erro ao buscar configuração da agência ${key}:`, error)
      return null
    }
  }

  async getAllAgencySettings(agencyId: string, category?: string): Promise<Record<string, any>> {
    try {
      // Buscar configurações globais primeiro
      const globalSettings = await this.getAllGlobalSettings(category)

      // Buscar configurações específicas da agência
      let query = supabase
        .from('agency_settings')
        .select('key, value, data_type, category')
        .eq('agency_id', agencyId)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar configurações da agência:', error)
        return globalSettings
      }

      // Sobrescrever configurações globais com as da agência
      const agencySettings = { ...globalSettings }
      data.forEach(setting => {
        agencySettings[setting.key] = this.parseValue(setting.value, setting.data_type)
      })

      return agencySettings
    } catch (error) {
      console.error('Erro ao buscar configurações da agência:', error)
      return {}
    }
  }

  async setAgencySetting(
    agencyId: string,
    key: string,
    value: any,
    options: {
      category?: string
      description?: string
      data_type?: string
      is_encrypted?: boolean
      validation_rules?: any
      change_reason?: string
    } = {}
  ): Promise<boolean> {
    try {
      const serializedValue = this.serializeValue(value, options.data_type || 'string')

      const { error } = await supabase
        .from('agency_settings')
        .upsert({
          agency_id: agencyId,
          key,
          value: serializedValue,
          category: options.category || 'branding',
          description: options.description,
          data_type: options.data_type || 'string',
          is_encrypted: options.is_encrypted || false,
          validation_rules: options.validation_rules,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error(`Erro ao definir configuração da agência ${key}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao definir configuração da agência ${key}:`, error)
      return false
    }
  }

  async deleteAgencySetting(agencyId: string, key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agency_settings')
        .delete()
        .eq('agency_id', agencyId)
        .eq('key', key)

      if (error) {
        console.error(`Erro ao deletar configuração da agência ${key}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar configuração da agência ${key}:`, error)
      return false
    }
  }

  // ==================== SETTINGS HISTORY ====================

  async getSettingsHistory(
    settingId?: string,
    agencyId?: string,
    settingType?: 'global' | 'agency',
    limit = 50
  ): Promise<SettingsHistory[]> {
    try {
      let query = supabase
        .from('settings_history')
        .select(`
          id, setting_type, setting_id, agency_id, key,
          old_value, new_value, change_reason, changed_by,
          changed_at
        `)
        .order('changed_at', { ascending: false })
        .limit(limit)

      if (settingId) {
        query = query.eq('setting_id', settingId)
      }

      if (agencyId) {
        query = query.eq('agency_id', agencyId)
      }

      if (settingType) {
        query = query.eq('setting_type', settingType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar histórico de configurações:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico de configurações:', error)
      return []
    }
  }

  // ==================== SETTINGS TEMPLATES ====================

  async getSettingsTemplates(category?: string): Promise<SettingsTemplate[]> {
    try {
      let query = supabase
        .from('settings_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar templates de configuração:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar templates de configuração:', error)
      return []
    }
  }

  async applyTemplate(templateId: string, agencyId?: string): Promise<boolean> {
    try {
      const { data: template, error: templateError } = await supabase
        .from('settings_templates')
        .select('template_data')
        .eq('id', templateId)
        .single()

      if (templateError || !template) {
        console.error('Template não encontrado:', templateError)
        return false
      }

      const settings = template.template_data
      const promises: Promise<boolean>[] = []

      // Aplicar configurações do template
      for (const [key, config] of Object.entries(settings as Record<string, any>)) {
        if (agencyId) {
          promises.push(
            this.setAgencySetting(agencyId, key, config.value, {
              category: config.category,
              description: config.description,
              data_type: config.data_type
            })
          )
        } else {
          promises.push(
            this.setGlobalSetting(key, config.value, {
              category: config.category,
              description: config.description,
              data_type: config.data_type,
              is_public: config.is_public
            })
          )
        }
      }

      const results = await Promise.all(promises)
      return results.every(result => result)
    } catch (error) {
      console.error('Erro ao aplicar template:', error)
      return false
    }
  }

  // ==================== UTILITY METHODS ====================

  private parseValue(value: any, dataType: string): any {
    if (value === null || value === undefined) return null

    try {
      switch (dataType) {
        case 'boolean':
          return typeof value === 'boolean' ? value : value === 'true'
        case 'number':
          return typeof value === 'number' ? value : parseFloat(value)
        case 'json':
        case 'array':
          return typeof value === 'object' ? value : JSON.parse(value)
        case 'string':
        case 'url':
        case 'email':
        default:
          return typeof value === 'string' ? value : String(value)
      }
    } catch (error) {
      console.error('Erro ao fazer parse do valor:', error)
      return value
    }
  }

  private serializeValue(value: any, dataType: string): any {
    try {
      switch (dataType) {
        case 'json':
        case 'array':
          return typeof value === 'object' ? value : JSON.parse(value)
        case 'boolean':
          return Boolean(value)
        case 'number':
          return Number(value)
        case 'string':
        case 'url':
        case 'email':
        default:
          return String(value)
      }
    } catch (error) {
      console.error('Erro ao serializar valor:', error)
      return value
    }
  }

  // ==================== HELPER METHODS ====================

  async isMaintenanceMode(): Promise<boolean> {
    return await this.getGlobalSetting('system.maintenance_mode') || false
  }

  async getSystemInfo(): Promise<{
    name: string
    version: string
    timezone: string
    maintenance: boolean
  }> {
    const [name, version, timezone, maintenance] = await Promise.all([
      this.getGlobalSetting('system.name'),
      this.getGlobalSetting('system.version'),
      this.getGlobalSetting('system.timezone'),
      this.getGlobalSetting('system.maintenance_mode')
    ])

    return {
      name: name || 'FVStudios Dashboard',
      version: version || '1.0.0',
      timezone: timezone || 'America/Sao_Paulo',
      maintenance: maintenance || false
    }
  }

  async getFeatureFlags(agencyId?: string): Promise<Record<string, boolean>> {
    const settings = agencyId 
      ? await this.getAllAgencySettings(agencyId, 'features')
      : await this.getAllGlobalSettings('features')

    const features: Record<string, boolean> = {}
    Object.entries(settings).forEach(([key, value]) => {
      if (key.startsWith('features.')) {
        const featureName = key.replace('features.', '')
        features[featureName] = Boolean(value)
      }
    })

    return features
  }

  async getLimits(agencyId?: string): Promise<Record<string, number>> {
    const settings = agencyId 
      ? await this.getAllAgencySettings(agencyId, 'limits')
      : await this.getAllGlobalSettings('limits')

    const limits: Record<string, number> = {}
    Object.entries(settings).forEach(([key, value]) => {
      if (key.startsWith('limits.')) {
        const limitName = key.replace('limits.', '')
        limits[limitName] = Number(value) || 0
      }
    })

    return limits
  }
}

export const globalSettings = new GlobalSettingsManager()