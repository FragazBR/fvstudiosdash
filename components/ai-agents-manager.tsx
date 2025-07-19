'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Zap,
  Brain,
  MessageCircle,
  BarChart3,
  FileText,
  Search,
  Filter,
  Edit,
  Trash2,
  Activity,
  Target,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { type AIAgent, WORKFLOW_STAGES } from '@/types/workflow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock data expandido para IA Agents
const mockAIAgents: AIAgent[] = [
  {
    id: '1',
    name: 'Creative Assistant',
    type: 'content',
    workflowStage: 'criacao_conteudo',
    description: 'Auxilia na criação de conteúdo visual e copywriting para campanhas',
    capabilities: ['Content generation', 'Creative brainstorming', 'Copy writing', 'Visual concepts', 'A/B test ideas'],
    isActive: true
  },
  {
    id: '2',
    name: 'Analytics Bot',
    type: 'analytics',
    workflowStage: 'relatorio',
    description: 'Analisa dados de performance e gera insights automáticos',
    capabilities: ['Data analysis', 'Report generation', 'Performance insights', 'Trend detection', 'ROI optimization'],
    isActive: true
  },
  {
    id: '3',
    name: 'Client Support',
    type: 'support',
    workflowStage: 'atendimento',
    description: 'Suporte 24/7 para atendimento inicial e FAQ dos clientes',
    capabilities: ['Auto-response', 'FAQ handling', 'Lead qualification', 'Escalation management'],
    isActive: true
  },
  {
    id: '4',
    name: 'Workflow Optimizer',
    type: 'workflow',
    workflowStage: 'planejamento',
    description: 'Otimiza fluxos de trabalho e sugere melhorias de processo',
    capabilities: ['Process optimization', 'Task automation', 'Deadline management', 'Resource allocation'],
    isActive: false
  },
  {
    id: '5',
    name: 'Campaign Manager AI',
    type: 'analytics',
    workflowStage: 'trafego_gestao',
    description: 'Gerencia campanhas automaticamente com base em performance',
    capabilities: ['Bid optimization', 'Budget allocation', 'Audience targeting', 'Creative rotation'],
    isActive: true
  }
]

// Mock data para estatísticas dos agents
const agentStats: Record<string, { tasksCompleted: number; timeSaved: number; accuracy: number }> = {
  '1': { tasksCompleted: 142, timeSaved: 24, accuracy: 89 },
  '2': { tasksCompleted: 86, timeSaved: 18, accuracy: 95 },
  '3': { tasksCompleted: 203, timeSaved: 32, accuracy: 91 },
  '4': { tasksCompleted: 0, timeSaved: 0, accuracy: 0 },
  '5': { tasksCompleted: 67, timeSaved: 15, accuracy: 87 }
}

export function AIAgentsManager() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredAgents = mockAIAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || agent.type === typeFilter
    const matchesStage = stageFilter === 'all' || agent.workflowStage === stageFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && agent.isActive) ||
                         (statusFilter === 'inactive' && !agent.isActive)
    
    return matchesSearch && matchesType && matchesStage && matchesStatus
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <FileText className="h-5 w-5" />
      case 'analytics': return <BarChart3 className="h-5 w-5" />
      case 'support': return <MessageCircle className="h-5 w-5" />
      case 'workflow': return <Zap className="h-5 w-5" />
      default: return <Bot className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'content': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'analytics': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'support': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'workflow': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const toggleAgent = (agentId: string) => {
    // Aqui você implementaria a lógica para ativar/desativar o agent
    console.log('Toggling agent:', agentId)
  }

  const totalActiveAgents = mockAIAgents.filter(a => a.isActive).length
  const totalTimeSaved = Object.values(agentStats).reduce((acc, stat) => acc + stat.timeSaved, 0)
  const averageAccuracy = Object.values(agentStats).reduce((acc, stat) => acc + stat.accuracy, 0) / Object.values(agentStats).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IA Agents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie assistentes de IA para cada etapa do workflow da agência
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#64f481] hover:bg-[#50d66f] text-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agent
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#64f481]/20 rounded-lg">
                <Bot className="h-5 w-5 text-[#64f481]" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Agents Ativos</p>
                <p className="text-2xl font-semibold">{totalActiveAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Horas Economizadas</p>
                <p className="text-2xl font-semibold">{totalTimeSaved}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Precisão Média</p>
                <p className="text-2xl font-semibold">{Math.round(averageAccuracy)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tarefas Executadas</p>
                <p className="text-2xl font-semibold">
                  {Object.values(agentStats).reduce((acc, stat) => acc + stat.tasksCompleted, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Buscar agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="content">Conteúdo</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="support">Suporte</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Etapas</SelectItem>
            {WORKFLOW_STAGES.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => {
          const stats = agentStats[agent.id] || { tasksCompleted: 0, timeSaved: 0, accuracy: 0 }
          
          return (
            <Card key={agent.id} className={`transition-all hover:shadow-lg ${
              agent.isActive ? 'ring-1 ring-[#64f481]/20' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(agent.type)}`}>
                      {getTypeIcon(agent.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge className={getTypeColor(agent.type)}>
                        {agent.type}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={agent.isActive}
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {agent.description}
                </p>

                {/* Workflow Stage */}
                {agent.workflowStage && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Etapa Workflow</p>
                    <Badge variant="outline">
                      {WORKFLOW_STAGES.find(s => s.id === agent.workflowStage)?.name}
                    </Badge>
                  </div>
                )}

                {/* Capabilities */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Capacidades</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((capability) => (
                      <Badge key={capability} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.capabilities.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                {agent.isActive && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tarefas Concluídas</span>
                      <span className="font-medium">{stats.tasksCompleted}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tempo Economizado</span>
                      <span className="font-medium">{stats.timeSaved}h</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Precisão</span>
                        <span className="font-medium">{stats.accuracy}%</span>
                      </div>
                      <Progress value={stats.accuracy} className="h-2" />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Config
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

function CreateAgentModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [workflowStage, setWorkflowStage] = useState('')
  const [description, setDescription] = useState('')
  const [capabilities, setCapabilities] = useState('')

  const handleCreate = () => {
    // Aqui você implementaria a criação do agent
    console.log('Creating agent:', { name, type, workflowStage, description, capabilities })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Novo IA Agent</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do agent..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tipo</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">Conteúdo</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Etapa Workflow</label>
            <Select value={workflowStage} onValueChange={setWorkflowStage}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                {WORKFLOW_STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as funções do agent..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Capacidades</label>
            <Input
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              placeholder="Separadas por vírgula..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!name || !type || !description}
              className="flex-1 bg-[#64f481] hover:bg-[#50d66f] text-black"
            >
              Criar Agent
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
