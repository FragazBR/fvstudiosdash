'use client'

// ==================================================
// FVStudios Dashboard - WhatsApp Template Manager
// Sistema de gerenciamento de templates de mensagens WhatsApp
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Save,
  X,
  FileText,
  Palette,
  Zap,
  Settings,
  CheckCircle,
  AlertTriangle,
  Star,
  BarChart3,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

interface WhatsAppTemplate {
  id: string
  agency_id: string
  template_name: string
  notification_type: string
  title_template: string
  message_template: string
  variables: Record<string, string>
  is_active: boolean
  is_default: boolean
  usage_count: number
  created_by: string
  created_at: Date
  updated_at: Date
}

interface TemplatePreview {
  title: string
  message: string
}

const NOTIFICATION_TYPES = [
  { value: 'project_started', label: '🚀 Projeto Iniciado', description: 'Quando um novo projeto é criado' },
  { value: 'stage_started', label: '📈 Etapa Iniciada', description: 'Quando uma nova etapa é iniciada' },
  { value: 'stage_completed', label: '✅ Etapa Concluída', description: 'Quando uma etapa é finalizada' },
  { value: 'task_completed', label: '🎯 Tarefa Concluída', description: 'Quando uma tarefa específica é concluída' },
  { value: 'payment_reminder', label: '💰 Lembrete de Pagamento', description: 'Lembrete sobre pagamentos pendentes' },
  { value: 'feedback_request', label: '💭 Solicitação de Feedback', description: 'Quando precisamos de aprovação do cliente' },
  { value: 'delivery_ready', label: '📦 Entrega Pronta', description: 'Quando arquivos estão prontos para download' },
  { value: 'project_completed', label: '🏆 Projeto Concluído', description: 'Quando o projeto é finalizado' },
  { value: 'deadline_approaching', label: '⏰ Prazo se Aproximando', description: 'Lembretes sobre prazos' },
  { value: 'meeting_reminder', label: '📅 Lembrete de Reunião', description: 'Confirmação de reuniões agendadas' }
]

const DEFAULT_VARIABLES = {
  'project_started': {
    'client_name': 'Nome do cliente',
    'project_name': 'Nome do projeto',
    'project_type': 'Tipo do projeto',
    'estimated_duration': 'Duração estimada',
    'team_members': 'Membros da equipe',
    'next_actions': 'Próximas ações',
    'agency_name': 'Nome da agência'
  },
  'stage_started': {
    'client_name': 'Nome do cliente',
    'stage_name': 'Nome da etapa',
    'current_stage': 'Etapa atual',
    'total_stages': 'Total de etapas',
    'progress_bar': 'Barra de progresso',
    'stage_description': 'Descrição da etapa',
    'deliverables': 'Entregas previstas',
    'client_actions': 'Ações do cliente',
    'duration': 'Duração estimada'
  },
  'payment_reminder': {
    'client_name': 'Nome do cliente',
    'project_name': 'Nome do projeto',
    'amount': 'Valor',
    'due_date': 'Data de vencimento',
    'installment': 'Parcela atual',
    'total_installments': 'Total de parcelas',
    'pix_key': 'Chave PIX',
    'boleto_link': 'Link do boleto',
    'card_link': 'Link do cartão'
  },
  'feedback_request': {
    'client_name': 'Nome do cliente',
    'feedback_subject': 'Assunto do feedback',
    'feedback_details': 'Detalhes',
    'evaluation_criteria': 'Critérios de avaliação',
    'feedback_link': 'Link para feedback',
    'feedback_deadline': 'Prazo para resposta'
  }
}

const SAMPLE_TEMPLATES = {
  'project_started': {
    title: '🚀 Projeto {{project_name}} Iniciado!',
    message: `Olá *{{client_name}}*! 👋

Seu projeto *{{project_name}}* foi oficialmente iniciado!

*📋 Detalhes:*
• Tipo: {{project_type}}
• Prazo estimado: {{estimated_duration}} dias
• Próxima etapa: Briefing e Planejamento

*👥 Sua equipe:*
{{team_members}}

*📱 Próximos Passos:*
{{next_actions}}

Vamos criar algo incrível juntos! 🚀

_Equipe {{agency_name}}_`
  },
  'payment_reminder': {
    title: '💰 Lembrete de Pagamento',
    message: `Olá {{client_name}}! 💰

Este é um lembrete amigável sobre o pagamento do seu projeto:

*📋 Detalhes:*
• Projeto: {{project_name}}
• Valor: R$ {{amount}}
• Vencimento: {{due_date}}
• Parcela: {{installment}} de {{total_installments}}

*💳 Formas de pagamento:*
• PIX: {{pix_key}}
• Boleto: {{boleto_link}}
• Cartão: {{card_link}}

Após o pagamento, é só nos enviar o comprovante! 

Dúvidas? Estamos aqui para ajudar! 😊`
  }
}

export function WhatsAppTemplateManager() {
  const { user } = useUser()
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<WhatsAppTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [previewData, setPreviewData] = useState<TemplatePreview | null>(null)

  // Formulário para novo/editar template
  const [formData, setFormData] = useState({
    template_name: '',
    notification_type: '',
    title_template: '',
    message_template: '',
    is_active: true,
    is_default: false
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, selectedType])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/templates', {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        toast.error('Erro ao carregar templates')
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.notification_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.notification_type === selectedType)
    }

    setFilteredTemplates(filtered)
  }

  const createTemplate = async () => {
    try {
      if (!formData.template_name || !formData.notification_type || !formData.title_template || !formData.message_template) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      const variables = DEFAULT_VARIABLES[formData.notification_type as keyof typeof DEFAULT_VARIABLES] || {}

      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          ...formData,
          variables
        })
      })

      if (response.ok) {
        toast.success('Template criado com sucesso!')
        setShowCreateDialog(false)
        resetForm()
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar template')
      }
    } catch (error) {
      console.error('Erro ao criar template:', error)
      toast.error('Erro ao criar template')
    }
  }

  const updateTemplate = async () => {
    try {
      if (!editingTemplate) return

      const response = await fetch('/api/whatsapp/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          id: editingTemplate.id,
          ...formData
        })
      })

      if (response.ok) {
        toast.success('Template atualizado com sucesso!')
        setShowEditDialog(false)
        setEditingTemplate(null)
        resetForm()
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar template')
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error)
      toast.error('Erro ao atualizar template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({ id: templateId })
      })

      if (response.ok) {
        toast.success('Template excluído com sucesso!')
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir template')
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      toast.error('Erro ao excluir template')
    }
  }

  const duplicateTemplate = async (template: WhatsAppTemplate) => {
    const newTemplate = {
      template_name: `${template.template_name} (Cópia)`,
      notification_type: template.notification_type,
      title_template: template.title_template,
      message_template: template.message_template,
      is_active: false,
      is_default: false
    }

    setFormData(newTemplate)
    setShowCreateDialog(true)
  }

  const previewTemplate = (template: WhatsAppTemplate) => {
    // Simular dados para preview
    const sampleData = {
      client_name: 'João Silva',
      project_name: 'Site Institucional',
      project_type: 'Website',
      estimated_duration: '30',
      amount: '2.500,00',
      due_date: '15/12/2024',
      agency_name: 'FVStudios'
    }

    let previewTitle = template.title_template
    let previewMessage = template.message_template

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      previewTitle = previewTitle.replace(regex, value)
      previewMessage = previewMessage.replace(regex, value)
    })

    setPreviewData({
      title: previewTitle,
      message: previewMessage
    })
    setShowPreviewDialog(true)
  }

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/whatsapp/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          id: templateId,
          is_active: isActive
        })
      })

      if (response.ok) {
        toast.success(`Template ${isActive ? 'ativado' : 'desativado'} com sucesso!`)
        loadTemplates()
      } else {
        toast.error('Erro ao alterar status do template')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do template')
    }
  }

  const loadSampleTemplate = (notificationType: string) => {
    const sample = SAMPLE_TEMPLATES[notificationType as keyof typeof SAMPLE_TEMPLATES]
    if (sample) {
      setFormData(prev => ({
        ...prev,
        title_template: sample.title,
        message_template: sample.message
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      template_name: '',
      notification_type: '',
      title_template: '',
      message_template: '',
      is_active: true,
      is_default: false
    })
  }

  const openEditDialog = (template: WhatsAppTemplate) => {
    setEditingTemplate(template)
    setFormData({
      template_name: template.template_name,
      notification_type: template.notification_type,
      title_template: template.title_template,
      message_template: template.message_template,
      is_active: template.is_active,
      is_default: template.is_default
    })
    setShowEditDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Templates WhatsApp</h1>
            <p className="text-gray-600">Personalize as mensagens automáticas enviadas aos clientes</p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>
                Crie um template personalizado para notificações WhatsApp
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template_name">Nome do Template</Label>
                  <Input
                    id="template_name"
                    placeholder="Ex: Projeto Iniciado - Moderno"
                    value={formData.template_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notification_type">Tipo de Notificação</Label>
                  <Select 
                    value={formData.notification_type} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, notification_type: value }))
                      loadSampleTemplate(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title_template">Título da Mensagem</Label>
                <Input
                  id="title_template"
                  placeholder="🚀 Projeto {{project_name}} Iniciado!"
                  value={formData.title_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_template: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {{variavel}} para inserir dados dinâmicos
                </p>
              </div>
              
              <div>
                <Label htmlFor="message_template">Conteúdo da Mensagem</Label>
                <Textarea
                  id="message_template"
                  rows={8}
                  placeholder="Olá {{client_name}}! Seu projeto foi iniciado..."
                  value={formData.message_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variáveis disponíveis: {formData.notification_type && DEFAULT_VARIABLES[formData.notification_type as keyof typeof DEFAULT_VARIABLES] 
                    ? Object.keys(DEFAULT_VARIABLES[formData.notification_type as keyof typeof DEFAULT_VARIABLES]).map(v => `{{${v}}}`).join(', ')
                    : 'Selecione um tipo de notificação primeiro'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <span className="text-sm">Template ativo</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  />
                  <span className="text-sm">Template padrão</span>
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="truncate">{template.template_name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {template.is_default && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                  <Badge 
                    variant={template.is_active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {template.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">Tipo de Notificação</div>
                  <div className="text-sm">
                    {NOTIFICATION_TYPES.find(t => t.value === template.notification_type)?.label || template.notification_type}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-600">Título</div>
                  <div className="text-sm truncate">{template.title_template}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-600">Estatísticas</div>
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span>{template.usage_count} usos</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => previewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTemplateStatus(template.id, !template.is_active)}
                  >
                    {template.is_active ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o template "{template.template_name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm || selectedType !== 'all' ? 'Nenhum template encontrado' : 'Nenhum template criado'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedType !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando seu primeiro template de notificação'}
            </p>
            {!searchTerm && selectedType === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Modifique as configurações do template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_template_name">Nome do Template</Label>
                <Input
                  id="edit_template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_notification_type">Tipo de Notificação</Label>
                <Select 
                  value={formData.notification_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, notification_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_title_template">Título da Mensagem</Label>
              <Input
                id="edit_title_template"
                value={formData.title_template}
                onChange={(e) => setFormData(prev => ({ ...prev, title_template: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_message_template">Conteúdo da Mensagem</Label>
              <Textarea
                id="edit_message_template"
                rows={8}
                value={formData.message_template}
                onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <span className="text-sm">Template ativo</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                />
                <span className="text-sm">Template padrão</span>
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={updateTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview da Mensagem</DialogTitle>
            <DialogDescription>
              Como a mensagem aparecerá no WhatsApp do cliente
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="font-medium text-green-800 mb-2">
                  {previewData.title}
                </div>
                <div className="text-sm text-green-700 whitespace-pre-wrap">
                  {previewData.message}
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                * Preview com dados simulados para demonstração
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowPreviewDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}