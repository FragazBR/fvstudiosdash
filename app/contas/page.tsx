'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PermissionGuard } from '@/components/permission-guard'
import Topbar from '@/components/Shared/Topbar'
import { Sidebar } from '@/components/sidebar'
import { NewClientModal } from '@/components/new-client-modal'
import { SocialMediaTab } from '@/components/social-media-tab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Search,
  Filter,
  Eye,
  Calendar,
  FolderKanban,
  MessageSquare,
  Bell,
  Bot,
  MoreVertical,
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Activity,
  Plus,
  MessageCircle,
  Target,
  PieChart,
  Instagram,
  Facebook,
  Linkedin,
  CheckCircle,
  Clock,
  Edit,
  DollarSign,
  Trash2
} from 'lucide-react'

interface Contact {
  id: string;
  contact_name: string; // SCHEMA PADRONIZADO WORKSTATION
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: 'lead' | 'client' | 'prospect' | 'independent_client' | 'independent_lead' | 'independent_prospect';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  last_interaction?: string;
  projects?: any[];
  total_project_value?: number;
  active_projects?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'client':
    case 'independent_client': 
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'lead':
    case 'independent_lead': 
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'prospect':
    case 'independent_prospect': 
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

function ContasContent() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeClients: 0,
    activeProjects: 0,
    totalRevenue: 0
  })
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
        
        // Calcular estatísticas
        const totalContacts = data.contacts?.length || 0
        const activeClients = data.contacts?.filter((c: Contact) => c.status === 'active').length || 0
        const activeProjects = data.contacts?.reduce((sum: number, c: Contact) => sum + (c.active_projects || 0), 0) || 0
        const totalRevenue = data.contacts?.reduce((sum: number, c: Contact) => sum + (c.total_project_value || 0), 0) || 0
        
        setStats({
          totalContacts,
          activeClients, 
          activeProjects,
          totalRevenue
        })
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewProjects = (contactId: string) => {
    router.push(`/projects?client=${contactId}`)
  }

  const handleDeleteClient = async (contactId: string, contactName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${contactName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/contacts?id=${contactId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Atualizar a lista de contatos
        fetchContacts()
        // Mostrar mensagem de sucesso (você pode usar toast aqui)
        alert('Cliente excluído com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao excluir cliente: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Erro ao excluir cliente. Tente novamente.')
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Contas"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-500" />
                  Gestão de Contas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Organize e gerencie todos os seus clientes em um só lugar
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar contas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs defaultValue="accounts" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="accounts" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contas
                </TabsTrigger>
                <TabsTrigger value="social-media" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Social Media
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Tarefas
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendário
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Campanhas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Contas</p>
                          {loading ? (
                            <Skeleton className="h-8 w-12" />
                          ) : (
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalContacts}</p>
                          )}
                        </div>
                        <Building2 className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes Ativos</p>
                          {loading ? (
                            <Skeleton className="h-8 w-12" />
                          ) : (
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeClients}</p>
                          )}
                        </div>
                        <Activity className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projetos Ativos</p>
                          {loading ? (
                            <Skeleton className="h-8 w-12" />
                          ) : (
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeProjects}</p>
                          )}
                        </div>
                        <FolderKanban className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
                          {loading ? (
                            <Skeleton className="h-8 w-16" />
                          ) : (
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL',
                                minimumFractionDigits: 0 
                              }).format(stats.totalRevenue)}
                            </p>
                          )}
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Loading skeleton */}
                {loading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="bg-white/90 dark:bg-[#171717]/60">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Skeleton className="h-6 w-20" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Contas Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredContacts.map((contact) => (
                        <Card key={contact.id} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 hover:shadow-lg transition-all duration-200 cursor-pointer">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    {(contact.company || contact.contact_name).charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                                    {contact.company || contact.contact_name}
                                  </CardTitle>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {contact.company ? contact.contact_name : (contact.position || 'Responsável')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(contact.id, contact.contact_name)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent>
                            <div className="space-y-4">
                              {/* Status & Type */}
                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  <Badge className={getStatusColor(contact.status)}>
                                    {contact.status}
                                  </Badge>
                                  <Badge className={getTypeColor(contact.type)}>
                                    {contact.type?.replace('independent_', '') || contact.type}
                                  </Badge>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {contact.last_interaction 
                                    ? `${Math.floor((Date.now() - new Date(contact.last_interaction).getTime()) / (1000 * 60 * 60 * 24))}d atrás`
                                    : 'Sem interação'
                                  }
                                </span>
                              </div>

                              {/* Informações de contato */}
                              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate">{contact.email}</span>
                                </div>
                                {contact.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{contact.phone}</span>
                                  </div>
                                )}
                                {contact.company && (
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span className="truncate">{contact.company}</span>
                                  </div>
                                )}
                              </div>

                              {/* Métricas */}
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Projetos</p>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {contact.active_projects || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Valor</p>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {contact.total_project_value 
                                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(contact.total_project_value)
                                      : 'R$ 0'
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="flex gap-2 pt-4">
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleViewProjects(contact.id)}
                                >
                                  <FolderKanban className="h-4 w-4 mr-2" />
                                  Ver Projetos
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Empty state */}
                    {!loading && filteredContacts.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {contacts.length === 0 ? 'Nenhuma conta cadastrada ainda' : 'Nenhuma conta encontrada'}
                        </p>
                        <Button onClick={() => setIsNewClientModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Primeira Conta
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="social-media">
                <SocialMediaTab contacts={contacts} loading={loading} />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <TasksTab contacts={contacts} loading={loading} />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6">
                <CalendarTab contacts={contacts} loading={loading} />
              </TabsContent>

              <TabsContent value="campaigns" className="space-y-6">
                <CampaignsTab contacts={contacts} loading={loading} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onClientCreated={fetchContacts}
      />
    </div>
  )
}

// TasksTab Component - Kanban-style task management
function TasksTab({ contacts, loading }: { contacts: Contact[], loading: boolean }) {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Criar campanha Instagram', client: 'TechCorp', status: 'todo', priority: 'high', dueDate: '2024-01-15' },
    { id: '2', title: 'Relatório mensal Facebook', client: 'StartupX', status: 'doing', priority: 'medium', dueDate: '2024-01-20' },
    { id: '3', title: 'Aprovação de posts', client: 'AgencyY', status: 'review', priority: 'low', dueDate: '2024-01-18' },
    { id: '4', title: 'Análise de métricas', client: 'TechCorp', status: 'done', priority: 'high', dueDate: '2024-01-10' }
  ])

  const columns = [
    { id: 'todo', title: 'A Fazer', color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'doing', title: 'Em Andamento', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'review', title: 'Revisão', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { id: 'done', title: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-96">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Tarefas</p>
                <p className="text-xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Em Andamento</p>
                <p className="text-xl font-bold text-blue-600">{tasks.filter(t => t.status === 'doing').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-xl font-bold text-yellow-600">{tasks.filter(t => t.status === 'review').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Concluídas</p>
                <p className="text-xl font-bold text-green-600">{tasks.filter(t => t.status === 'done').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map(column => (
          <Card key={column.id} className={column.color}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {column.title}
                <Badge variant="secondary" className="text-xs">
                  {tasks.filter(t => t.status === column.id).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.filter(task => task.status === column.id).map(task => (
                <Card key={task.id} className={`border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow cursor-pointer`}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {task.client}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar tarefa
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// CalendarTab Component - Post scheduling calendar
function CalendarTab({ contacts, loading }: { contacts: Contact[], loading: boolean }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [posts, setPosts] = useState([
    { id: '1', title: 'Post promocional - TechCorp', client: 'TechCorp', platform: 'instagram', time: '09:00', status: 'scheduled' },
    { id: '2', title: 'Story engagement - StartupX', client: 'StartupX', platform: 'facebook', time: '14:30', status: 'published' },
    { id: '3', title: 'Vídeo tutorial - AgencyY', client: 'AgencyY', platform: 'linkedin', time: '16:00', status: 'draft' }
  ])

  const platformIcons = {
    instagram: <Instagram className="h-4 w-4 text-pink-500" />,
    facebook: <Facebook className="h-4 w-4 text-blue-600" />,
    linkedin: <Linkedin className="h-4 w-4 text-blue-700" />
  }

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posts Agendados</p>
                <p className="text-xl font-bold text-blue-600">{posts.filter(p => p.status === 'scheduled').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Publicados</p>
                <p className="text-xl font-bold text-green-600">{posts.filter(p => p.status === 'published').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rascunhos</p>
                <p className="text-xl font-bold">{posts.filter(p => p.status === 'draft').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                <p className="text-xl font-bold text-purple-600">{posts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário de Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Post
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Hoje</Button>
                <Button variant="outline" size="sm">Semana</Button>
                <Button variant="outline" size="sm">Mês</Button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-80 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Calendário interativo em desenvolvimento</p>
                <p className="text-sm">Use os botões acima para navegar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Posts de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {platformIcons[post.platform as keyof typeof platformIcons]}
                    <span className="text-sm font-medium">{post.time}</span>
                  </div>
                  <Badge className={statusColors[post.status as keyof typeof statusColors]}>
                    {post.status}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm">{post.title}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Building2 className="h-3 w-3" />
                  {post.client}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Ver todos os posts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// CampaignsTab Component - Campaign management
function CampaignsTab({ contacts, loading }: { contacts: Contact[], loading: boolean }) {
  const [campaigns, setCampaigns] = useState([
    { 
      id: '1', 
      name: 'Campanha Black Friday - TechCorp', 
      client: 'TechCorp', 
      status: 'active', 
      budget: 5000, 
      spent: 3200, 
      reach: 45000, 
      engagement: 8.5,
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    { 
      id: '2', 
      name: 'Lançamento Produto - StartupX', 
      client: 'StartupX', 
      status: 'paused', 
      budget: 3000, 
      spent: 1800, 
      reach: 28000, 
      engagement: 12.3,
      startDate: '2024-01-10',
      endDate: '2024-02-10'
    },
    { 
      id: '3', 
      name: 'Awareness Brand - AgencyY', 
      client: 'AgencyY', 
      status: 'completed', 
      budget: 8000, 
      spent: 7500, 
      reach: 120000, 
      engagement: 6.8,
      startDate: '2023-12-01',
      endDate: '2023-12-31'
    }
  ])

  const getCampaignStatusBadge = (status: string) => {
    const variants = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'paused': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    
    const labels = {
      'active': 'Ativa',
      'paused': 'Pausada', 
      'completed': 'Concluída',
      'draft': 'Rascunho'
    }

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.draft}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const averageEngagement = campaigns.reduce((sum, c) => sum + c.engagement, 0) / campaigns.length
  const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0)

  return (
    <div className="space-y-6">
      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Campanhas Ativas</p>
                <p className="text-xl font-bold text-blue-600">{campaigns.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Budget Total</p>
                <p className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBudget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alcance Total</p>
                <p className="text-xl font-bold text-purple-600">{totalReach.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Médio</p>
                <p className="text-xl font-bold text-orange-600">{averageEngagement.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Campanhas Ativas</h3>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {campaigns.map(campaign => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{campaign.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Building2 className="h-4 w-4" />
                      {campaign.client}
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
                      {new Date(campaign.startDate).toLocaleDateString('pt-BR')} - {new Date(campaign.endDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getCampaignStatusBadge(campaign.status)}
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                    <p className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.budget)}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.spent)} gasto
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alcance</p>
                    <p className="font-semibold text-purple-600">{campaign.reach.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">pessoas alcançadas</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Engagement</p>
                    <p className="font-semibold text-orange-600">{campaign.engagement}%</p>
                    <p className="text-xs text-gray-500">taxa de engajamento</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                    <p className="font-semibold text-green-600">
                      {((campaign.reach * 0.01) / campaign.spent * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">retorno estimado</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  <Button variant="outline" size="sm">
                    <PieChart className="h-4 w-4 mr-2" />
                    Relatório
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ContasPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'agency_staff', 'independent_producer']} showUnauthorized>
      <ContasContent />
    </PermissionGuard>
  )
}
