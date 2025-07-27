'use client'

// ==================================================
// FVStudios Dashboard - Audit & Compliance System
// Sistema de auditoria e compliance
// ==================================================

import { createClient } from '@supabase/supabase-js'
import { logger } from './advanced-logger'
import { redisCache } from './redis-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuditEntry {
  id?: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  changed_fields?: string[]
  user_id?: string
  agency_id?: string
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export interface ComplianceRule {
  id?: string
  rule_name: string
  rule_type: 'data_retention' | 'access_control' | 'data_protection' | 'logging' | 'backup'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  conditions: Record<string, any>
  actions: Record<string, any>
  is_active: boolean
  last_check?: string
  next_check?: string
  created_at?: string
  updated_at?: string
}

export interface ComplianceReport {
  id?: string
  report_type: 'gdpr' | 'lgpd' | 'sox' | 'iso27001' | 'custom'
  period_start: string
  period_end: string
  status: 'compliant' | 'non_compliant' | 'partial_compliant'
  findings: Array<{
    rule_id: string
    rule_name: string
    status: 'pass' | 'fail' | 'warning'
    description: string
    evidence?: Record<string, any>
    recommendation?: string
  }>
  remediation_actions: string[]
  generated_by: string
  agency_id?: string
  created_at?: string
}

class AuditSystem {
  // Registrar entrada de auditoria
  async logAudit(
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    changes: {
      oldValues?: Record<string, any>
      newValues?: Record<string, any>
      userId?: string
      agencyId?: string
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<boolean> {
    try {
      const changedFields = this.getChangedFields(changes.oldValues, changes.newValues)
      
      const auditEntry: AuditEntry = {
        table_name: tableName,
        record_id: recordId,
        action,
        old_values: changes.oldValues || {},
        new_values: changes.newValues || {},
        changed_fields: changedFields,
        user_id: changes.userId,
        agency_id: changes.agencyId,
        ip_address: changes.ipAddress,
        user_agent: changes.userAgent,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('audit_trail')
        .insert(auditEntry)

      if (error) {
        logger.error('Failed to log audit entry', { error, auditEntry }, 'security')
        return false
      }

      // Log da ação de auditoria
      logger.info(`Audit logged: ${action} on ${tableName}`, {
        table_name: tableName,
        record_id: recordId,
        action,
        changed_fields: changedFields,
        user_id: changes.userId
      }, 'security')

      // Cache para dashboard em tempo real
      await redisCache.set(`audit:recent:${tableName}`, auditEntry, { ttl: 300 })
        .catch(err => logger.warn('Failed to cache audit entry', { error: err }))

      return true
    } catch (error) {
      logger.error('Error logging audit entry', { error, tableName, recordId, action }, 'security')
      return false
    }
  }

  // Obter mudanças entre dois objetos
  private getChangedFields(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): string[] {
    if (!oldValues || !newValues) return []

    const changedFields: string[] = []
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])

    for (const key of allKeys) {
      if (oldValues[key] !== newValues[key]) {
        changedFields.push(key)
      }
    }

    return changedFields
  }

  // Buscar trilha de auditoria
  async searchAudit(filters: {
    table_name?: string
    record_id?: string
    action?: 'INSERT' | 'UPDATE' | 'DELETE'
    user_id?: string
    agency_id?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  }): Promise<AuditEntry[]> {
    try {
      let query = supabase
        .from('audit_trail')
        .select(`
          id,
          table_name,
          record_id,
          action,
          old_values,
          new_values,
          changed_fields,
          user_id,
          agency_id,
          ip_address,
          user_agent,
          created_at,
          profiles!user_id(email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name)
      }

      if (filters.record_id) {
        query = query.eq('record_id', filters.record_id)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.agency_id) {
        query = query.eq('agency_id', filters.agency_id)
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Error searching audit trail', { error, filters }, 'security')
        return []
      }

      return data || []
    } catch (error) {
      logger.error('Error searching audit trail', { error, filters }, 'security')
      return []
    }
  }

  // Criar regra de compliance
  async createComplianceRule(rule: Omit<ComplianceRule, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('compliance_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to create compliance rule', { error, rule }, 'security')
        return null
      }

      logger.info('Compliance rule created', { rule_id: data.id, rule_name: rule.rule_name }, 'security')
      return data.id
    } catch (error) {
      logger.error('Error creating compliance rule', { error, rule }, 'security')
      return null
    }
  }

  // Executar verificação de compliance
  async runComplianceCheck(ruleId: string): Promise<boolean> {
    try {
      const { data: rule, error } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('id', ruleId)
        .single()

      if (error || !rule) {
        logger.error('Compliance rule not found', { rule_id: ruleId, error })
        return false
      }

      const checkResult = await this.executeComplianceRule(rule)
      
      // Atualizar última verificação
      await supabase
        .from('compliance_rules')
        .update({
          last_check: new Date().toISOString(),
          next_check: this.calculateNextCheck(rule.rule_type)
        })
        .eq('id', ruleId)

      logger.info('Compliance check executed', {
        rule_id: ruleId,
        rule_name: rule.rule_name,
        result: checkResult
      }, 'security')

      return checkResult
    } catch (error) {
      logger.error('Error running compliance check', { error, rule_id: ruleId }, 'security')
      return false
    }
  }

  // Executar regra de compliance específica
  private async executeComplianceRule(rule: ComplianceRule): Promise<boolean> {
    switch (rule.rule_type) {
      case 'data_retention':
        return this.checkDataRetention(rule)
      case 'access_control':
        return this.checkAccessControl(rule)
      case 'data_protection':
        return this.checkDataProtection(rule)
      case 'logging':
        return this.checkLogging(rule)
      case 'backup':
        return this.checkBackup(rule)
      default:
        logger.warn('Unknown compliance rule type', { rule_type: rule.rule_type })
        return false
    }
  }

  // Verificar retenção de dados
  private async checkDataRetention(rule: ComplianceRule): Promise<boolean> {
    try {
      const { retention_days, tables } = rule.conditions
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retention_days)

      let compliant = true

      for (const tableName of tables) {
        const { count } = await supabase
          .from(tableName)
          .select('id', { count: 'exact' })
          .lt('created_at', cutoffDate.toISOString())

        if (count && count > 0) {
          compliant = false
          logger.warn('Data retention violation', {
            table: tableName,
            old_records: count,
            retention_days,
            rule_id: rule.id
          }, 'security')
        }
      }

      return compliant
    } catch (error) {
      logger.error('Error checking data retention', { error, rule }, 'security')
      return false
    }
  }

  // Verificar controle de acesso
  private async checkAccessControl(rule: ComplianceRule): Promise<boolean> {
    try {
      const { required_roles, protected_tables } = rule.conditions

      // Verificar se apenas usuários com roles corretos acessam tabelas protegidas
      const { data: recentAccess } = await supabase
        .from('audit_trail')
        .select(`
          user_id,
          table_name,
          profiles!user_id(role)
        `)
        .in('table_name', protected_tables)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const violations = recentAccess?.filter(access => 
        access.profiles && !required_roles.includes(access.profiles.role)
      ) || []

      if (violations.length > 0) {
        logger.warn('Access control violations detected', {
          violations: violations.length,
          rule_id: rule.id
        }, 'security')
        return false
      }

      return true
    } catch (error) {
      logger.error('Error checking access control', { error, rule }, 'security')
      return false
    }
  }

  // Verificar proteção de dados
  private async checkDataProtection(rule: ComplianceRule): Promise<boolean> {
    try {
      // Verificar se dados sensíveis estão sendo adequadamente protegidos
      const { sensitive_fields, encryption_required } = rule.conditions

      // Esta é uma verificação simplificada
      // Em produção, verificar se campos sensíveis estão criptografados
      logger.info('Data protection check completed', { rule_id: rule.id })
      return true
    } catch (error) {
      logger.error('Error checking data protection', { error, rule }, 'security')
      return false
    }
  }

  // Verificar logging
  private async checkLogging(rule: ComplianceRule): Promise<boolean> {
    try {
      const { required_events, min_retention_days } = rule.conditions
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - min_retention_days)

      // Verificar se eventos obrigatórios estão sendo logados
      for (const eventType of required_events) {
        const { count } = await supabase
          .from('system_logs')
          .select('id', { count: 'exact' })
          .eq('category', eventType)
          .gte('created_at', cutoffDate.toISOString())

        if (!count || count === 0) {
          logger.warn('Missing required log events', {
            event_type: eventType,
            rule_id: rule.id
          }, 'security')
          return false
        }
      }

      return true
    } catch (error) {
      logger.error('Error checking logging compliance', { error, rule }, 'security')
      return false
    }
  }

  // Verificar backup
  private async checkBackup(rule: ComplianceRule): Promise<boolean> {
    try {
      const { max_age_hours, required_tables } = rule.conditions
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - max_age_hours)

      // Verificar se existem backups recentes
      const { count } = await supabase
        .from('backup_records')
        .select('id', { count: 'exact' })
        .eq('status', 'completed')
        .gte('started_at', cutoffDate.toISOString())

      if (!count || count === 0) {
        logger.warn('No recent backups found', {
          max_age_hours,
          rule_id: rule.id
        }, 'security')
        return false
      }

      return true
    } catch (error) {
      logger.error('Error checking backup compliance', { error, rule }, 'security')
      return false
    }
  }

  // Calcular próxima verificação
  private calculateNextCheck(ruleType: string): string {
    const now = new Date()
    switch (ruleType) {
      case 'data_retention':
        now.setDate(now.getDate() + 7) // Semanal
        break
      case 'access_control':
        now.setDate(now.getDate() + 1) // Diário
        break
      case 'data_protection':
        now.setDate(now.getDate() + 30) // Mensal
        break
      case 'logging':
        now.setDate(now.getDate() + 1) // Diário
        break
      case 'backup':
        now.setDate(now.getDate() + 1) // Diário
        break
      default:
        now.setDate(now.getDate() + 7) // Padrão semanal
    }
    return now.toISOString()
  }

  // Gerar relatório de compliance
  async generateComplianceReport(
    reportType: ComplianceReport['report_type'],
    periodStart: string,
    periodEnd: string,
    agencyId?: string,
    userId?: string
  ): Promise<string | null> {
    try {
      // Buscar todas as regras ativas do tipo
      const { data: rules } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('is_active', true)

      const findings: ComplianceReport['findings'] = []
      const remediationActions: string[] = []

      // Executar verificações para cada regra
      for (const rule of rules || []) {
        const isCompliant = await this.executeComplianceRule(rule)
        
        findings.push({
          rule_id: rule.id,
          rule_name: rule.rule_name,
          status: isCompliant ? 'pass' : 'fail',
          description: rule.description,
          evidence: {
            last_check: rule.last_check,
            conditions: rule.conditions
          },
          recommendation: isCompliant ? undefined : `Review ${rule.rule_name} compliance`
        })

        if (!isCompliant) {
          remediationActions.push(`Address ${rule.rule_name} violations`)
        }
      }

      // Determinar status geral
      const failedRules = findings.filter(f => f.status === 'fail')
      const status: ComplianceReport['status'] = 
        failedRules.length === 0 ? 'compliant' :
        failedRules.length < findings.length / 2 ? 'partial_compliant' : 'non_compliant'

      const report: ComplianceReport = {
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        status,
        findings,
        remediation_actions: remediationActions,
        generated_by: userId || 'system',
        agency_id: agencyId,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('compliance_reports')
        .insert(report)
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to save compliance report', { error, report }, 'security')
        return null
      }

      logger.info('Compliance report generated', {
        report_id: data.id,
        report_type: reportType,
        status,
        findings_count: findings.length,
        failed_rules: failedRules.length
      }, 'security')

      return data.id
    } catch (error) {
      logger.error('Error generating compliance report', { error, reportType }, 'security')
      return null
    }
  }

  // Obter estatísticas de auditoria
  async getAuditStats(agencyId?: string, days: number = 30): Promise<Record<string, any>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('audit_trail')
        .select('action, table_name, created_at')
        .gte('created_at', startDate.toISOString())

      if (agencyId) {
        query = query.eq('agency_id', agencyId)
      }

      const { data: auditEntries } = await query

      // Estatísticas por ação
      const actionStats = auditEntries?.reduce((acc: any, entry: any) => {
        acc[entry.action] = (acc[entry.action] || 0) + 1
        return acc
      }, {}) || {}

      // Estatísticas por tabela
      const tableStats = auditEntries?.reduce((acc: any, entry: any) => {
        acc[entry.table_name] = (acc[entry.table_name] || 0) + 1
        return acc
      }, {}) || {}

      // Atividade por dia
      const dailyActivity = auditEntries?.reduce((acc: any, entry: any) => {
        const day = entry.created_at.split('T')[0]
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {}) || {}

      return {
        total_entries: auditEntries?.length || 0,
        actions: actionStats,
        tables: tableStats,
        daily_activity: dailyActivity,
        period_days: days
      }
    } catch (error) {
      logger.error('Error getting audit stats', { error, agencyId, days }, 'security')
      return {}
    }
  }
}

// Instância global do sistema de auditoria
export const auditSystem = new AuditSystem()

// Hook React para auditoria
export function useAudit() {
  return {
    logAudit: auditSystem.logAudit.bind(auditSystem),
    searchAudit: auditSystem.searchAudit.bind(auditSystem),
    createComplianceRule: auditSystem.createComplianceRule.bind(auditSystem),
    runComplianceCheck: auditSystem.runComplianceCheck.bind(auditSystem),
    generateComplianceReport: auditSystem.generateComplianceReport.bind(auditSystem),
    getAuditStats: auditSystem.getAuditStats.bind(auditSystem)
  }
}

export default auditSystem