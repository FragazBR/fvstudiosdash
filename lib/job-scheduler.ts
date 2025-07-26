// ==================================================
// FVStudios Dashboard - Agendador de Jobs para Sincronização
// Sistema para executar sincronizações automáticas com APIs externas
// ==================================================

import { supabaseServer } from '@/lib/supabaseServer'
import { TokenEncryption } from './encryption'
import { TokenValidationManager } from './api-validators'

// Interface para configuração de jobs
export interface JobConfig {
  integrationId: string
  jobType: 'full_sync' | 'incremental_sync' | 'validate_token' | 'sync_metrics'
  scheduleExpression?: string // Cron expression
  nextRunAt?: Date
}

// Interface para resultado de execução
export interface JobResult {
  success: boolean
  recordsProcessed: number
  recordsSuccessful: number
  recordsFailed: number
  error?: string
  duration: number
}

// Classe principal do agendador
export class JobScheduler {
  private static instance: JobScheduler
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  private constructor() {}

  public static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler()
    }
    return JobScheduler.instance
  }

  // Iniciar o agendador
  public start(): void {
    if (this.isRunning) {
      console.log('Job scheduler já está em execução')
      return
    }

    console.log('Iniciando job scheduler...')
    this.isRunning = true

    // Executar a cada minuto
    this.intervalId = setInterval(async () => {
      try {
        await this.processPendingJobs()
      } catch (error) {
        console.error('Erro no processamento de jobs:', error)
      }
    }, 60 * 1000) // 60 segundos

    console.log('Job scheduler iniciado com sucesso')
  }

  // Parar o agendador
  public stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('Parando job scheduler...')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('Job scheduler parado')
  }

  // Processar jobs pendentes
  private async processPendingJobs(): Promise<void> {
    const supabase = await supabaseServer()

    try {
      // Buscar jobs pendentes que devem ser executados
      const { data: pendingJobs, error } = await supabase
        .from('sync_jobs')
        .select(`
          *,
          api_integrations!inner(
            id,
            agency_id,
            provider,
            access_token_encrypted,
            status
          )
        `)
        .eq('status', 'pending')
        .lte('next_run_at', new Date().toISOString())
        .eq('api_integrations.status', 'active')
        .limit(10) // Processar até 10 jobs por vez

      if (error) {
        console.error('Erro ao buscar jobs pendentes:', error)
        return
      }

      if (!pendingJobs || pendingJobs.length === 0) {
        return
      }

      console.log(`Processando ${pendingJobs.length} jobs pendentes`)

      // Executar jobs em paralelo (com limite)
      const jobPromises = pendingJobs.map(job => this.executeJob(job))
      await Promise.allSettled(jobPromises)

    } catch (error) {
      console.error('Erro no processamento de jobs pendentes:', error)
    }
  }

  // Executar um job específico
  private async executeJob(job: any): Promise<void> {
    const supabase = await supabaseServer()
    const startTime = Date.now()

    try {
      // Marcar job como em execução
      await supabase
        .from('sync_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', job.id)

      console.log(`Executando job ${job.id} - ${job.job_type} para integração ${job.integration_id}`)

      // Executar baseado no tipo de job
      let result: JobResult

      switch (job.job_type) {
        case 'validate_token':
          result = await this.executeTokenValidation(job)
          break
        case 'full_sync':
          result = await this.executeFullSync(job)
          break
        case 'incremental_sync':
          result = await this.executeIncrementalSync(job)
          break
        case 'sync_metrics':
          result = await this.executeSyncMetrics(job)
          break
        default:
          throw new Error(`Tipo de job não suportado: ${job.job_type}`)
      }

      // Atualizar job com resultado
      await supabase
        .from('sync_jobs')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          records_processed: result.recordsProcessed,
          records_successful: result.recordsSuccessful,
          records_failed: result.recordsFailed,
          error_message: result.error || null,
          next_run_at: this.calculateNextRun(job)
        })
        .eq('id', job.id)

      console.log(`Job ${job.id} concluído: ${result.success ? 'sucesso' : 'falha'}`)

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`Erro na execução do job ${job.id}:`, error)

      // Marcar job como falhado
      await supabase
        .from('sync_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Erro desconhecido',
          next_run_at: this.calculateNextRun(job)
        })
        .eq('id', job.id)
    }
  }

  // Executar validação de token
  private async executeTokenValidation(job: any): Promise<JobResult> {
    const startTime = Date.now()

    try {
      const integration = job.api_integrations

      // Descriptografar token
      if (!integration.access_token_encrypted) {
        throw new Error('Token de acesso não encontrado')
      }

      const tokenData = TokenEncryption.decryptOAuthToken(integration.access_token_encrypted)

      // Validar token
      const validationResult = await TokenValidationManager.validateToken({
        provider: integration.provider,
        integration_id: integration.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      })

      // Atualizar status da integração
      const supabase = await supabaseServer()
      await supabase
        .from('api_integrations')
        .update({
          is_valid: validationResult.isValid,
          last_validated_at: new Date().toISOString(),
          validation_error: validationResult.error || null,
          status: validationResult.isValid ? 'active' : 'error'
        })
        .eq('id', integration.id)

      return {
        success: validationResult.isValid,
        recordsProcessed: 1,
        recordsSuccessful: validationResult.isValid ? 1 : 0,
        recordsFailed: validationResult.isValid ? 0 : 1,
        error: validationResult.error,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        recordsProcessed: 1,
        recordsSuccessful: 0,
        recordsFailed: 1,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      }
    }
  }

  // Executar sincronização completa
  private async executeFullSync(job: any): Promise<JobResult> {
    const startTime = Date.now()

    try {
      // Implementar sincronização completa baseada no provider
      const integration = job.api_integrations
      
      // Por enquanto, apenas simular o processo
      console.log(`Executando sincronização completa para ${integration.provider}`)
      
      // Em produção, isso faria:
      // 1. Buscar todas as campanhas da API
      // 2. Sincronizar com a tabela synced_campaigns
      // 3. Buscar todos os posts/conteúdos
      // 4. Sincronizar com a tabela synced_posts
      // 5. Atualizar métricas

      return {
        success: true,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      }
    }
  }

  // Executar sincronização incremental
  private async executeIncrementalSync(job: any): Promise<JobResult> {
    const startTime = Date.now()

    try {
      // Implementar sincronização incremental
      const integration = job.api_integrations
      
      console.log(`Executando sincronização incremental para ${integration.provider}`)
      
      // Em produção, isso faria:
      // 1. Buscar apenas dados modificados desde a última sincronização
      // 2. Atualizar registros existentes
      // 3. Inserir novos registros

      return {
        success: true,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      }
    }
  }

  // Executar sincronização de métricas
  private async executeSyncMetrics(job: any): Promise<JobResult> {
    const startTime = Date.now()

    try {
      // Implementar sincronização de métricas
      const integration = job.api_integrations
      
      console.log(`Executando sincronização de métricas para ${integration.provider}`)
      
      // Em produção, isso faria:
      // 1. Buscar insights/métricas das campanhas
      // 2. Atualizar campos de performance
      // 3. Calcular KPIs

      return {
        success: true,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        duration: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      }
    }
  }

  // Calcular próxima execução
  private calculateNextRun(job: any): string | null {
    if (!job.schedule_expression) {
      return null
    }

    // Implementação simples baseada em intervalos comuns
    const now = new Date()
    
    switch (job.schedule_expression) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      default:
        // Para expressões cron complexas, usar uma biblioteca como node-cron
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    }
  }

  // Agendar job específico
  public static async scheduleJob(config: JobConfig): Promise<string> {
    const supabase = await supabaseServer()

    const { data: job, error } = await supabase
      .from('sync_jobs')
      .insert({
        integration_id: config.integrationId,
        job_type: config.jobType,
        schedule_expression: config.scheduleExpression,
        status: 'pending',
        next_run_at: config.nextRunAt?.toISOString() || new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao agendar job: ${error.message}`)
    }

    return job.id
  }

  // Cancelar job
  public static async cancelJob(jobId: string): Promise<void> {
    const supabase = await supabaseServer()

    const { error } = await supabase
      .from('sync_jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      throw new Error(`Erro ao cancelar job: ${error.message}`)
    }
  }
}

// Inicializar scheduler globalmente (em produção, isso seria feito em um worker separado)
if (typeof global !== 'undefined') {
  const scheduler = JobScheduler.getInstance()
  
  // Iniciar apenas em ambiente de produção ou quando explicitamente solicitado
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_JOB_SCHEDULER === 'true') {
    scheduler.start()
    
    // Cleanup no shutdown
    process.on('SIGINT', () => scheduler.stop())
    process.on('SIGTERM', () => scheduler.stop())
  }
}

export default JobScheduler