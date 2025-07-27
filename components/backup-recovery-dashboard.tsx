'use client'

// ==================================================
// FVStudios Dashboard - Backup & Recovery Dashboard
// Dashboard para gerenciamento de backup e recuperação
// ==================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Shield,
  History,
  Play,
  Trash2,
  Eye
} from 'lucide-react'

interface BackupRecord {
  id: string
  backup_type: 'full' | 'incremental' | 'critical_only'
  file_size: number
  file_size_mb: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  error_message: string | null
  metadata: any
  created_by: {
    email: string
    name: string
  }
}

interface RecoveryPoint {
  id: string
  backup_id: string
  recovery_type: 'full_restore' | 'partial_restore' | 'point_in_time'
  target_timestamp: string
  tables_to_restore: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress_percentage: number
  estimated_completion: string | null
  error_message: string | null
  created_at: string
  duration_seconds: number | null
  created_by: {
    email: string
    name: string
  }
}

interface BackupStats {
  total_backups: number
  successful_backups: number
  failed_backups: number
  running_backups: number
  avg_duration_seconds: number
  total_backup_size: number
  last_backup_time: string | null
  backups_last_7_days: number
  backups_last_30_days: number
}

const CRITICAL_TABLES = [
  'agencies', 'profiles', 'user_profiles', 'projects', 'clients',
  'credits_usage', 'whatsapp_config', 'notification_templates', 'realtime_notifications'
]

const ALL_TABLES = [
  ...CRITICAL_TABLES,
  'tasks', 'task_assignments', 'project_stages', 'client_communications',
  'file_uploads', 'integrations_config', 'backup_records', 'recovery_points'
]

export function BackupRecoveryDashboard() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [selectedBackupType, setSelectedBackupType] = useState<'full' | 'incremental' | 'critical_only'>('critical_only')
  const [recoveryDialog, setRecoveryDialog] = useState<{ open: boolean; backup?: BackupRecord }>({ open: false })
  const [selectedRecoveryType, setSelectedRecoveryType] = useState<'full_restore' | 'partial_restore'>('full_restore')
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      // Carregar backups
      const backupsResponse = await fetch('/api/backup/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (backupsResponse.ok) {
        const backupsData = await backupsResponse.json()
        setBackups(backupsData.backups || [])
        setStats(backupsData.statistics)
      }

      // Carregar pontos de recuperação
      const recoveryResponse = await fetch('/api/backup/recovery/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (recoveryResponse.ok) {
        const recoveryData = await recoveryResponse.json()
        setRecoveryPoints(recoveryData.recovery_points || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        toast.error('Token de autenticação não encontrado')
        return
      }

      const response = await fetch('/api/backup/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_type: selectedBackupType,
          manual: true
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Backup ${selectedBackupType} iniciado com sucesso`)
        loadData() // Recarregar dados
      } else {
        toast.error(data.error || 'Erro ao iniciar backup')
      }
    } catch (error) {
      console.error('Erro ao executar backup:', error)
      toast.error('Erro ao iniciar backup')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const initiateRecovery = async () => {
    if (!recoveryDialog.backup || !confirmOverwrite) {
      toast.error('Confirme a sobrescrita dos dados antes de prosseguir')
      return
    }

    setIsRecovering(true)
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        toast.error('Token de autenticação não encontrado')
        return
      }

      const response = await fetch('/api/backup/recover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backup_id: recoveryDialog.backup.id,
          recovery_type: selectedRecoveryType,
          tables_to_restore: selectedRecoveryType === 'partial_restore' ? selectedTables : undefined,
          confirm_overwrite: confirmOverwrite
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Recuperação ${selectedRecoveryType} iniciada com sucesso`)
        setRecoveryDialog({ open: false })
        setConfirmOverwrite(false)
        setSelectedTables([])
        loadData()
      } else {
        toast.error(data.error || 'Erro ao iniciar recuperação')
      }
    } catch (error) {
      console.error('Erro ao iniciar recuperação:', error)
      toast.error('Erro ao iniciar recuperação')
    } finally {
      setIsRecovering(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados de backup...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_backups || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.backups_last_7_days || 0} nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_backups ? Math.round((stats.successful_backups / stats.total_backups) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.successful_backups || 0} de {stats?.total_backups || 0} concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats?.total_backup_size || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Espaço utilizado em backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.last_backup_time 
                ? new Date(stats.last_backup_time).toLocaleDateString('pt-BR')
                : 'Nunca'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio: {formatDuration(stats?.avg_duration_seconds || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ações de Backup
          </CardTitle>
          <CardDescription>
            Execute backups manuais ou configure recuperações dos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedBackupType} onValueChange={(value: any) => setSelectedBackupType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de backup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical_only">Dados Críticos</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="full">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={executeBackup} 
              disabled={isCreatingBackup}
              className="flex items-center gap-2"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isCreatingBackup ? 'Executando...' : 'Executar Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com histórico */}
      <Tabs defaultValue="backups">
        <TabsList>
          <TabsTrigger value="backups">Histórico de Backups</TabsTrigger>
          <TabsTrigger value="recovery">Pontos de Recuperação</TabsTrigger>
        </TabsList>

        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Backups</CardTitle>
              <CardDescription>
                Visualize todos os backups executados para sua agência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum backup encontrado</p>
                    <p className="text-sm">Execute seu primeiro backup usando o botão acima</p>
                  </div>
                ) : (
                  backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(backup.status)}
                        <div>
                          <div className="font-medium">
                            Backup {backup.backup_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(backup.started_at).toLocaleString('pt-BR')} • 
                            {backup.created_by.name || backup.created_by.email}
                          </div>
                          {backup.status === 'running' && (
                            <Progress value={75} className="w-48 mt-2" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div>{formatBytes(backup.file_size)}</div>
                          <div className="text-muted-foreground">
                            {backup.duration_seconds ? formatDuration(backup.duration_seconds) : 'Em andamento'}
                          </div>
                        </div>
                        
                        {getStatusBadge(backup.status)}
                        
                        {backup.status === 'completed' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setRecoveryDialog({ open: true, backup })}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery">
          <Card>
            <CardHeader>
              <CardTitle>Pontos de Recuperação</CardTitle>
              <CardDescription>
                Acompanhe os processos de recuperação executados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recoveryPoints.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ponto de recuperação encontrado</p>
                    <p className="text-sm">Execute uma recuperação de backup para ver o histórico aqui</p>
                  </div>
                ) : (
                  recoveryPoints.map((recovery) => (
                    <div key={recovery.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(recovery.status)}
                        <div>
                          <div className="font-medium">
                            Recuperação {recovery.recovery_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(recovery.created_at).toLocaleString('pt-BR')} • 
                            {recovery.created_by.name || recovery.created_by.email}
                          </div>
                          {recovery.status === 'running' && (
                            <Progress value={recovery.progress_percentage} className="w-48 mt-2" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div>{recovery.progress_percentage}%</div>
                          <div className="text-muted-foreground">
                            {recovery.duration_seconds ? formatDuration(recovery.duration_seconds) : 'Em andamento'}
                          </div>
                        </div>
                        
                        {getStatusBadge(recovery.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de recuperação */}
      <Dialog open={recoveryDialog.open} onOpenChange={(open) => setRecoveryDialog({ open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Recuperar Backup
            </DialogTitle>
            <DialogDescription>
              Configure as opções de recuperação do backup selecionado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do backup */}
            {recoveryDialog.backup && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Informações do Backup</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span> {recoveryDialog.backup.id}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span> {recoveryDialog.backup.backup_type}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tamanho:</span> {formatBytes(recoveryDialog.backup.file_size)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data:</span> {new Date(recoveryDialog.backup.started_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            )}

            {/* Tipo de recuperação */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Recuperação</label>
              <Select value={selectedRecoveryType} onValueChange={(value: any) => setSelectedRecoveryType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_restore">Recuperação Completa</SelectItem>
                  <SelectItem value="partial_restore">Recuperação Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de tabelas (recuperação parcial) */}
            {selectedRecoveryType === 'partial_restore' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Tabelas para Recuperar</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                  {ALL_TABLES.map((table) => (
                    <div key={table} className="flex items-center space-x-2">
                      <Checkbox
                        id={table}
                        checked={selectedTables.includes(table)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTables([...selectedTables, table])
                          } else {
                            setSelectedTables(selectedTables.filter(t => t !== table))
                          }
                        }}
                      />
                      <label htmlFor={table} className="text-sm">
                        {table}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmação */}
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Checkbox
                id="confirm"
                checked={confirmOverwrite}
                onCheckedChange={setConfirmOverwrite}
              />
              <label htmlFor="confirm" className="text-sm text-red-800">
                Confirmo que entendo que esta operação irá sobrescrever os dados existentes
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryDialog({ open: false })}>
              Cancelar
            </Button>
            <Button 
              onClick={initiateRecovery} 
              disabled={isRecovering || !confirmOverwrite}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRecovering ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRecovering ? 'Iniciando...' : 'Iniciar Recuperação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}