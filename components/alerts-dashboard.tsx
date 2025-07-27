'use client'

// ==================================================
// FVStudios Dashboard - Alerts Dashboard
// Dashboard de alertas inteligente e configurável
// ==================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Plus, 
  RefreshCw, 
  Settings, 
  Eye,
  Zap,
  Shield,
  Server,
  Activity,
  Users,
  TrendingUp,
  MessageSquare,
  Mail,
  Slack,
  Webhook,
  Monitor,
  Filter,
  Search,
  X
} from 'lucide-react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line, Area, AreaChart } from 'recharts'

interface AlertRule {
  id: string
  name: string
  description: string
  type: 'performance' | 'security' | 'system' | 'business' | 'compliance' | 'custom'
  severity: 'info' | 'warning' | 'error' | 'critical'
  conditions: Array<{
    metric: string
    operator: string
    value: number | string
    timeframe_minutes?: number
  }>
  notification_channels: string[]
  cooldown_minutes: number
  is_active: boolean
  created_at: string
}

interface Alert {
  id: string
  rule_id: string
  rule_name: string
  type: 'performance' | 'security' | 'system' | 'business' | 'compliance' | 'custom'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  triggered_at: string
  acknowledged_at: string | null
  acknowledged_by: { id: string; email: string; name: string } | null
  resolved_at: string | null
  resolved_by: { id: string; email: string; name: string } | null
  duration_minutes: number
  details: Record<string, any>
}

const COLORS = ['#01b86c', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const STATUS_COLORS = {
  active: 'bg-red-100 text-red-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800'
}

const TYPE_ICONS = {
  performance: Activity,
  security: Shield,
  system: Server,
  business: TrendingUp,
  compliance: CheckCircle,
  custom: Settings
}

export function AlertsDashboard() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [statistics, setStatistics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [createRuleDialog, setCreateRuleDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')

  // Form states
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    type: 'performance',
    severity: 'warning',
    conditions: [{ metric: 'error_rate', operator: 'gt', value: 5, timeframe_minutes: 15 }],
    notification_channels: ['dashboard'],
    cooldown_minutes: 60,
    is_active: true
  })

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [selectedStatus, selectedSeverity, selectedType])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      // Carregar regras de alerta
      const rulesResponse = await fetch('/api/alerts/rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        setRules(rulesData.rules)
        setStatistics({...statistics, ...rulesData.statistics})
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados de alertas')
    } finally {
      setLoading(false)
    }
  }

  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      const params = new URLSearchParams({
        limit: '50'
      })

      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedSeverity) params.append('severity', selectedSeverity)
      if (selectedType) params.append('type', selectedType)

      const response = await fetch(`/api/alerts/list?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
        setStatistics({...statistics, ...data.statistics})
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    }
  }

  const createRule = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        toast.error('Token de autenticação não encontrado')
        return
      }

      const response = await fetch('/api/alerts/rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRule)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Regra de alerta criada com sucesso')
        setCreateRuleDialog(false)
        setNewRule({
          name: '',
          description: '',
          type: 'performance',
          severity: 'warning',
          conditions: [{ metric: 'error_rate', operator: 'gt', value: 5, timeframe_minutes: 15 }],
          notification_channels: ['dashboard'],
          cooldown_minutes: 60,
          is_active: true
        })
        loadData()
      } else {
        toast.error(data.error || 'Erro ao criar regra')
      }
    } catch (error) {
      console.error('Erro ao criar regra:', error)
      toast.error('Erro ao criar regra de alerta')
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      const response = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert_id: alertId,
          action: 'acknowledge'
        })
      })

      if (response.ok) {
        toast.success('Alerta reconhecido')
        loadAlerts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao reconhecer alerta')
      }
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error)
      toast.error('Erro ao reconhecer alerta')
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      const response = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert_id: alertId,
          action: 'resolve'
        })
      })

      if (response.ok) {
        toast.success('Alerta resolvido')
        loadAlerts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao resolver alerta')
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
      toast.error('Erro ao resolver alerta')
    }
  }

  const addCondition = () => {
    setNewRule({
      ...newRule,
      conditions: [...newRule.conditions, { metric: 'error_rate', operator: 'gt', value: 5, timeframe_minutes: 15 }]
    })
  }

  const removeCondition = (index: number) => {
    const conditions = newRule.conditions.filter((_, i) => i !== index)
    setNewRule({ ...newRule, conditions })
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const conditions = [...newRule.conditions]
    conditions[index] = { ...conditions[index], [field]: value }
    setNewRule({ ...newRule, conditions })
  }

  const getTypeIcon = (type: string) => {
    const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Settings
    return <Icon className="h-4 w-4" />
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'slack': return <Slack className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      case 'dashboard': return <Monitor className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  // Preparar dados para gráficos
  const prepareChartData = () => {
    // Alertas por severidade
    const severityData = Object.entries(statistics.by_severity || {}).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: severity === 'critical' ? '#ef4444' : 
             severity === 'error' ? '#f97316' :
             severity === 'warning' ? '#f59e0b' : '#06b6d4'
    }))

    // Alertas por tipo
    const typeData = Object.entries(statistics.by_type || {}).map(([type, count]) => ({
      name: type,
      value: count
    }))

    // Alertas por status
    const statusData = Object.entries(statistics.by_status || {}).map(([status, count]) => ({
      name: status,
      value: count
    }))

    return { severityData, typeData, statusData }
  }

  const { severityData, typeData, statusData } = prepareChartData()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando sistema de alertas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Sistema de Alertas
          </h2>
          <p className="text-muted-foreground">
            Configure alertas inteligentes e monitore eventos críticos do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          <Dialog open={createRuleDialog} onOpenChange={setCreateRuleDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.active_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.critical_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Severidade crítica
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.last_24h || 0}</div>
            <p className="text-xs text-muted-foreground">
              Alertas recentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">
              {rules.filter(r => r.is_active).length} ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alertas Ativos</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="acknowledged">Reconhecido</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severidade</Label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as severidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="business">Negócio</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de alertas */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>
                {alerts.length} alertas encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(alert.type)}
                          <Badge className={SEVERITY_COLORS[alert.severity]}>
                            {alert.severity}
                          </Badge>
                          <Badge className={STATUS_COLORS[alert.status]}>
                            {alert.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {alert.rule_name}
                          </span>
                        </div>
                        
                        <h4 className="font-medium mb-1">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Disparado: {new Date(alert.triggered_at).toLocaleString('pt-BR')}</span>
                          <span>Duração: {alert.duration_minutes}m</span>
                          {alert.acknowledged_by && (
                            <span>Reconhecido por: {alert.acknowledged_by.name || alert.acknowledged_by.email}</span>
                          )}
                          {alert.resolved_by && (
                            <span>Resolvido por: {alert.resolved_by.name || alert.resolved_by.email}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Reconhecer
                            </Button>
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolver
                            </Button>
                          </>
                        )}
                        
                        {alert.status === 'acknowledged' && (
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolver
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum alerta encontrado</p>
                    <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Alerta</CardTitle>
              <CardDescription>
                Configure regras automáticas para disparar alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(rule.type)}
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge className={SEVERITY_COLORS[rule.severity]}>
                          {rule.severity}
                        </Badge>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Condições: {rule.conditions.length}</span>
                        <span>Cooldown: {rule.cooldown_minutes}m</span>
                        <div className="flex items-center gap-1">
                          <span>Canais:</span>
                          {rule.notification_channels.map((channel, index) => (
                            <span key={index} className="flex items-center">
                              {getChannelIcon(channel)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {rules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma regra configurada</p>
                    <p className="text-sm">Crie sua primeira regra para começar a receber alertas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas por severidade */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alertas por tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#01b86c" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alertas por status */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumo de estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total de Alertas</span>
                    <Badge variant="outline">{statistics.total || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Alertas Ativos</span>
                    <Badge className="bg-red-100 text-red-800">{statistics.active_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Alertas Críticos</span>
                    <Badge className="bg-red-100 text-red-800">{statistics.critical_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Regras Ativas</span>
                    <Badge variant="outline">{rules.filter(r => r.is_active).length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar regra */}
      <Dialog open={createRuleDialog} onOpenChange={setCreateRuleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Regra de Alerta</DialogTitle>
            <DialogDescription>
              Configure uma nova regra automática para disparar alertas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Regra</Label>
                <Input
                  id="name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="Nome da regra"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={newRule.type} onValueChange={(value: any) => setNewRule({...newRule, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="security">Segurança</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="business">Negócio</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newRule.description}
                onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                placeholder="Descreva quando este alerta deve ser disparado"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="severity">Severidade</Label>
                <Select value={newRule.severity} onValueChange={(value: any) => setNewRule({...newRule, severity: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="cooldown">Cooldown (minutos)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  value={newRule.cooldown_minutes}
                  onChange={(e) => setNewRule({...newRule, cooldown_minutes: parseInt(e.target.value) || 60})}
                  placeholder="60"
                />
              </div>
            </div>

            {/* Condições */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Condições</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {newRule.conditions.map((condition, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 mb-2 p-2 border rounded">
                  <Select
                    value={condition.metric}
                    onValueChange={(value) => updateCondition(index, 'metric', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error_rate">Taxa de Erro</SelectItem>
                      <SelectItem value="response_time">Tempo de Resposta</SelectItem>
                      <SelectItem value="memory_usage">Uso de Memória</SelectItem>
                      <SelectItem value="cpu_usage">Uso de CPU</SelectItem>
                      <SelectItem value="cache_hit_rate">Taxa de Cache</SelectItem>
                      <SelectItem value="failed_logins">Logins Falhados</SelectItem>
                      <SelectItem value="backup_age">Idade do Backup</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">Maior que</SelectItem>
                      <SelectItem value="lt">Menor que</SelectItem>
                      <SelectItem value="gte">Maior ou igual</SelectItem>
                      <SelectItem value="lte">Menor ou igual</SelectItem>
                      <SelectItem value="eq">Igual a</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value) || 0)}
                    placeholder="Valor"
                  />
                  
                  <Input
                    type="number"
                    value={condition.timeframe_minutes || 15}
                    onChange={(e) => updateCondition(index, 'timeframe_minutes', parseInt(e.target.value) || 15)}
                    placeholder="Período (min)"
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    disabled={newRule.conditions.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Canais de notificação */}
            <div>
              <Label>Canais de Notificação</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['dashboard', 'email', 'slack', 'webhook'].map((channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <Checkbox
                      id={channel}
                      checked={newRule.notification_channels.includes(channel)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewRule({
                            ...newRule,
                            notification_channels: [...newRule.notification_channels, channel]
                          })
                        } else {
                          setNewRule({
                            ...newRule,
                            notification_channels: newRule.notification_channels.filter(c => c !== channel)
                          })
                        }
                      }}
                    />
                    <label htmlFor={channel} className="text-sm capitalize flex items-center gap-1">
                      {getChannelIcon(channel)}
                      {channel}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={newRule.is_active}
                onCheckedChange={(checked) => setNewRule({...newRule, is_active: checked as boolean})}
              />
              <Label htmlFor="is_active">Regra ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRuleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createRule}>
              Criar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}