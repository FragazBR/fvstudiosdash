import { createClient } from '@supabase/supabase-js'
import { EventEmitter } from 'events'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying'
export type JobPriority = 'low' | 'normal' | 'high' | 'critical'

export interface Job {
  id: string
  queue_name: string
  job_type: string
  job_name?: string
  payload: any
  context: any
  priority: JobPriority
  max_attempts: number
  attempt_count: number
  timeout_seconds: number
  scheduled_at: string
  delay_seconds: number
  status: JobStatus
  started_at?: string
  completed_at?: string
  failed_at?: string
  result?: any
  error_message?: string
  error_details?: any
  worker_id?: string
  worker_hostname?: string
  depends_on?: string[]
  parent_job_id?: string
  progress_current: number
  progress_total: number
  progress_message?: string
  created_by?: string
  agency_id?: string
  created_at: string
  updated_at: string
}

export interface JobQueue {
  id: string
  name: string
  display_name?: string
  description?: string
  is_active: boolean
  max_workers: number
  max_jobs_per_worker: number
  rate_limit_per_minute: number
  rate_limit_per_hour: number
  default_max_attempts: number
  default_timeout_seconds: number
  retry_delay_base_seconds: number
  retry_delay_max_seconds: number
  dead_letter_queue_name?: string
  dead_letter_after_attempts: number
  allowed_priorities: JobPriority[]
  retention_completed_hours: number
  retention_failed_hours: number
  created_at: string
  updated_at: string
}

export interface JobWorker {
  id: string
  worker_id: string
  hostname: string
  process_id?: number
  queues: string[]
  max_concurrent_jobs: number
  status: 'idle' | 'working' | 'stopping' | 'stopped'
  is_healthy: boolean
  jobs_processed: number
  jobs_failed: number
  total_processing_time_ms: number
  started_at: string
  last_heartbeat: string
  last_job_at?: string
  version?: string
  environment: string
  created_at: string
  updated_at: string
}

export interface JobExecution {
  id: string
  job_id: string
  attempt_number: number
  worker_id?: string
  worker_hostname?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  status: JobStatus
  result?: any
  error_message?: string
  error_details?: any
  memory_usage_mb?: number
  cpu_time_ms?: number
  created_at: string
}

export interface RecurringJob {
  id: string
  name: string
  description?: string
  queue_name: string
  job_type: string
  payload: any
  context: any
  cron_expression: string
  timezone: string
  is_active: boolean
  max_attempts: number
  timeout_seconds: number
  last_run_at?: string
  next_run_at?: string
  last_job_id?: string
  total_runs: number
  successful_runs: number
  failed_runs: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface JobHandler {
  (job: Job): Promise<any>
}

export interface JobQueueStats {
  queue_name: string
  jobs_pending: number
  jobs_processing: number
  jobs_completed: number
  jobs_failed: number
  jobs_cancelled: number
  avg_processing_time_ms: number
  jobs_per_minute: number
  active_workers: number
}

export class JobQueueManager extends EventEmitter {
  private handlers = new Map<string, JobHandler>()
  private workerId: string
  private hostname: string
  private isRunning = false
  private processingJobs = new Set<string>()
  private heartbeatInterval?: NodeJS.Timeout
  private queues: string[] = ['default']
  private maxConcurrentJobs = 5

  constructor(options: {
    workerId?: string
    hostname?: string
    queues?: string[]
    maxConcurrentJobs?: number
  } = {}) {
    super()
    
    this.workerId = options.workerId || this.generateWorkerId()
    this.hostname = options.hostname || require('os').hostname()
    this.queues = options.queues || ['default']
    this.maxConcurrentJobs = options.maxConcurrentJobs || 5
  }

  private generateWorkerId(): string {
    const timestamp = Date.now().toString(36)
    const random = crypto.randomBytes(6).toString('hex')
    return `worker-${timestamp}-${random}`
  }

  // ==================== JOB REGISTRATION ====================

  /**
   * Registra um handler para um tipo de job
   */
  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler)
    this.emit('handlerRegistered', { jobType })
  }

  /**
   * Remove um handler
   */
  unregisterHandler(jobType: string): void {
    this.handlers.delete(jobType)
    this.emit('handlerUnregistered', { jobType })
  }

  // ==================== JOB CREATION ====================

  /**
   * Adiciona um job à fila
   */
  async addJob(
    jobType: string,
    payload: any,
    options: {
      queue?: string
      priority?: JobPriority
      delay?: number
      maxAttempts?: number
      timeout?: number
      dependsOn?: string[]
      parentJobId?: string
      context?: any
      scheduledAt?: Date
      createdBy?: string
      agencyId?: string
    } = {}
  ): Promise<string | null> {
    try {
      const scheduledAt = options.scheduledAt || new Date()
      if (options.delay && options.delay > 0) {
        scheduledAt.setSeconds(scheduledAt.getSeconds() + options.delay)
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          queue_name: options.queue || 'default',
          job_type: jobType,
          payload: payload,
          context: options.context || {},
          priority: options.priority || 'normal',
          max_attempts: options.maxAttempts || 3,
          timeout_seconds: options.timeout || 300,
          scheduled_at: scheduledAt.toISOString(),
          delay_seconds: options.delay || 0,
          depends_on: options.dependsOn,
          parent_job_id: options.parentJobId,
          created_by: options.createdBy,
          agency_id: options.agencyId
        })
        .select('id')
        .single()

      if (error) {
        console.error('Erro ao criar job:', error)
        return null
      }

      this.emit('jobAdded', { jobId: data.id, jobType, queue: options.queue })
      return data.id

    } catch (error) {
      console.error('Erro ao adicionar job:', error)
      return null
    }
  }

  /**
   * Adiciona múltiplos jobs em batch
   */
  async addBatchJobs(jobs: Array<{
    jobType: string
    payload: any
    options?: any
  }>): Promise<string[]> {
    try {
      const jobsData = jobs.map(job => ({
        queue_name: job.options?.queue || 'default',
        job_type: job.jobType,
        payload: job.payload,
        context: job.options?.context || {},
        priority: job.options?.priority || 'normal',
        max_attempts: job.options?.maxAttempts || 3,
        timeout_seconds: job.options?.timeout || 300,
        scheduled_at: job.options?.scheduledAt?.toISOString() || new Date().toISOString(),
        created_by: job.options?.createdBy,
        agency_id: job.options?.agencyId
      }))

      const { data, error } = await supabase
        .from('jobs')
        .insert(jobsData)
        .select('id')

      if (error) {
        console.error('Erro ao criar jobs em batch:', error)
        return []
      }

      const jobIds = data?.map(job => job.id) || []
      this.emit('batchJobsAdded', { jobIds, count: jobIds.length })
      return jobIds

    } catch (error) {
      console.error('Erro ao adicionar jobs em batch:', error)
      return []
    }
  }

  // ==================== JOB PROCESSING ====================

  /**
   * Inicia o processamento de jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Worker já está rodando')
      return
    }

    try {
      // Registrar worker no banco
      await this.registerWorker()
      
      // Iniciar heartbeat
      this.startHeartbeat()
      
      this.isRunning = true
      this.emit('workerStarted', { workerId: this.workerId })
      
      // Iniciar loop de processamento
      this.processJobs()
      
      console.log(`Worker ${this.workerId} iniciado`)

    } catch (error) {
      console.error('Erro ao iniciar worker:', error)
      throw error
    }
  }

  /**
   * Para o processamento de jobs
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return

    console.log(`Parando worker ${this.workerId}...`)
    this.isRunning = false

    // Parar heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    // Aguardar jobs em processamento terminarem
    while (this.processingJobs.size > 0) {
      console.log(`Aguardando ${this.processingJobs.size} jobs terminarem...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Atualizar status no banco
    await supabase
      .from('job_workers')
      .update({ status: 'stopped' })
      .eq('worker_id', this.workerId)

    this.emit('workerStopped', { workerId: this.workerId })
    console.log(`Worker ${this.workerId} parado`)
  }

  private async registerWorker(): Promise<void> {
    await supabase
      .from('job_workers')
      .upsert({
        worker_id: this.workerId,
        hostname: this.hostname,
        process_id: process.pid,
        queues: this.queues,
        max_concurrent_jobs: this.maxConcurrentJobs,
        status: 'idle',
        is_healthy: true,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }, {
        onConflict: 'worker_id'
      })
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await supabase
          .from('job_workers')
          .update({ 
            last_heartbeat: new Date().toISOString(),
            status: this.processingJobs.size > 0 ? 'working' : 'idle'
          })
          .eq('worker_id', this.workerId)
      } catch (error) {
        console.error('Erro no heartbeat:', error)
      }
    }, 30000) // 30 segundos
  }

  private async processJobs(): Promise<void> {
    while (this.isRunning) {
      try {
        // Verificar se pode processar mais jobs
        if (this.processingJobs.size >= this.maxConcurrentJobs) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        // Buscar próximo job
        const { data, error } = await supabase
          .rpc('get_next_job', {
            p_queue_names: this.queues,
            p_worker_id: this.workerId
          })

        if (error) {
          console.error('Erro ao buscar próximo job:', error)
          await new Promise(resolve => setTimeout(resolve, 5000))
          continue
        }

        if (!data || data.length === 0) {
          // Nenhum job disponível
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }

        const jobData = data[0]
        this.processingJobs.add(jobData.job_id)

        // Processar job em background
        this.executeJob(jobData).finally(() => {
          this.processingJobs.delete(jobData.job_id)
        })

      } catch (error) {
        console.error('Erro no loop de processamento:', error)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }

  private async executeJob(jobData: any): Promise<void> {
    const startTime = Date.now()
    let jobResult: any = null
    let jobError: string | null = null
    let jobErrorDetails: any = null

    try {
      this.emit('jobStarted', { jobId: jobData.job_id, jobType: jobData.job_type })

      // Buscar handler
      const handler = this.handlers.get(jobData.job_type)
      if (!handler) {
        throw new Error(`Handler não encontrado para job type: ${jobData.job_type}`)
      }

      // Executar job
      const job: Job = {
        id: jobData.job_id,
        queue_name: jobData.queue_name,
        job_type: jobData.job_type,
        payload: jobData.payload,
        context: jobData.context,
        priority: 'normal',
        max_attempts: 3,
        attempt_count: 1,
        timeout_seconds: 300,
        scheduled_at: new Date().toISOString(),
        delay_seconds: 0,
        status: 'processing',
        progress_current: 0,
        progress_total: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Executar com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), 300000) // 5 minutos
      })

      jobResult = await Promise.race([
        handler(job),
        timeoutPromise
      ])

      // Marcar como completado
      await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: jobResult
        })
        .eq('id', jobData.job_id)

      this.emit('jobCompleted', { 
        jobId: jobData.job_id, 
        jobType: jobData.job_type,
        duration: Date.now() - startTime,
        result: jobResult
      })

    } catch (error: any) {
      jobError = error.message
      jobErrorDetails = {
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString()
      }

      // Marcar como falhou
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: jobError,
          error_details: jobErrorDetails
        })
        .eq('id', jobData.job_id)

      this.emit('jobFailed', { 
        jobId: jobData.job_id, 
        jobType: jobData.job_type,
        duration: Date.now() - startTime,
        error: jobError,
        errorDetails: jobErrorDetails
      })

      console.error(`Job ${jobData.job_id} falhou:`, error)
    }
  }

  // ==================== JOB MANAGEMENT ====================

  /**
   * Busca um job por ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        console.error('Erro ao buscar job:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar job:', error)
      return null
    }
  }

  /**
   * Lista jobs por critérios
   */
  async listJobs(filters: {
    queue?: string
    status?: JobStatus
    jobType?: string
    agencyId?: string
    limit?: number
    offset?: number
  } = {}): Promise<Job[]> {
    try {
      let query = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.queue) {
        query = query.eq('queue_name', filters.queue)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType)
      }

      if (filters.agencyId) {
        query = query.eq('agency_id', filters.agencyId)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao listar jobs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao listar jobs:', error)
      return []
    }
  }

  /**
   * Cancela um job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .in('status', ['pending', 'retrying'])

      if (error) {
        console.error('Erro ao cancelar job:', error)
        return false
      }

      this.emit('jobCancelled', { jobId })
      return true
    } catch (error) {
      console.error('Erro ao cancelar job:', error)
      return false
    }
  }

  /**
   * Retenta um job falhado
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          error_message: null,
          error_details: null,
          failed_at: null
        })
        .eq('id', jobId)
        .eq('status', 'failed')

      if (error) {
        console.error('Erro ao retentar job:', error)
        return false
      }

      this.emit('jobRetried', { jobId })
      return true
    } catch (error) {
      console.error('Erro ao retentar job:', error)
      return false
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Obter estatísticas das filas
   */
  async getQueueStats(queueName?: string): Promise<JobQueueStats[]> {
    try {
      let query = `
        SELECT 
          queue_name,
          COUNT(*) FILTER (WHERE status = 'pending') as jobs_pending,
          COUNT(*) FILTER (WHERE status = 'processing') as jobs_processing,
          COUNT(*) FILTER (WHERE status = 'completed') as jobs_completed,
          COUNT(*) FILTER (WHERE status = 'failed') as jobs_failed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as jobs_cancelled,
          COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) FILTER (WHERE status = 'completed'), 0) as avg_processing_time_ms,
          0 as jobs_per_minute,
          0 as active_workers
        FROM jobs
      `

      if (queueName) {
        query += ` WHERE queue_name = '${queueName}'`
      }

      query += ` GROUP BY queue_name ORDER BY queue_name`

      const { data, error } = await supabase
        .rpc('sql', { query })

      if (error) {
        console.error('Erro ao buscar estatísticas:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return []
    }
  }

  /**
   * Limpar jobs antigos
   */
  async cleanupOldJobs(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_old_jobs')

      if (error) {
        console.error('Erro ao limpar jobs antigos:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Erro ao limpar jobs antigos:', error)
      return 0
    }
  }
}

// Instância global do job queue manager
let globalJobQueue: JobQueueManager | null = null

/**
 * Obter instância global do job queue
 */
export function getJobQueue(options?: any): JobQueueManager {
  if (!globalJobQueue) {
    globalJobQueue = new JobQueueManager(options)
  }
  return globalJobQueue
}

/**
 * Helper para adicionar job facilmente
 */
export async function addJob(
  jobType: string,
  payload: any,
  options?: any
): Promise<string | null> {
  const jobQueue = getJobQueue()
  return await jobQueue.addJob(jobType, payload, options)
}

/**
 * Helper para registrar handler
 */
export function registerJobHandler(jobType: string, handler: JobHandler): void {
  const jobQueue = getJobQueue()
  jobQueue.registerHandler(jobType, handler)
}

