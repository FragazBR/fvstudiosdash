'use client'

// ==================================================
// FVStudios Dashboard - Project Notification Demo
// Demonstração do sistema de notificações WhatsApp
// ==================================================

import React, { useState } from 'react'
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
  MessageSquare,
  Send,
  Smartphone,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  FileText,
  DollarSign,
  Calendar,
  PlayCircle,
  Settings,
  Users,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

interface NotificationExample {
  id: string
  type: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  example_data: any
}

const NOTIFICATION_EXAMPLES: NotificationExample[] = [
  {
    id: 'project_started',
    type: 'project_created',
    title: 'Projeto Iniciado',
    description: 'Notifica o cliente quando um novo projeto é criado',
    icon: <PlayCircle className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800',
    example_data: {
      estimated_duration: 30,
      team_members: ['João Silva - Designer', 'Maria Santos - Desenvolvedora'],
      next_actions: ['Enviar materiais da empresa', 'Agendar reunião de alinhamento']
    }
  },
  {
    id: 'stage_changed',
    type: 'stage_changed',
    title: 'Etapa Alterada',
    description: 'Notifica mudanças de etapa no projeto',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800',
    example_data: {
      new_stage: 2,
      total_stages: 5,
      stage_info: {
        name: '🎨 Design e Wireframes',
        description: 'Criação do design visual e estrutura das páginas',
        expected_duration: 7,
        deliverables: ['Wireframes', 'Layout das páginas', 'Paleta de cores'],
        client_actions_required: ['Feedback sobre layouts', 'Aprovação do design']
      }
    }
  },
  {
    id: 'task_completed',
    type: 'task_completed',
    title: 'Tarefa Concluída',
    description: 'Notifica quando uma tarefa ou entrega é finalizada',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800',
    example_data: {
      task_id: 'task_001',
      task_name: 'Logo e Identidade Visual',
      deliverables: ['Logo em diversos formatos', 'Manual de marca', 'Paleta de cores'],
      download_links: ['https://drive.google.com/folder/logo-files'],
      next_steps: ['Aplicar logo nos materiais', 'Feedback até sexta-feira'],
      requires_client_action: true
    }
  },
  {
    id: 'payment_due',
    type: 'payment_due',
    title: 'Lembrete de Pagamento',
    description: 'Lembra o cliente sobre pagamentos pendentes',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'bg-yellow-100 text-yellow-800',
    example_data: {
      amount: 2500,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      installment: 2,
      total_installments: 3,
      payment_methods: {
        pix_key: 'agencia@fvstudios.com.br',
        boleto_link: 'https://banco.com.br/boleto/123456',
        card_link: 'https://pay.fvstudios.com.br/card'
      }
    }
  },
  {
    id: 'feedback_required',
    type: 'feedback_required',
    title: 'Solicitação de Feedback',
    description: 'Solicita aprovação ou feedback do cliente',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-800',
    example_data: {
      subject: 'Aprovação do Design Final',
      details: 'O design do seu site está pronto e precisa da sua aprovação para prosseguirmos.',
      criteria: ['Cores e tipografia', 'Layout geral', 'Navegação', 'Responsividade mobile'],
      feedback_link: 'https://app.fvstudios.com.br/projects/123/feedback',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'project_completed',
    type: 'project_completed',
    title: 'Projeto Concluído',
    description: 'Notifica a conclusão do projeto',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800',
    example_data: {
      project_duration: 25,
      completed_stages: 5,
      total_deliveries: 12,
      final_deliverables: ['Site publicado', 'Código-fonte', 'Documentação', 'Manual de uso'],
      post_project_actions: ['Período de garantia de 30 dias', 'Suporte técnico disponível'],
      review_link: 'https://app.fvstudios.com.br/projects/123/review'
    }
  }
]

export function ProjectNotificationDemo() {
  const { user } = useUser()
  const [selectedProject, setSelectedProject] = useState('')
  const [sending, setSending] = useState('')
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')

  const sendNotification = async (example: NotificationExample) => {
    if (!selectedProject) {
      toast.error('Selecione um projeto primeiro')
      return
    }

    setSending(example.id)

    try {
      const response = await fetch('/api/notifications/project-triggers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: example.type,
          project_id: selectedProject,
          event_data: example.example_data
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`✅ ${data.message}`)
      } else {
        const error = await response.json()
        toast.error(`❌ ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      toast.error('❌ Erro ao enviar notificação')
    } finally {
      setSending('')
    }
  }

  const sendTestNotification = async () => {
    if (!testPhoneNumber) {
      toast.error('Digite um número de WhatsApp')
      return
    }

    try {
      const response = await fetch('/api/whatsapp/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'send_message',
          phone_number: testPhoneNumber,
          message: `🤖 *Teste do Sistema de Notificações FVStudios*

Olá! Este é um teste do nosso sistema de notificações automáticas via WhatsApp.

✅ *Sistema funcionando perfeitamente!*

Com este sistema, você receberá:
• Atualizações do projeto em tempo real
• Lembretes de pagamento
• Solicitações de feedback
• Entrega de arquivos
• Status de cada etapa

📱 Todas as notificações chegam automaticamente no seu WhatsApp!

_Equipe FVStudios_`
        })
      })

      if (response.ok) {
        toast.success('✅ Mensagem de teste enviada!')
        setShowTestDialog(false)
        setTestPhoneNumber('')
      } else {
        toast.error('❌ Erro ao enviar mensagem de teste')
      }
    } catch (error) {
      console.error('Erro ao enviar teste:', error)
      toast.error('❌ Erro ao enviar mensagem de teste')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sistema de Notificações WhatsApp</h1>
            <p className="text-gray-600">Demonstração das notificações automáticas para clientes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Teste WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Mensagem de Teste</DialogTitle>
                <DialogDescription>
                  Digite um número de WhatsApp para testar o sistema de notificações
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Número do WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="5511999999999"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: código do país + DDD + número (ex: 5511999999999)
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={sendTestNotification} disabled={!testPhoneNumber}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Teste
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Selecionar Projeto (Demo)</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um projeto para demonstração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-1">🌐 Site Institucional - Empresa ABC</SelectItem>
                  <SelectItem value="demo-2">🎨 Identidade Visual - Startup XYZ</SelectItem>
                  <SelectItem value="demo-3">📱 App Mobile - Delivery Food</SelectItem>
                  <SelectItem value="demo-4">📊 Dashboard Analytics - SaaS Company</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Projetos reais serão detectados automaticamente
              </p>
            </div>
            
            <div className="flex items-end">
              <div className="w-full">
                <Label>Status da API WhatsApp</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurada
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Pronta para enviar notificações
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Notificação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {NOTIFICATION_EXAMPLES.map((example) => (
          <Card key={example.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${example.color}`}>
                    {example.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{example.title}</h3>
                    <p className="text-sm text-gray-600 font-normal">
                      {example.description}
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => sendNotification(example)}
                  disabled={!selectedProject || sending === example.id}
                  className="min-w-[100px]"
                >
                  {sending === example.id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-2" />
                      Testar
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <strong>Quando é disparada:</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600 text-xs space-y-1">
                    {example.id === 'project_started' && (
                      <>
                        <li>Quando um novo projeto é criado no sistema</li>
                        <li>Automaticamente após aprovação da proposta</li>
                        <li>Define equipe e cronograma inicial</li>
                      </>
                    )}
                    {example.id === 'stage_changed' && (
                      <>
                        <li>Mudança manual de etapa pelo gerente</li>
                        <li>Conclusão automática de milestones</li>
                        <li>Atualização de cronograma</li>
                      </>
                    )}
                    {example.id === 'task_completed' && (
                      <>
                        <li>Tarefa marcada como concluída</li>
                        <li>Upload de arquivos/entregas</li>
                        <li>Milestone atingido</li>
                      </>
                    )}
                    {example.id === 'payment_due' && (
                      <>
                        <li>Data de vencimento se aproximando (3 dias antes)</li>
                        <li>Pagamento em atraso</li>
                        <li>Nova cobrança gerada</li>
                      </>
                    )}
                    {example.id === 'feedback_required' && (
                      <>
                        <li>Tarefa precisa de aprovação do cliente</li>
                        <li>Solicitação manual de feedback</li>
                        <li>Prazo de resposta definido</li>
                      </>
                    )}
                    {example.id === 'project_completed' && (
                      <>
                        <li>Todas as etapas concluídas</li>
                        <li>Entrega final aprovada</li>
                        <li>Projeto marcado como finalizado</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <div className="text-xs text-gray-500 border-t pt-2">
                  <strong>Dados incluídos:</strong> {Object.keys(example.example_data).join(', ')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações Adicionais */}
      <Card className="bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Como Funciona na Prática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">🔧 Configuração Inicial</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Agência cadastra WhatsApp Business API
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Clientes cadastram número do WhatsApp
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Sistema detecta mudanças automaticamente
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  Notificações enviadas em tempo real
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">📊 Benefícios</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  Reduz 80% das ligações de acompanhamento
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  Cliente sempre informado sobre o progresso
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  Histórico completo de comunicação
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  Melhor experiência do cliente
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}