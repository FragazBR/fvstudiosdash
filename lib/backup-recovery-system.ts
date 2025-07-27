'use client'

// ==================================================
// FVStudios Dashboard - Backup & Recovery System
// Sistema de backup e recuperação para dados críticos
// ==================================================

import { createClient } from '@supabase/supabase-js'
import { redisCache } from './redis-cache'
import { toast } from 'sonner'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BackupConfig {
  id: string
  agency_id: string
  backup_type: 'full' | 'incremental' | 'critical_only'
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual'
  retention_days: number
  include_tables: string[]
  exclude_tables: string[]
  compress: boolean
  encrypt: boolean
  storage_location: 'supabase' | 's3' | 'local'
  is_active: boolean
  last_backup: Date | null
  next_backup: Date | null
  created_at: Date
  updated_at: Date
}

export interface BackupRecord {
  id: string
  agency_id: string
  backup_type: 'full' | 'incremental' | 'critical_only'
  file_path: string
  file_size: number
  checksum: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: Date
  completed_at: Date | null
  error_message: string | null
  metadata: Record<string, any>
  created_by: string
}

export interface RecoveryPoint {
  id: string
  backup_id: string
  agency_id: string
  recovery_type: 'full_restore' | 'partial_restore' | 'point_in_time'
  target_timestamp: Date
  tables_to_restore: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress_percentage: number
  estimated_completion: Date | null
  error_message: string | null
  created_by: string
  created_at: Date
}

// Tabelas críticas que sempre devem ser incluídas no backup
const CRITICAL_TABLES = [
  'agencies',
  'profiles', 
  'user_profiles',
  'projects',
  'clients',
  'credits_usage',
  'whatsapp_config',
  'notification_templates',
  'realtime_notifications'
]

// Tabelas de sistema que podem ser excluídas
const SYSTEM_TABLES = [
  'system_logs',
  'cache_stats',
  'temporary_uploads',
  'session_data'
]

class BackupRecoveryManager {
  private readonly BACKUP_PREFIX = 'fvstudios_backup'
  private readonly ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'default-key'

  // Criar configuração de backup
  async createBackupConfig(
    agencyId: string,
    config: Omit<BackupConfig, 'id' | 'agency_id' | 'created_at' | 'updated_at'>
  ): Promise<BackupConfig | null> {
    try {
      const { data, error } = await supabase
        .from('backup_configs')
        .insert({
          agency_id: agencyId,
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar configuração de backup:', error)
        return null
      }

      return data as BackupConfig
    } catch (error) {
      console.error('Erro ao criar configuração de backup:', error)
      return null
    }
  }

  // Executar backup
  async executeBackup(
    agencyId: string,
    backupType: 'full' | 'incremental' | 'critical_only',
    userId: string,
    manual: boolean = false
  ): Promise<string | null> {
    try {
      // Criar registro de backup
      const backupId = `${this.BACKUP_PREFIX}_${agencyId}_${Date.now()}`
      
      const { data: backupRecord, error: recordError } = await supabase
        .from('backup_records')
        .insert({
          id: backupId,
          agency_id: agencyId,
          backup_type: backupType,
          file_path: '',
          file_size: 0,
          checksum: '',
          status: 'pending',
          started_at: new Date().toISOString(),
          metadata: { manual, initiated_by: userId },
          created_by: userId
        })
        .select()
        .single()

      if (recordError) {
        console.error('Erro ao criar registro de backup:', recordError)
        return null
      }

      // Iniciar processo de backup (assíncrono)
      this.performBackup(backupId, agencyId, backupType).catch(error => {
        console.error('Erro no processo de backup:', error)
        this.updateBackupStatus(backupId, 'failed', error.message)
      })

      return backupId
    } catch (error) {
      console.error('Erro ao executar backup:', error)
      return null
    }
  }

  // Processo interno de backup
  private async performBackup(
    backupId: string,
    agencyId: string,
    backupType: 'full' | 'incremental' | 'critical_only'
  ): Promise<void> {
    await this.updateBackupStatus(backupId, 'running')

    try {
      // Determinar tabelas para backup
      let tablesToBackup: string[] = []
      
      switch (backupType) {
        case 'critical_only':
          tablesToBackup = CRITICAL_TABLES
          break
        case 'full':
          tablesToBackup = await this.getAllTables()
          break
        case 'incremental':
          tablesToBackup = await this.getModifiedTables(agencyId)
          break
      }

      const backupData: Record<string, any[]> = {}
      let totalSize = 0

      // Backup de cada tabela
      for (const table of tablesToBackup) {
        try {
          const tableData = await this.backupTable(table, agencyId)
          backupData[table] = tableData
          totalSize += JSON.stringify(tableData).length
        } catch (tableError) {
          console.warn(`Erro ao fazer backup da tabela ${table}:`, tableError)
          // Continuar com outras tabelas
        }
      }

      // Adicionar metadados
      const metadata = {
        backup_id: backupId,
        agency_id: agencyId,
        backup_type: backupType,
        timestamp: new Date().toISOString(),
        tables_count: tablesToBackup.length,
        version: '1.0'
      }

      const finalBackup = {
        metadata,
        data: backupData
      }

      // Comprimir se necessário
      const backupString = JSON.stringify(finalBackup)
      const compressed = this.compressData(backupString)
      
      // Criptografar se necessário
      const encrypted = this.encryptData(compressed)
      
      // Calcular checksum
      const checksum = this.calculateChecksum(encrypted)
      
      // Salvar backup (simulado - em produção usar S3 ou storage externo)
      const filePath = await this.saveBackupFile(backupId, encrypted)
      
      // Atualizar registro
      await supabase
        .from('backup_records')
        .update({
          file_path: filePath,
          file_size: encrypted.length,
          checksum: checksum,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', backupId)

      console.log(`Backup ${backupId} concluído com sucesso`)
      
      // Limpar cache relacionado
      await redisCache.invalidateByTags(['backup', 'agency'])

    } catch (error) {
      await this.updateBackupStatus(backupId, 'failed', error instanceof Error ? error.message : 'Erro desconhecido')
      throw error
    }
  }

  // Backup de uma tabela específica
  private async backupTable(tableName: string, agencyId: string): Promise<any[]> {
    try {
      let query = supabase.from(tableName).select('*')
      
      // Filtrar por agência se a tabela tiver agency_id
      const hasAgencyId = await this.tableHasColumn(tableName, 'agency_id')
      if (hasAgencyId) {
        query = query.eq('agency_id', agencyId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Erro ao fazer backup da tabela ${tableName}: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error(`Erro no backup da tabela ${tableName}:`, error)
      throw error
    }
  }

  // Verificar se tabela tem coluna específica
  private async tableHasColumn(tableName: string, columnName: string): Promise<boolean> {
    try {
      // Esta é uma verificação simplificada
      // Em produção, usar informações do schema do banco
      const commonTablesWithAgencyId = [
        'projects', 'clients', 'tasks', 'credits_usage', 
        'whatsapp_config', 'notification_templates', 'realtime_notifications'
      ]
      
      return commonTablesWithAgencyId.includes(tableName)
    } catch {
      return false
    }
  }

  // Obter todas as tabelas
  private async getAllTables(): Promise<string[]> {
    // Em produção, consultar o schema do banco
    return [
      ...CRITICAL_TABLES,
      'tasks',
      'task_assignments', 
      'project_stages',
      'client_communications',
      'file_uploads',
      'integrations_config'
    ]
  }

  // Obter tabelas modificadas (para backup incremental)
  private async getModifiedTables(agencyId: string): Promise<string[]> {
    // Implementação simplificada - verificar última modificação
    const modifiedSince = new Date()
    modifiedSince.setHours(modifiedSince.getHours() - 24) // Últimas 24h
    
    return CRITICAL_TABLES // Por simplicidade, usar tabelas críticas
  }

  // Comprimir dados
  private compressData(data: string): string {
    // Implementação simplificada de compressão
    // Em produção, usar biblioteca como zlib
    try {
      return btoa(data) // Base64 como simulação
    } catch {
      return data
    }
  }

  // Criptografar dados
  private encryptData(data: string): string {
    // Implementação simplificada de criptografia
    // Em produção, usar AES-256 ou similar
    try {
      const encoded = btoa(this.ENCRYPTION_KEY + data)
      return encoded
    } catch {
      return data
    }
  }

  // Calcular checksum
  private calculateChecksum(data: string): string {
    // Implementação simplificada de hash
    // Em produção, usar SHA-256
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  // Salvar arquivo de backup
  private async saveBackupFile(backupId: string, data: string): Promise<string> {
    // Em produção, salvar em S3, Google Cloud Storage, etc.
    // Por agora, simular salvamento local/supabase storage
    const fileName = `${backupId}.bak`
    const filePath = `backups/${fileName}`
    
    try {
      // Simulação de upload para Supabase Storage
      const { error } = await supabase.storage
        .from('backups')
        .upload(filePath, data, {
          contentType: 'application/octet-stream',
          upsert: true
        })

      if (error) {
        console.warn('Erro ao salvar no storage, usando fallback:', error)
        // Fallback: salvar referência no cache
        await redisCache.set(`backup:${backupId}`, data, { ttl: 86400 * 7 }) // 7 dias
        return `cache:${backupId}`
      }

      return filePath
    } catch (error) {
      console.error('Erro ao salvar backup:', error)
      throw error
    }
  }

  // Atualizar status do backup
  private async updateBackupStatus(
    backupId: string, 
    status: 'pending' | 'running' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { status }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    await supabase
      .from('backup_records')
      .update(updateData)
      .eq('id', backupId)
  }

  // Listar backups de uma agência
  async listBackups(agencyId: string, limit: number = 20): Promise<BackupRecord[]> {
    try {
      const { data, error } = await supabase
        .from('backup_records')
        .select('*')
        .eq('agency_id', agencyId)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao listar backups:', error)
        return []
      }

      return (data || []) as BackupRecord[]
    } catch (error) {
      console.error('Erro ao listar backups:', error)
      return []
    }
  }

  // Iniciar processo de recuperação
  async initiateRecovery(
    backupId: string,
    agencyId: string,
    recoveryType: 'full_restore' | 'partial_restore' | 'point_in_time',
    userId: string,
    options: {
      tablesToRestore?: string[]
      targetTimestamp?: Date
      confirmOverwrite?: boolean
    } = {}
  ): Promise<string | null> {
    try {
      // Verificar se backup existe
      const { data: backup, error: backupError } = await supabase
        .from('backup_records')
        .select('*')
        .eq('id', backupId)
        .eq('agency_id', agencyId)
        .eq('status', 'completed')
        .single()

      if (backupError || !backup) {
        throw new Error('Backup não encontrado ou não está completo')
      }

      // Criar registro de recuperação
      const recoveryId = `recovery_${Date.now()}`
      
      const { data: recoveryRecord, error: recoveryError } = await supabase
        .from('recovery_points')
        .insert({
          id: recoveryId,
          backup_id: backupId,
          agency_id: agencyId,
          recovery_type: recoveryType,
          target_timestamp: options.targetTimestamp?.toISOString() || backup.started_at,
          tables_to_restore: options.tablesToRestore || [],
          status: 'pending',
          progress_percentage: 0,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (recoveryError) {
        console.error('Erro ao criar registro de recuperação:', recoveryError)
        return null
      }

      // Iniciar processo de recuperação (assíncrono)
      this.performRecovery(recoveryId, backup, recoveryType, options).catch(error => {
        console.error('Erro no processo de recuperação:', error)
        this.updateRecoveryStatus(recoveryId, 'failed', 0, error.message)
      })

      return recoveryId
    } catch (error) {
      console.error('Erro ao iniciar recuperação:', error)
      return null
    }
  }

  // Processo interno de recuperação
  private async performRecovery(
    recoveryId: string,
    backup: BackupRecord,
    recoveryType: 'full_restore' | 'partial_restore' | 'point_in_time',
    options: any
  ): Promise<void> {
    await this.updateRecoveryStatus(recoveryId, 'running', 10)

    try {
      // Carregar dados do backup
      const backupData = await this.loadBackupData(backup.file_path)
      
      if (!backupData) {
        throw new Error('Não foi possível carregar dados do backup')
      }

      await this.updateRecoveryStatus(recoveryId, 'running', 30)

      // Determinar tabelas para restaurar
      let tablesToRestore: string[] = []
      
      if (recoveryType === 'full_restore') {
        tablesToRestore = Object.keys(backupData.data)
      } else if (recoveryType === 'partial_restore') {
        tablesToRestore = options.tablesToRestore || []
      } else if (recoveryType === 'point_in_time') {
        // Para point-in-time, usar todas as tabelas até o timestamp
        tablesToRestore = Object.keys(backupData.data)
      }

      await this.updateRecoveryStatus(recoveryId, 'running', 50)

      // Restaurar cada tabela
      const totalTables = tablesToRestore.length
      let processedTables = 0

      for (const tableName of tablesToRestore) {
        try {
          await this.restoreTable(tableName, backupData.data[tableName], backup.agency_id)
          processedTables++
          
          const progress = 50 + Math.round((processedTables / totalTables) * 40)
          await this.updateRecoveryStatus(recoveryId, 'running', progress)
        } catch (tableError) {
          console.warn(`Erro ao restaurar tabela ${tableName}:`, tableError)
          // Continuar com outras tabelas
        }
      }

      await this.updateRecoveryStatus(recoveryId, 'completed', 100)
      
      // Limpar cache após recuperação
      await redisCache.invalidateAgency(backup.agency_id)
      
      console.log(`Recuperação ${recoveryId} concluída com sucesso`)

    } catch (error) {
      await this.updateRecoveryStatus(recoveryId, 'failed', 0, error instanceof Error ? error.message : 'Erro desconhecido')
      throw error
    }
  }

  // Carregar dados do backup
  private async loadBackupData(filePath: string): Promise<any> {
    try {
      let backupContent: string

      if (filePath.startsWith('cache:')) {
        // Carregar do cache Redis
        const cacheKey = filePath.replace('cache:', '')
        backupContent = await redisCache.get(`backup:${cacheKey}`) as string
        
        if (!backupContent) {
          throw new Error('Backup não encontrado no cache')
        }
      } else {
        // Carregar do storage
        const { data, error } = await supabase.storage
          .from('backups')
          .download(filePath)

        if (error || !data) {
          throw new Error('Erro ao carregar backup do storage')
        }

        backupContent = await data.text()
      }

      // Descriptografar e descomprimir
      const decrypted = this.decryptData(backupContent)
      const decompressed = this.decompressData(decrypted)
      
      return JSON.parse(decompressed)
    } catch (error) {
      console.error('Erro ao carregar dados do backup:', error)
      return null
    }
  }

  // Descriptografar dados
  private decryptData(data: string): string {
    try {
      const decoded = atob(data)
      return decoded.replace(this.ENCRYPTION_KEY, '')
    } catch {
      return data
    }
  }

  // Descomprimir dados
  private decompressData(data: string): string {
    try {
      return atob(data)
    } catch {
      return data
    }
  }

  // Restaurar tabela específica
  private async restoreTable(tableName: string, tableData: any[], agencyId: string): Promise<void> {
    if (!tableData || tableData.length === 0) {
      return
    }

    try {
      // Em produção, implementar estratégia mais sofisticada
      // Por agora, fazer upsert simples
      const { error } = await supabase
        .from(tableName)
        .upsert(tableData, { onConflict: 'id' })

      if (error) {
        throw new Error(`Erro ao restaurar tabela ${tableName}: ${error.message}`)
      }

      console.log(`Tabela ${tableName} restaurada com ${tableData.length} registros`)
    } catch (error) {
      console.error(`Erro ao restaurar tabela ${tableName}:`, error)
      throw error
    }
  }

  // Atualizar status da recuperação
  private async updateRecoveryStatus(
    recoveryId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    progressPercentage: number,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { 
      status, 
      progress_percentage: progressPercentage 
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    if (status === 'completed') {
      updateData.estimated_completion = new Date().toISOString()
    }

    await supabase
      .from('recovery_points')
      .update(updateData)
      .eq('id', recoveryId)
  }

  // Listar pontos de recuperação
  async listRecoveryPoints(agencyId: string, limit: number = 10): Promise<RecoveryPoint[]> {
    try {
      const { data, error } = await supabase
        .from('recovery_points')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao listar pontos de recuperação:', error)
        return []
      }

      return (data || []) as RecoveryPoint[]
    } catch (error) {
      console.error('Erro ao listar pontos de recuperação:', error)
      return []
    }
  }

  // Excluir backup antigo
  async deleteBackup(backupId: string, agencyId: string): Promise<boolean> {
    try {
      // Buscar backup
      const { data: backup } = await supabase
        .from('backup_records')
        .select('*')
        .eq('id', backupId)
        .eq('agency_id', agencyId)
        .single()

      if (backup) {
        // Excluir arquivo
        if (backup.file_path.startsWith('cache:')) {
          const cacheKey = backup.file_path.replace('cache:', '')
          await redisCache.delete(`backup:${cacheKey}`)
        } else {
          await supabase.storage
            .from('backups')
            .remove([backup.file_path])
        }
      }

      // Excluir registro
      const { error } = await supabase
        .from('backup_records')
        .delete()
        .eq('id', backupId)
        .eq('agency_id', agencyId)

      return !error
    } catch (error) {
      console.error('Erro ao excluir backup:', error)
      return false
    }
  }

  // Limpeza automática de backups antigos
  async cleanupOldBackups(agencyId: string, retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const { data: oldBackups } = await supabase
        .from('backup_records')
        .select('id, file_path')
        .eq('agency_id', agencyId)
        .lt('started_at', cutoffDate.toISOString())
        .eq('status', 'completed')

      if (!oldBackups || oldBackups.length === 0) {
        return 0
      }

      let deletedCount = 0

      for (const backup of oldBackups) {
        const deleted = await this.deleteBackup(backup.id, agencyId)
        if (deleted) deletedCount++
      }

      return deletedCount
    } catch (error) {
      console.error('Erro na limpeza de backups:', error)
      return 0
    }
  }
}

// Instância global
export const backupRecoveryManager = new BackupRecoveryManager()

// Hook React para backup e recuperação
export function useBackupRecovery() {
  return {
    createBackupConfig: backupRecoveryManager.createBackupConfig.bind(backupRecoveryManager),
    executeBackup: backupRecoveryManager.executeBackup.bind(backupRecoveryManager),
    listBackups: backupRecoveryManager.listBackups.bind(backupRecoveryManager),
    initiateRecovery: backupRecoveryManager.initiateRecovery.bind(backupRecoveryManager),
    listRecoveryPoints: backupRecoveryManager.listRecoveryPoints.bind(backupRecoveryManager),
    deleteBackup: backupRecoveryManager.deleteBackup.bind(backupRecoveryManager),
    cleanupOldBackups: backupRecoveryManager.cleanupOldBackups.bind(backupRecoveryManager)
  }
}

export default backupRecoveryManager