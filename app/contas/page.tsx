'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PermissionGuard } from '@/components/permission-guard'
import Topbar from '@/components/Shared/Topbar'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
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
  Plus
} from 'lucide-react'

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: 'lead' | 'client' | 'prospect';
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
    case 'client': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'lead': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'prospect': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
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
        const activeClients = data.contacts?.filter((c: Contact) => c.status === 'active' && c.type === 'client').length || 0
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
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewProjects = (contactId: string) => {
    router.push(`/projects?client=${contactId}`)
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
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                                {contact.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                                {contact.name}
                              </CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {contact.position || contact.company || 'Cliente'}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
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
                                {contact.type}
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
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Conta
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ContasPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_staff', 'independent_producer']} showUnauthorized>
      <ContasContent />
    </PermissionGuard>
  )
}
