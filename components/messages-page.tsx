'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Sidebar from './sidebar'
import Topbar from './Shared/Topbar'
import { Toaster } from '@/components/ui/toaster'
import { 
  Send, 
  Search, 
  Phone, 
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Users,
  Bot,
  Plus,
  Settings,
  Filter,
  Bell,
  BellOff
} from 'lucide-react'
import { type Message, type Conversation, type AIAgent } from '@/types/workflow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock data para demonstração
const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: ['user-1', 'client-1'],
    type: 'direct',
    updatedAt: new Date(),
    lastMessage: {
      id: '1',
      senderId: 'client-1',
      receiverId: 'user-1',
      content: 'Olá! Como está o andamento do projeto?',
      type: 'text',
      timestamp: new Date(),
      read: false,
      conversationId: '1'
    }
  },
  {
    id: '2',
    participants: ['user-1', 'team-1', 'team-2'],
    type: 'group',
    projectId: 'project-1',
    updatedAt: new Date(Date.now() - 3600000),
    lastMessage: {
      id: '2',
      senderId: 'team-1',
      receiverId: 'user-1',
      content: 'Arquivo de criativo anexado',
      type: 'file',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      conversationId: '2'
    }
  }
]

const mockUsers = [
  { id: 'user-1', name: 'João Silva', role: 'Project Manager', avatar: '', online: true },
  { id: 'client-1', name: 'Maria Santos', role: 'Cliente', avatar: '', online: false },
  { id: 'team-1', name: 'Pedro Costa', role: 'Designer', avatar: '', online: true },
  { id: 'team-2', name: 'Ana Oliveira', role: 'Content Creator', avatar: '', online: true }
]

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'client-1',
    receiverId: 'user-1',
    content: 'Olá! Como está o andamento do projeto?',
    type: 'text',
    timestamp: new Date(Date.now() - 7200000),
    read: true,
    conversationId: '1'
  },
  {
    id: '2',
    senderId: 'user-1',
    receiverId: 'client-1',
    content: 'Oi Maria! O projeto está indo muito bem. Estamos na fase de criação de conteúdo.',
    type: 'text',
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    conversationId: '1'
  },
  {
    id: '3',
    senderId: 'user-1',
    receiverId: 'client-1',
    content: 'Vou enviar um preview das peças criativas ainda hoje.',
    type: 'text',
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    conversationId: '1'
  },
  {
    id: '4',
    senderId: 'client-1',
    receiverId: 'user-1',
    content: 'Perfeito! Aguardo ansiosamente. Vocês são incríveis! 🚀',
    type: 'text',
    timestamp: new Date(Date.now() - 1800000),
    read: false,
    conversationId: '1'
  }
]

const mockAIAgents: AIAgent[] = [
  {
    id: '1',
    name: 'Support Assistant',
    type: 'support',
    description: 'Auxilia no atendimento ao cliente e respostas automáticas',
    capabilities: ['Auto-response', 'FAQ', 'Escalation'],
    isActive: true
  },
  {
    id: '2',
    name: 'Translation Bot',
    type: 'support',
    description: 'Traduz mensagens em tempo real',
    capabilities: ['Real-time translation', 'Language detection'],
    isActive: false
  }
]

export function MessagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1')
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showAIPanel, setShowAIPanel] = useState(false)

  const filteredConversations = mockConversations.filter(conv => {
    const participants = conv.participants.map(id => 
      mockUsers.find(u => u.id === id)?.name || ''
    ).join(' ')
    
    const matchesSearch = participants.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || conv.type === filterType
    
    return matchesSearch && matchesFilter
  })

  const currentConversation = mockConversations.find(c => c.id === selectedConversation)
  const conversationMessages = mockMessages.filter(m => m.conversationId === selectedConversation)

  const getUserInfo = (userId: string) => {
    return mockUsers.find(u => u.id === userId)
  }

  const getLastMessageTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return
    
    // Aqui você implementaria o envio da mensagem
    console.log('Sending message:', messageText)
    setMessageText('')
  }

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex pt-16">
        <Topbar
          name="Mensagens"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="flex h-screen bg-[#fafafa] dark:bg-[#121212] w-full">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-r border-gray-200 dark:border-[#272727] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#272727]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mensagens</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAIPanel(!showAIPanel)}
              >
                <Bot className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="direct">Diretas</SelectItem>
              <SelectItem value="group">Grupos</SelectItem>
              <SelectItem value="project">Projetos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const isSelected = selectedConversation === conversation.id
            const unreadCount = mockMessages.filter(m => 
              m.conversationId === conversation.id && !m.read
            ).length

            return (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-100 dark:border-[#272727] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 ${
                  isSelected ? 'bg-slate-50 dark:bg-slate-900/20 border-r-2 border-slate-500 dark:border-[#64f481]' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {conversation.type === 'group' ? (
                      <div className="h-12 w-12 bg-gray-200 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getUserInfo(conversation.participants[1])?.avatar} />
                        <AvatarFallback>
                          {getUserInfo(conversation.participants[1])?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {conversation.type === 'direct' && getUserInfo(conversation.participants[1])?.online && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-[#171717]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {conversation.type === 'group' 
                          ? `Grupo ${conversation.projectId ? '- Projeto' : ''}`
                          : getUserInfo(conversation.participants[1])?.name
                        }
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {getLastMessageTime(conversation.updatedAt)}
                        </span>
                        {unreadCount > 0 && (
                          <Badge className="bg-[#64f481] text-black text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conversation.lastMessage?.type === 'file' 
                        ? '📎 ' + conversation.lastMessage.content
                        : conversation.lastMessage?.content
                      }
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-[#272727] bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentConversation?.type === 'group' ? (
                  <div className="h-10 w-10 bg-gray-200 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getUserInfo(currentConversation?.participants[1] || '')?.avatar} />
                    <AvatarFallback>
                      {getUserInfo(currentConversation?.participants[1] || '')?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h2 className="font-medium text-gray-900 dark:text-white">
                    {currentConversation?.type === 'group' 
                      ? `Grupo ${currentConversation.projectId ? '- Projeto' : ''}`
                      : getUserInfo(currentConversation?.participants[1] || '')?.name
                    }
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentConversation?.type === 'direct' && getUserInfo(currentConversation.participants[1])?.online 
                      ? 'Online' 
                      : 'Offline'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafafa] dark:bg-[#121212]">
            {conversationMessages.map((message) => {
              const sender = getUserInfo(message.senderId)
              const isOwn = message.senderId === 'user-1'

              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={sender?.avatar} />
                        <AvatarFallback className="text-xs">
                          {sender?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div 
                      className={`px-3 py-2 rounded-lg ${
                        isOwn 
                          ? 'bg-[#64f481] text-black' 
                          : 'bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#272727]'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwn ? 'text-black/70' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-[#272727] bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Digite sua mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="bg-[#64f481] hover:bg-[#50d66f] text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 bg-gray-100 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Escolha uma conversa da lista para começar a trocar mensagens
            </p>
          </div>
        </div>
      )}

      {/* AI Agents Panel */}
      {showAIPanel && (
        <div className="w-80 bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-l border-gray-200 dark:border-[#272727] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">IA Agents</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAIPanel(false)}>
              ×
            </Button>
          </div>

          <div className="space-y-3">
            {mockAIAgents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Bot className="h-5 w-5 text-[#64f481]" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{agent.name}</h4>
                      <p className="text-xs text-gray-600">{agent.description}</p>
                    </div>
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button className="w-full mt-4 bg-[#64f481] hover:bg-[#50d66f] text-black">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Agent
          </Button>
        </div>
      )}
        </div>
      </div>
      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
