'use client'

import React, { useState, useEffect } from 'react'
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
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Types for database data
interface DatabaseConversation {
  conversation_id: string
  conversation_type: string
  conversation_name: string
  project_name?: string
  last_message: string
  last_message_time: string
  unread_count: number
  participants: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
}

interface DatabaseMessage {
  message_id: string
  sender_id: string
  sender_name: string
  sender_email: string
  content: string
  message_type: string
  file_url?: string
  file_name?: string
  reply_to_id?: string
  is_edited: boolean
  created_at: string
  is_read: boolean
}

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
  const { user } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [conversations, setConversations] = useState<DatabaseConversation[]>([])
  const [messages, setMessages] = useState<DatabaseMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Fetch conversations on component mount
  useEffect(() => {
    if (user?.id) {
      fetchConversations()
    }
  }, [user?.id])

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const supabase = supabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) return

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        // Auto-select first conversation if none selected
        if (!selectedConversation && data.conversations?.length > 0) {
          setSelectedConversation(data.conversations[0].conversation_id)
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const supabase = supabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) return

      const response = await fetch(`/api/messages?conversation_id=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const participantNames = conv.participants.map(p => p.name).join(' ')
    const matchesSearch = participantNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (conv.conversation_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || conv.conversation_type === filterType
    
    return matchesSearch && matchesFilter
  })

  const currentConversation = conversations.find(c => c.conversation_id === selectedConversation)
  const conversationMessages = messages

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

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sendingMessage) return
    
    try {
      setSendingMessage(true)
      const supabase = supabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) return

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          content: messageText,
          message_type: 'text'
        })
      })

      if (response.ok) {
        setMessageText('')
        // Refresh messages to show the new one
        await fetchMessages(selectedConversation)
        // Refresh conversations to update last message
        await fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
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
          {loading ? (
            <div className="p-4 text-center text-gray-500">Carregando conversas...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Nenhuma conversa encontrada</div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = selectedConversation === conversation.conversation_id
              const unreadCount = conversation.unread_count

              return (
              <div
                key={conversation.conversation_id}
                className={`p-4 border-b border-gray-100 dark:border-[#272727] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 ${
                  isSelected ? 'bg-slate-50 dark:bg-slate-900/20 border-r-2 border-slate-500 dark:border-[#64f481]' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.conversation_id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {conversation.conversation_type === 'group' || conversation.conversation_type === 'project' ? (
                      <div className="h-12 w-12 bg-gray-200 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {conversation.participants.find(p => p.id !== user?.id)?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {conversation.conversation_type === 'group' || conversation.conversation_type === 'project'
                          ? (conversation.conversation_name || `Grupo ${conversation.project_name ? '- ' + conversation.project_name : ''}`)
                          : conversation.participants.find(p => p.id !== user?.id)?.name || 'Conversa'
                        }
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {getLastMessageTime(new Date(conversation.last_message_time))}
                        </span>
                        {unreadCount > 0 && (
                          <Badge className="bg-[#64f481] text-black text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {conversation.last_message || 'Nenhuma mensagem'}
                    </p>
                  </div>
                </div>
              </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-[#272727] bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentConversation?.conversation_type === 'group' || currentConversation?.conversation_type === 'project' ? (
                  <div className="h-10 w-10 bg-gray-200 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {currentConversation?.participants.find(p => p.id !== user?.id)?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h2 className="font-medium text-gray-900 dark:text-white">
                    {currentConversation?.conversation_type === 'group' || currentConversation?.conversation_type === 'project'
                      ? (currentConversation.conversation_name || `Grupo ${currentConversation.project_name ? '- ' + currentConversation.project_name : ''}`)
                      : currentConversation?.participants.find(p => p.id !== user?.id)?.name || 'Conversa'
                    }
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentConversation?.participants.length || 0} participante(s)
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
              const isOwn = message.sender_id === user?.id

              return (
                <div key={message.message_id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {message.sender_name?.split(' ').map(n => n[0]).join('') || 'U'}
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
                        {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
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
                disabled={!messageText.trim() || sendingMessage}
                className="bg-[#64f481] hover:bg-[#50d66f] text-black"
              >
                {sendingMessage ? '...' : <Send className="h-4 w-4" />}
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
