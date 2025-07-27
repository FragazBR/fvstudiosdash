'use client'

// ==================================================
// FVStudios Dashboard - Compliance Dashboard
// Dashboard de auditoria e compliance
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
import { toast } from 'sonner'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  Database, 
  Search, 
  Plus,
  RefreshCw,
  Download,
  Eye,
  Settings,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Lock,
  UserCheck,
  Archive,
  Zap
} from 'lucide-react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line, Area, AreaChart } from 'recharts'

interface ComplianceRule {
  id: string
  rule_name: string
  rule_type: 'data_retention' | 'access_control' | 'data_protection' | 'logging' | 'backup'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  conditions: Record<string, any>
  actions: Record<string, any>
  is_active: boolean
  last_check: string | null
  next_check: string | null
  created_at: string
}

interface ComplianceReport {
  id: string
  report_type: 'gdpr' | 'lgpd' | 'sox' | 'iso27001' | 'custom'
  period: {
    start: string
    end: string
  }
  status: 'compliant' | 'non_compliant' | 'partial_compliant'
  findings_count: number
  failed_findings: number
  remediation_actions_count: number
  created_at: string
  generated_by: {
    email: string
    name: string
  }
}

interface AuditEntry {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  changed_fields: string[]
  old_values: Record<string, any>
  new_values: Record<string, any>
  ip_address: string
  created_at: string
  user: {
    id: string
    email: string
    name: string
  } | null
}

const COLORS = ['#01b86c', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function ComplianceDashboard() {
  const [rules, setRules] = useState<ComplianceRule[]>([])
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [statistics, setStatistics] = useState<any>({})
  const [auditStats, setAuditStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [createRuleDialog, setCreateRuleDialog] = useState(false)
  const [createReportDialog, setCreateReportDialog] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [auditFilters, setAuditFilters] = useState({
    table_name: '',
    action: '',
    user_id: ''
  })

  // Form states
  const [newRule, setNewRule] = useState({
    rule_name: '',
    rule_type: 'data_retention',
    description: '',
    severity: 'medium',
    conditions: '{}',
    actions: '{}',
    is_active: true
  })

  const [newReport, setNewReport] = useState({
    report_type: 'custom',
    period_start: '',
    period_end: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadAuditData()
  }, [auditFilters])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      // Carregar regras de compliance
      const rulesResponse = await fetch('/api/compliance/rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        setRules(rulesData.rules)
        setStatistics(rulesData.statistics)
      }

      // Carregar relatórios
      const reportsResponse = await fetch('/api/compliance/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.reports)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados de compliance')
    } finally {
      setLoading(false)
    }
  }

  const loadAuditData = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      const params = new URLSearchParams({
        limit: '20',
        ...Object.fromEntries(
          Object.entries(auditFilters).filter(([_, v]) => v !== '')
        )
      })

      const auditResponse = await fetch(`/api/audit/search?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setAuditEntries(auditData.audit_entries)
        setAuditStats(auditData.statistics)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de auditoria:', error)
    }
  }

  const createRule = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        toast.error('Token de autenticação não encontrado')
        return
      }

      // Validar JSON
      let conditions, actions
      try {
        conditions = JSON.parse(newRule.conditions)
        actions = JSON.parse(newRule.actions)
      } catch (error) {
        toast.error('Formato JSON inválido em condições ou ações')
        return
      }

      const response = await fetch('/api/compliance/rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newRule,
          conditions,
          actions
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Regra de compliance criada com sucesso')
        setCreateRuleDialog(false)
        setNewRule({
          rule_name: '',
          rule_type: 'data_retention',
          description: '',
          severity: 'medium',
          conditions: '{}',
          actions: '{}',
          is_active: true
        })
        loadData()
      } else {
        toast.error(data.error || 'Erro ao criar regra')
      }
    } catch (error) {
      console.error('Erro ao criar regra:', error)
      toast.error('Erro ao criar regra de compliance')
    }
  }

  const generateReport = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) {
        toast.error('Token de autenticação não encontrado')
        return
      }

      const response = await fetch('/api/compliance/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReport)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Relatório de compliance gerado com sucesso')
        setCreateReportDialog(false)
        setNewReport({
          report_type: 'custom',
          period_start: '',
          period_end: ''
        })
        loadData()
      } else {
        toast.error(data.error || 'Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório de compliance')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800'
      case 'partial_compliant': return 'bg-yellow-100 text-yellow-800'
      case 'non_compliant': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Preparar dados para gráficos
  const prepareChartData = () => {
    // Dados de regras por tipo
    const rulesByType = rules.reduce((acc: any, rule) => {
      acc[rule.rule_type] = (acc[rule.rule_type] || 0) + 1
      return acc
    }, {})

    const rulesData = Object.entries(rulesByType).map(([type, count]) => ({
      name: type.replace('_', ' '),
      value: count
    }))

    // Dados de severidade
    const severityData = rules.reduce((acc: any, rule) => {
      acc[rule.severity] = (acc[rule.severity] || 0) + 1
      return acc
    }, {})

    const severityChartData = Object.entries(severityData).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: severity === 'critical' ? '#ef4444' : 
             severity === 'high' ? '#f97316' :
             severity === 'medium' ? '#f59e0b' : '#22c55e'
    }))

    // Dados de auditoria por ação
    const auditByAction = auditStats.actions || {}
    const auditActionData = Object.entries(auditByAction).map(([action, count]) => ({
      name: action,
      value: count
    }))

    return { rulesData, severityChartData, auditActionData }
  }

  const { rulesData, severityChartData, auditActionData } = prepareChartData()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados de compliance...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Compliance & Auditoria
          </h2>
          <p className="text-muted-foreground">
            Gerencie regras de compliance e monitore a trilha de auditoria
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={createReportDialog} onOpenChange={setCreateReportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </DialogTrigger>
          </Dialog>
          
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
            <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_rules || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.active_rules || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regras Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.critical_rules || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.overdue_checks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Verificações em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas de Auditoria</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats.total_entries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {auditStats.period_days || 30} dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Regras de Compliance</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="audit">Trilha de Auditoria</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Compliance</CardTitle>
              <CardDescription>
                Configure e monitore regras de compliance automáticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.rule_name}</h4>
                        <Badge className={getSeverityColor(rule.severity)}>
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
                        <span>Tipo: {rule.rule_type.replace('_', ' ')}</span>
                        {rule.last_check && (
                          <span>Última verificação: {new Date(rule.last_check).toLocaleString('pt-BR')}</span>
                        )}
                        {rule.next_check && (
                          <span>Próxima: {new Date(rule.next_check).toLocaleString('pt-BR')}</span>
                        )}
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
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma regra de compliance configurada</p>
                    <p className="text-sm">Crie sua primeira regra para começar o monitoramento</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Compliance</CardTitle>
              <CardDescription>
                Relatórios gerados para auditorias e conformidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium capitalize">Relatório {report.report_type}</h4>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status === 'compliant' ? 'Conforme' :
                           report.status === 'partial_compliant' ? 'Parcialmente Conforme' :
                           'Não Conforme'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Período: {new Date(report.period.start).toLocaleDateString('pt-BR')} - {new Date(report.period.end).toLocaleDateString('pt-BR')}</span>
                        <span>{report.findings_count} verificações</span>
                        <span>{report.failed_findings} falhas</span>
                        <span>Gerado por: {report.generated_by.name || report.generated_by.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum relatório gerado</p>
                    <p className="text-sm">Gere seu primeiro relatório de compliance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {/* Filtros de auditoria */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="table">Tabela</Label>
                  <Input
                    id="table"
                    placeholder="Nome da tabela"
                    value={auditFilters.table_name}
                    onChange={(e) => setAuditFilters({...auditFilters, table_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="action">Ação</Label>
                  <Select value={auditFilters.action} onValueChange={(value) => setAuditFilters({...auditFilters, action: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="INSERT">INSERT</SelectItem>
                      <SelectItem value="UPDATE">UPDATE</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="user">Usuário</Label>
                  <Input
                    id="user"
                    placeholder="ID do usuário"
                    value={auditFilters.user_id}
                    onChange={(e) => setAuditFilters({...auditFilters, user_id: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trilha de auditoria */}
          <Card>
            <CardHeader>
              <CardTitle>Trilha de Auditoria</CardTitle>
              <CardDescription>
                Histórico completo de modificações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditEntries.map((entry) => (
                  <div key={entry.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(entry.action)}>
                            {entry.action}
                          </Badge>
                          <span className="font-medium">{entry.table_name}</span>
                          <span className="text-sm text-muted-foreground">#{entry.record_id}</span>
                        </div>
                        
                        {entry.changed_fields.length > 0 && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Campos alterados: {entry.changed_fields.join(', ')}
                          </div>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString('pt-BR')}
                          {entry.user && (
                            <span className="ml-2">• {entry.user.name || entry.user.email}</span>
                          )}
                          {entry.ip_address && (
                            <span className="ml-2">• {entry.ip_address}</span>
                          )}
                        </div>
                        
                        {(Object.keys(entry.old_values).length > 0 || Object.keys(entry.new_values).length > 0) && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-blue-600">
                              Ver alterações
                            </summary>
                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                              {Object.keys(entry.old_values).length > 0 && (
                                <div className="mb-2">
                                  <strong>Valores anteriores:</strong>
                                  <pre className="overflow-x-auto">{JSON.stringify(entry.old_values, null, 2)}</pre>
                                </div>
                              )}
                              {Object.keys(entry.new_values).length > 0 && (
                                <div>
                                  <strong>Novos valores:</strong>
                                  <pre className="overflow-x-auto">{JSON.stringify(entry.new_values, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {auditEntries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma entrada de auditoria encontrada</p>
                    <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regras por tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Regras por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={rulesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {rulesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por severidade */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={severityChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Auditoria por ação */}
            <Card>
              <CardHeader>
                <CardTitle>Auditoria por Ação</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={auditActionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#01b86c" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumo de auditoria */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(auditStats.tables || {}).map(([table, count]) => (
                    <div key={table} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{table}</span>
                      <Badge variant="outline">{count} entradas</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar regra */}
      <Dialog open={createRuleDialog} onOpenChange={setCreateRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Regra de Compliance</DialogTitle>
            <DialogDescription>
              Configure uma nova regra de compliance automática
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule_name">Nome da Regra</Label>
                <Input
                  id="rule_name"
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule({...newRule, rule_name: e.target.value})}
                  placeholder="Nome da regra"
                />
              </div>
              
              <div>
                <Label htmlFor="rule_type">Tipo</Label>
                <Select value={newRule.rule_type} onValueChange={(value: any) => setNewRule({...newRule, rule_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_retention">Retenção de Dados</SelectItem>
                    <SelectItem value="access_control">Controle de Acesso</SelectItem>
                    <SelectItem value="data_protection">Proteção de Dados</SelectItem>
                    <SelectItem value="logging">Logging</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
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
                placeholder="Descreva o objetivo desta regra"
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
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newRule.is_active}
                  onChange={(e) => setNewRule({...newRule, is_active: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Regra ativa</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="conditions">Condições (JSON)</Label>
              <Textarea
                id="conditions"
                value={newRule.conditions}
                onChange={(e) => setNewRule({...newRule, conditions: e.target.value})}
                placeholder='{"retention_days": 90, "tables": ["system_logs"]}'
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="actions">Ações (JSON)</Label>
              <Textarea
                id="actions"
                value={newRule.actions}
                onChange={(e) => setNewRule({...newRule, actions: e.target.value})}
                placeholder='{"cleanup_action": "delete", "notify_admin": true}'
                className="font-mono text-sm"
              />
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

      {/* Dialog para gerar relatório */}
      <Dialog open={createReportDialog} onOpenChange={setCreateReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Relatório de Compliance</DialogTitle>
            <DialogDescription>
              Configure o período e tipo do relatório
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="report_type">Tipo de Relatório</Label>
              <Select value={newReport.report_type} onValueChange={(value: any) => setNewReport({...newReport, report_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gdpr">GDPR</SelectItem>
                  <SelectItem value="lgpd">LGPD</SelectItem>
                  <SelectItem value="sox">SOX</SelectItem>
                  <SelectItem value="iso27001">ISO 27001</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period_start">Data Inicial</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={newReport.period_start}
                  onChange={(e) => setNewReport({...newReport, period_start: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="period_end">Data Final</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={newReport.period_end}
                  onChange={(e) => setNewReport({...newReport, period_end: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateReportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={generateReport}>
              Gerar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}