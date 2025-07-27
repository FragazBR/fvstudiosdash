'use client'

// ==================================================
// FVStudios Dashboard - WhatsApp Conversations Dashboard
// Dashboard completo para gerenciar conversas WhatsApp
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Send,
  Bot,
  User,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Play,
  Pause,
  Archive,
  Trash2,
  FileText,
  Calendar,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

// Tipos
interface WhatsAppConversation {
  id: string
  phone_number: string
  contact_name?: string
  status: 'active' | 'completed' | 'paused' | 'archived'
  conversation_type: 'briefing' | 'support' | 'sales' | 'general'
  briefing_data?: {
    current_step?: number
    total_steps?: number
    client_name?: string
    project_type?: string
    budget_range?: string
    deadline?: string
  }
  created_at: string
  last_message_at: string
  message_count: number
  completion_percentage: number
  last_message_preview: string
}

interface WhatsAppMessage {
  id: string
  content: string
  direction: 'inbound' | 'outbound'
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  message_type: 'text' | 'template' | 'interactive'
}

export function WhatsAppDashboard() {
  const { user } = useUser()
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState('')

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, statusFilter, typeFilter])

  const loadConversations = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      
      const response = await fetch(`/api/whatsapp/conversations?${params}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        toast.error('Erro ao carregar conversas')
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
      toast.error('Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    try {
      setSending(true)
      
      const response = await fetch('/api/whatsapp/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'send_message',
          phone_number: selectedConversation.phone_number,
          message: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        await loadMessages(selectedConversation.id)
        toast.success('Mensagem enviada!')
      } else {
        toast.error('Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const startBriefing = async (phoneNumber: string) => {
    try {
      const response = await fetch('/api/whatsapp/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'start_briefing',
          phone_number: phoneNumber
        })
      })

      if (response.ok) {
        toast.success('Fluxo de briefing iniciado!')
        setShowNewConversation(false)
        setNewPhoneNumber('')
        await loadConversations()
      } else {
        toast.error('Erro ao iniciar briefing')
      }
    } catch (error) {
      console.error('Erro ao iniciar briefing:', error)
      toast.error('Erro ao iniciar briefing')
    }
  }

  const updateConversationStatus = async (conversationId: string, status: string) => {
    try {
      const response = await fetch('/api/whatsapp/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'update_status',
          conversation_id: conversationId,
          status
        })
      })

      if (response.ok) {
        toast.success('Status atualizado!')
        await loadConversations()
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    const colors = {
      briefing: 'bg-purple-100 text-purple-800',
      support: 'bg-orange-100 text-orange-800',
      sales: 'bg-green-100 text-green-800',
      general: 'bg-blue-100 text-blue-800'
    }
    return colors[type as keyof typeof colors] || 'bg-blue-100 text-blue-800'
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4)
      const number = cleaned.substring(4)
      return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`
    }
    return phone
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.phone_number.includes(searchTerm) ||
                         conv.briefing_data?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
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
            <h1 className="text-2xl font-bold">WhatsApp Business</h1>
            <p className="text-gray-600">Gerencie conversas e automatize briefings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={loadConversations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
            <DialogTrigger asChild>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Iniciar Nova Conversa</DialogTitle>
                <DialogDescription>
                  Digite o número do WhatsApp para iniciar uma nova conversa
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Número do WhatsApp</label>
                  <Input
                    placeholder="5511999999999"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: código do país + DDD + número (ex: 5511999999999)
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewConversation(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => startBriefing(newPhoneNumber)}
                  disabled={!newPhoneNumber}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Iniciar Briefing
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total de Conversas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <div className="text-sm text-gray-500">
              {conversations.filter(c => c.status === 'active').length} ativas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Briefings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.conversation_type === 'briefing').length}
            </div>
            <div className="text-sm text-gray-500">
              {conversations.filter(c => c.conversation_type === 'briefing' && c.status === 'completed').length} concluídos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {conversations.filter(c => c.conversation_type === 'briefing').length > 0 
                ? Math.round((conversations.filter(c => c.conversation_type === 'briefing' && c.status === 'completed').length / conversations.filter(c => c.conversation_type === 'briefing').length) * 100)
                : 0
              }%
            </div>
            <div className="text-sm text-gray-500">dos briefings</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15min</div>
            <div className="text-sm text-gray-500">por briefing</div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversas</span>
                <Badge variant="secondary">{filteredConversations.length}</Badge>
              </CardTitle>
              
              {/* Filtros */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Tipos</SelectItem>
                      <SelectItem value="briefing">Briefing</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="general">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation)
                      loadMessages(conversation.id)
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">
                          {conversation.contact_name || formatPhoneNumber(conversation.phone_number)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {conversation.briefing_data?.client_name && (
                            <span>{conversation.briefing_data.client_name} • </span>
                          )}
                          {formatPhoneNumber(conversation.phone_number)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(conversation.last_message_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(conversation.status)}>
                        {conversation.status}
                      </Badge>
                      <Badge className={getTypeColor(conversation.conversation_type)}>
                        {conversation.conversation_type}
                      </Badge>
                    </div>
                    
                    {conversation.conversation_type === 'briefing' && conversation.briefing_data && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progresso do briefing</span>
                          <span>{conversation.completion_percentage}%</span>
                        </div>
                        <Progress value={conversation.completion_percentage} className="h-1" />
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 truncate">
                      {conversation.last_message_preview}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">
                        {conversation.message_count} mensagens
                      </div>
                      {conversation.briefing_data?.project_type && (
                        <div className="text-xs text-blue-600 font-medium">
                          {conversation.briefing_data.project_type}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat/Detalhes da Conversa */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedConversation.contact_name || formatPhoneNumber(selectedConversation.phone_number)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(selectedConversation.status)}>
                        {selectedConversation.status}
                      </Badge>
                      <Badge className={getTypeColor(selectedConversation.conversation_type)}>
                        {selectedConversation.conversation_type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedConversation.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateConversationStatus(selectedConversation.id, 'paused')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {selectedConversation.status === 'paused' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateConversationStatus(selectedConversation.id, 'active')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateConversationStatus(selectedConversation.id, 'archived')}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Informações do Briefing */}
                {selectedConversation.conversation_type === 'briefing' && selectedConversation.briefing_data && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Dados do Briefing:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedConversation.briefing_data.client_name && (
                        <div><strong>Cliente:</strong> {selectedConversation.briefing_data.client_name}</div>
                      )}
                      {selectedConversation.briefing_data.project_type && (
                        <div><strong>Projeto:</strong> {selectedConversation.briefing_data.project_type}</div>
                      )}
                      {selectedConversation.briefing_data.budget_range && (
                        <div><strong>Orçamento:</strong> {selectedConversation.briefing_data.budget_range}</div>
                      )}
                      {selectedConversation.briefing_data.deadline && (
                        <div><strong>Prazo:</strong> {selectedConversation.briefing_data.deadline}</div>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progresso: {selectedConversation.briefing_data.current_step || 0}/{selectedConversation.briefing_data.total_steps || 6}</span>
                        <span>{selectedConversation.completion_percentage}%</span>
                      </div>
                      <Progress value={selectedConversation.completion_percentage} className="h-2" />
                    </div>
                  </div>
                )}
              </CardHeader>
              
              {/* Área de Mensagens */}
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === 'outbound'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.direction === 'outbound' && (
                            <span className="ml-2">
                              {message.status === 'read' && '✓✓'}
                              {message.status === 'delivered' && '✓'}
                              {message.status === 'sent' && '→'}
                              {message.status === 'failed' && '✗'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              {/* Área de Envio */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[40px] max-h-[120px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    className="px-6"
                  >
                    {sending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para visualizar as mensagens</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}