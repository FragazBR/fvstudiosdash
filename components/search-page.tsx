'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter,
  Clock,
  FileText,
  Users,
  MessageCircle,
  Calendar,
  Bot,
  ArrowRight,
  Zap,
  TrendingUp,
  Star,
  History,
  X
} from 'lucide-react'
import { type Project, type Client, type AIAgent, type Message, type Notification, WORKFLOW_STAGES } from '@/types/workflow'

// Tipos para busca
interface SearchResult {
  id: string
  type: 'project' | 'client' | 'message' | 'notification' | 'agent' | 'workflow'
  title: string
  description: string
  metadata?: Record<string, any>
  score: number
}

// Mock data para busca
const mockSearchData = {
  projects: [
    {
      id: 'project-1',
      name: 'Nike Summer Collection',
      client: 'Nike Brasil',
      status: 'production',
      stage: 'criacao_conteudo'
    }
  ],
  clients: [
    {
      id: 'client-1',
      name: 'Nike Brasil',
      industry: 'Fashion',
      activeProjects: 3
    }
  ],
  messages: [
    {
      id: 'msg-1',
      content: 'Como está o progresso do projeto Nike?',
      sender: 'Maria Santos',
      timestamp: new Date()
    }
  ],
  agents: [
    {
      id: 'agent-1',
      name: 'Creative Assistant',
      type: 'content',
      isActive: true
    }
  ]
}

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Simulação de busca
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 300))

    const results: SearchResult[] = []

    // Buscar em projetos
    mockSearchData.projects.forEach(project => {
      if (project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.client.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          description: `Cliente: ${project.client} • Status: ${project.status}`,
          metadata: project,
          score: 0.9
        })
      }
    })

    // Buscar em clientes
    mockSearchData.clients.forEach(client => {
      if (client.name.toLowerCase().includes(query.toLowerCase()) ||
          client.industry.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: client.id,
          type: 'client',
          title: client.name,
          description: `${client.industry} • ${client.activeProjects} projetos ativos`,
          metadata: client,
          score: 0.8
        })
      }
    })

    // Buscar em mensagens
    mockSearchData.messages.forEach(message => {
      if (message.content.toLowerCase().includes(query.toLowerCase()) ||
          message.sender.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: message.id,
          type: 'message',
          title: `Mensagem de ${message.sender}`,
          description: message.content,
          metadata: message,
          score: 0.7
        })
      }
    })

    // Buscar em agents
    mockSearchData.agents.forEach(agent => {
      if (agent.name.toLowerCase().includes(query.toLowerCase()) ||
          agent.type.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: agent.id,
          type: 'agent',
          title: agent.name,
          description: `IA Agent • Tipo: ${agent.type} • ${agent.isActive ? 'Ativo' : 'Inativo'}`,
          metadata: agent,
          score: 0.6
        })
      }
    })

    // Buscar em workflow stages
    WORKFLOW_STAGES.forEach(stage => {
      if (stage.name.toLowerCase().includes(query.toLowerCase()) ||
          stage.description.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: stage.id,
          type: 'workflow',
          title: stage.name,
          description: stage.description,
          metadata: stage,
          score: 0.5
        })
      }
    })

    // Ordenar por score
    results.sort((a, b) => b.score - a.score)

    setSearchResults(results)
    setIsLoading(false)

    // Adicionar à busca recente
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project': return <FileText className="h-4 w-4" />
      case 'client': return <Users className="h-4 w-4" />
      case 'message': return <MessageCircle className="h-4 w-4" />
      case 'agent': return <Bot className="h-4 w-4" />
      case 'workflow': return <Zap className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  const getResultColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'client': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'message': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'agent': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'workflow': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getResultUrl = (result: SearchResult) => {
    switch (result.type) {
      case 'project': return `/workstation/${result.id}`
      case 'client': return `/clients/${result.id}`
      case 'message': return `/messages/${result.id}`
      case 'agent': return `/ai-agents/${result.id}`
      case 'workflow': return `/workflow/${result.id}`
      default: return '#'
    }
  }

  const filteredResults = selectedFilter === 'all' 
    ? searchResults 
    : searchResults.filter(result => result.type === selectedFilter)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Encontre projetos, clientes, mensagens, agents e mais
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input 
          placeholder="Digite para buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-12 py-3 text-lg"
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSearchResults([])
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={selectedFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('all')}
          className={selectedFilter === 'all' ? 'bg-[#64f481] text-black hover:bg-[#50d66f]' : ''}
        >
          Todos
        </Button>
        <Button
          variant={selectedFilter === 'project' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('project')}
          className={selectedFilter === 'project' ? 'bg-[#64f481] text-black hover:bg-[#50d66f]' : ''}
        >
          <FileText className="h-3 w-3 mr-1" />
          Projetos
        </Button>
        <Button
          variant={selectedFilter === 'client' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('client')}
          className={selectedFilter === 'client' ? 'bg-[#64f481] text-black hover:bg-[#50d66f]' : ''}
        >
          <Users className="h-3 w-3 mr-1" />
          Clientes
        </Button>
        <Button
          variant={selectedFilter === 'message' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('message')}
          className={selectedFilter === 'message' ? 'bg-[#64f481] text-black hover:bg-[#50d66f]' : ''}
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Mensagens
        </Button>
        <Button
          variant={selectedFilter === 'agent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('agent')}
          className={selectedFilter === 'agent' ? 'bg-[#64f481] text-black hover:bg-[#50d66f]' : ''}
        >
          <Bot className="h-3 w-3 mr-1" />
          IA Agents
        </Button>
      </div>

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Buscas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery(search)}
                  className="text-sm"
                >
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-[#64f481] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Buscando...</p>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && searchQuery && (
        <div className="space-y-4">
          {filteredResults.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''} 
                  {selectedFilter !== 'all' && ` em ${selectedFilter}`}
                </p>
              </div>

              <div className="space-y-3">
                {filteredResults.map((result) => (
                  <Card 
                    key={result.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      // Navegar para o resultado
                      window.location.href = getResultUrl(result)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getResultColor(result.type)}`}>
                          {getResultIcon(result.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {result.title}
                            </h3>
                            <Badge className={getResultColor(result.type)}>
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {result.description}
                          </p>
                          
                          {/* Metadata específica por tipo */}
                          {result.type === 'project' && result.metadata && (
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Stage: {result.metadata.stage}</span>
                              <span>Status: {result.metadata.status}</span>
                            </div>
                          )}
                          
                          {result.type === 'workflow' && result.metadata && (
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Duração: {result.metadata.duration}</span>
                              <span>Dependências: {result.metadata.dependencies?.length || 0}</span>
                            </div>
                          )}
                        </div>

                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente diferentes palavras-chave ou verifique a ortografia
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!searchQuery && recentSearches.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Dicas de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">O que você pode buscar:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Nomes de projetos e clientes</li>
                  <li>• Etapas do workflow</li>
                  <li>• Mensagens e conversas</li>
                  <li>• IA Agents e configurações</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Atalhos úteis:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• "Nike" - buscar tudo relacionado</li>
                  <li>• "aprovação" - etapas pendentes</li>
                  <li>• "ativo" - agents ativos</li>
                  <li>• "urgente" - projetos prioritários</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
