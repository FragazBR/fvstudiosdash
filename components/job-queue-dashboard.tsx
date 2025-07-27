'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Button
} from '@/components/ui/button'
import {
  Badge
} from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Label
} from '@/components/ui/label'
import {
  Input
} from '@/components/ui/input'
import {
  Textarea
} from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Progress
} from '@/components/ui/progress'
import {
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  RotateCcw,
  X,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  BarChart3,
  Activity,
  Server,
  Zap,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Database,
  Cpu,
  HardDrive,
  Timer
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Job {
  id: string
  queue_name: string
  job_type: string
  job_name?: string
  payload: any
  context: any
  priority: 'low' | 'normal' | 'high' | 'critical'
  max_attempts: number
  attempt_count: number
  timeout_seconds: number
  scheduled_at: string
  delay_seconds: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying'
  started_at?: string
  completed_at?: string
  failed_at?: string
  result?: any
  error_message?: string
  error_details?: any
  worker_id?: string
  worker_hostname?: string
  progress_current: number
  progress_total: number
  progress_message?: string
  created_by?: string
  agency_id?: string
  created_at: string
  updated_at: string
}

interface JobQueue {
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
  allowed_priorities: string[]
  retention_completed_hours: number
  retention_failed_hours: number
  created_at: string
  updated_at: string
}

interface JobWorker {
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

interface JobQueueStats {
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

const JOB_TYPES = [
  { value: 'whatsapp.send_message', label: 'Enviar WhatsApp', category: 'Notificações' },
  { value: 'slack.send_notification', label: 'Enviar Slack', category: 'Notificações' },
  { value: 'email.send', label: 'Enviar Email', category: 'Notificações' },
  { value: 'webhook.process', label: 'Processar Webhook', category: 'Integrações' },
  { value: 'report.generate', label: 'Gerar Relatório', category: 'Relatórios' },
  { value: 'backup.create', label: 'Criar Backup', category: 'Sistema' },
  { value: 'ai.process_data', label: 'Processar IA', category: 'IA' },
  { value: 'data.sync', label: 'Sincronizar Dados', category: 'Integrações' },
  { value: 'cleanup.old_files', label: 'Limpeza de Arquivos', category: 'Sistema' },
  { value: 'analytics.calculate', label: 'Calcular Analytics', category: 'Analytics' }
]

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  retrying: 'bg-orange-100 text-orange-800'
}

export default function JobQueueDashboard() {
  const user = useUser()
  const [jobs, setJobs] = useState<Job[]>([])
  const [queues, setQueues] = useState<JobQueue[]>([])
  const [workers, setWorkers] = useState<JobWorker[]>([])
  const [stats, setStats] = useState<JobQueueStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQueue, setSelectedQueue] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false)
  const [showCreateQueueDialog, setShowCreateQueueDialog] = useState(false)
  const [jobForm, setJobForm] = useState({
    job_type: '',
    queue: 'default',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'critical',
    delay: 0,
    max_attempts: 3,
    timeout: 300,
    payload: '{}',
    context: '{}'
  })
  const [queueForm, setQueueForm] = useState({
    name: '',
    display_name: '',
    description: '',
    max_workers: 5,
    max_jobs_per_worker: 10,
    rate_limit_per_minute: 60,
    default_max_attempts: 3,
    default_timeout_seconds: 300
  })

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Atualizar a cada 30 segundos
    return () => clearInterval(interval)
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    
    try {
      await Promise.all([
        loadJobs(),
        loadQueues(),
        loadWorkers(),
        loadStats()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadJobs = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedQueue !== 'all') params.set('queue', selectedQueue)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)
      params.set('limit', '100')

      const response = await fetch(`/api/jobs?${params}`)
      const data = await response.json()
      if (data.success) {
        setJobs(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar jobs:', error)
    }
  }

  const loadQueues = async () => {
    try {
      const response = await fetch('/api/jobs/queues')
      const data = await response.json()
      if (data.success) {
        setQueues(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar filas:', error)
    }
  }

  const loadWorkers = async () => {
    try {
      const response = await fetch('/api/jobs/workers')
      const data = await response.json()
      if (data.success) {
        setWorkers(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar workers:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/jobs/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleCreateJob = async () => {
    try {
      let payload, context
      try {
        payload = JSON.parse(jobForm.payload)
        context = JSON.parse(jobForm.context)
      } catch {
        toast.error('JSON inválido em payload ou context')
        return
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: jobForm.job_type,
          queue: jobForm.queue,
          priority: jobForm.priority,
          delay: jobForm.delay,
          max_attempts: jobForm.max_attempts,
          timeout: jobForm.timeout,
          payload,
          context
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Job criado com sucesso!')
        setShowCreateJobDialog(false)
        resetJobForm()
        loadJobs()
      } else {
        toast.error(data.error || 'Erro ao criar job')
      }
    } catch (error) {
      toast.error('Erro ao criar job')
      console.error(error)
    }
  }

  const handleCreateQueue = async () => {
    try {
      const response = await fetch('/api/jobs/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueForm)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Fila criada com sucesso!')
        setShowCreateQueueDialog(false)
        resetQueueForm()
        loadQueues()
      } else {
        toast.error(data.error || 'Erro ao criar fila')
      }
    } catch (error) {
      toast.error('Erro ao criar fila')
      console.error(error)
    }
  }

  const handleJobAction = async (jobId: string, action: 'retry' | 'cancel') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        loadJobs()
      } else {
        toast.error(data.error || `Erro ao ${action === 'retry' ? 'retentar' : 'cancelar'} job`)
      }
    } catch (error) {
      toast.error(`Erro ao ${action === 'retry' ? 'retentar' : 'cancelar'} job`)
      console.error(error)
    }
  }

  const handleCleanupJobs = async () => {
    try {
      const response = await fetch('/api/jobs/cleanup', {
        method: 'POST'
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.data.message)
        loadJobs()
        loadStats()
      } else {
        toast.error(data.error || 'Erro na limpeza')
      }
    } catch (error) {
      toast.error('Erro na limpeza')
      console.error(error)
    }
  }

  const resetJobForm = () => {
    setJobForm({
      job_type: '',
      queue: 'default',
      priority: 'normal',
      delay: 0,
      max_attempts: 3,
      timeout: 300,
      payload: '{}',
      context: '{}'
    })
  }

  const resetQueueForm = () => {
    setQueueForm({
      name: '',
      display_name: '',
      description: '',
      max_workers: 5,
      max_jobs_per_worker: 10,
      rate_limit_per_minute: 60,
      default_max_attempts: 3,
      default_timeout_seconds: 300
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />
      case 'retrying':
        return <RotateCcw className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalJobs = stats.reduce((sum, stat) => 
    sum + stat.jobs_pending + stat.jobs_processing + stat.jobs_completed + stat.jobs_failed, 0)
  const pendingJobs = stats.reduce((sum, stat) => sum + stat.jobs_pending, 0)
  const processingJobs = stats.reduce((sum, stat) => sum + stat.jobs_processing, 0)
  const completedJobs = stats.reduce((sum, stat) => sum + stat.jobs_completed, 0)
  const failedJobs = stats.reduce((sum, stat) => sum + stat.jobs_failed, 0)
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0'
  const activeWorkers = workers.filter(w => w.is_healthy && w.status !== 'stopped').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Job Queue Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitore e gerencie o sistema de filas de jobs distribuído
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Job</DialogTitle>
                <DialogDescription>
                  Adicionar um novo job à fila de processamento
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_type">Tipo de Job</Label>
                    <Select value={jobForm.job_type} onValueChange={(value) => setJobForm({...jobForm, job_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="queue">Fila</Label>
                    <Select value={jobForm.queue} onValueChange={(value) => setJobForm({...jobForm, queue: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {queues.map((queue) => (
                          <SelectItem key={queue.name} value={queue.name}>
                            {queue.display_name || queue.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={jobForm.priority} onValueChange={(value) => setJobForm({...jobForm, priority: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="delay">Delay (segundos)</Label>
                    <Input
                      type="number"
                      value={jobForm.delay}
                      onChange={(e) => setJobForm({...jobForm, delay: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_attempts">Max Tentativas</Label>
                    <Input
                      type="number"
                      value={jobForm.max_attempts}
                      onChange={(e) => setJobForm({...jobForm, max_attempts: parseInt(e.target.value) || 3})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payload">Payload (JSON)</Label>
                  <Textarea
                    value={jobForm.payload}
                    onChange={(e) => setJobForm({...jobForm, payload: e.target.value})}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="context">Context (JSON)</Label>
                  <Textarea
                    value={jobForm.context}
                    onChange={(e) => setJobForm({...jobForm, context: e.target.value})}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateJobDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateJob}>
                  Criar Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleCleanupJobs}>
            <HardDrive className="h-4 w-4 mr-2" />
            Limpeza
          </Button>

          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processando</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingJobs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workers Ativos</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="queues">Filas</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Jobs</CardTitle>
                  <CardDescription>
                    Lista de todos os jobs no sistema
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Filas</SelectItem>
                      {queues.map((queue) => (
                        <SelectItem key={queue.name} value={queue.name}>
                          {queue.display_name || queue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="completed">Completo</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Fila</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type}
                          </div>
                          {job.job_name && (
                            <div className="text-sm text-muted-foreground">
                              {job.job_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {job.queue_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <Badge className={STATUS_COLORS[job.status]}>
                            {job.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_COLORS[job.priority]}>
                          {job.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.status === 'processing' ? (
                          <div className="space-y-1">
                            <Progress 
                              value={(job.progress_current / job.progress_total) * 100} 
                              className="w-20"
                            />
                            <div className="text-xs text-muted-foreground">
                              {job.progress_current}/{job.progress_total}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.worker_hostname ? (
                          <div className="text-sm">
                            <div>{job.worker_hostname}</div>
                            {job.worker_id && (
                              <div className="text-xs text-muted-foreground">
                                {job.worker_id.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(job.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {job.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJobAction(job.id, 'retry')}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                          {['pending', 'processing'].includes(job.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJobAction(job.id, 'cancel')}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queues">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filas de Jobs</CardTitle>
                  <CardDescription>
                    Configuração e monitoramento das filas
                  </CardDescription>
                </div>
                <Dialog open={showCreateQueueDialog} onOpenChange={setShowCreateQueueDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Fila
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Fila</DialogTitle>
                      <DialogDescription>
                        Configurar uma nova fila de processamento
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            value={queueForm.name}
                            onChange={(e) => setQueueForm({...queueForm, name: e.target.value})}
                            placeholder="nome_da_fila"
                          />
                        </div>
                        <div>
                          <Label htmlFor="display_name">Nome de Exibição</Label>
                          <Input
                            value={queueForm.display_name}
                            onChange={(e) => setQueueForm({...queueForm, display_name: e.target.value})}
                            placeholder="Nome da Fila"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          value={queueForm.description}
                          onChange={(e) => setQueueForm({...queueForm, description: e.target.value})}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="max_workers">Max Workers</Label>
                          <Input
                            type="number"
                            value={queueForm.max_workers}
                            onChange={(e) => setQueueForm({...queueForm, max_workers: parseInt(e.target.value) || 5})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rate_limit_per_minute">Rate Limit/min</Label>
                          <Input
                            type="number"
                            value={queueForm.rate_limit_per_minute}
                            onChange={(e) => setQueueForm({...queueForm, rate_limit_per_minute: parseInt(e.target.value) || 60})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowCreateQueueDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateQueue}>
                        Criar Fila
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {queues.map((queue) => {
                  const queueStats = stats.find(s => s.queue_name === queue.name)
                  return (
                    <Card key={queue.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {queue.display_name || queue.name}
                            </CardTitle>
                            <CardDescription>
                              {queue.description}
                            </CardDescription>
                          </div>
                          <Badge variant={queue.is_active ? 'default' : 'secondary'}>
                            {queue.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {queueStats && (
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Pendentes</div>
                              <div className="text-lg font-semibold">{queueStats.jobs_pending}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Processando</div>
                              <div className="text-lg font-semibold">{queueStats.jobs_processing}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Completados</div>
                              <div className="text-lg font-semibold">{queueStats.jobs_completed}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Workers Ativos</div>
                              <div className="text-lg font-semibold">{queueStats.active_workers}</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers">
          <Card>
            <CardHeader>
              <CardTitle>Workers</CardTitle>
              <CardDescription>
                Status dos workers de processamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filas</TableHead>
                    <TableHead>Jobs Processados</TableHead>
                    <TableHead>Tempo Ativo</TableHead>
                    <TableHead>Último Heartbeat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{worker.hostname}</div>
                          <div className="text-xs text-muted-foreground">
                            {worker.worker_id.substring(0, 12)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            worker.is_healthy ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <Badge variant={worker.is_healthy ? 'default' : 'secondary'}>
                            {worker.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {worker.queues.map((queue) => (
                            <Badge key={queue} variant="outline" className="text-xs">
                              {queue}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{worker.jobs_processed.toLocaleString()}</div>
                          {worker.jobs_failed > 0 && (
                            <div className="text-xs text-red-500">
                              {worker.jobs_failed} falharam
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDuration(Date.now() - new Date(worker.started_at).getTime())}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {new Date(worker.last_heartbeat).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas por Fila</CardTitle>
                <CardDescription>
                  Performance detalhada de cada fila
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fila</TableHead>
                      <TableHead>Pendentes</TableHead>
                      <TableHead>Processando</TableHead>
                      <TableHead>Completados</TableHead>
                      <TableHead>Falharam</TableHead>
                      <TableHead>Tempo Médio</TableHead>
                      <TableHead>Workers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat) => (
                      <TableRow key={stat.queue_name}>
                        <TableCell>
                          <Badge variant="outline">
                            {stat.queue_name}
                          </Badge>
                        </TableCell>
                        <TableCell>{stat.jobs_pending.toLocaleString()}</TableCell>
                        <TableCell>{stat.jobs_processing.toLocaleString()}</TableCell>
                        <TableCell>{stat.jobs_completed.toLocaleString()}</TableCell>
                        <TableCell>{stat.jobs_failed.toLocaleString()}</TableCell>
                        <TableCell>
                          {formatDuration(stat.avg_processing_time_ms)}
                        </TableCell>
                        <TableCell>{stat.active_workers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}