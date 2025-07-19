'use client'

import React, { useState } from 'react'
import Topbar from '@/components/Shared/Topbar'
import { Sidebar } from '@/components/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Activity
} from 'lucide-react'

// Mock data dos clientes/contas
const mockContas = [
  {
    id: 1,
    nome: 'Empresa ABC Ltda',
    avatar: '',
    email: 'contato@empresaabc.com',
    telefone: '(11) 98765-4321',
    cidade: 'São Paulo - SP',
    status: 'Ativo',
    projetos: 3,
    projetosAtivos: 2,
    valorTotal: 'R$ 45.000',
    proximaEntrega: '2025-01-25',
    ultimaInteracao: '2 horas atrás',
    responsavel: 'Ana Silva',
    etapaAtual: 'Em Execução',
    processos: [
      { nome: 'Website Redesign', etapa: 'Desenvolvimento', status: 'Em Execução' },
      { nome: 'Campanha Digital', etapa: 'Aprovação', status: 'Concluído' },
      { nome: 'Brand Identity', etapa: 'Planejamento', status: 'Planejamento' }
    ]
  },
  {
    id: 2,
    nome: 'Startup XYZ',
    avatar: '',
    email: 'hello@startupxyz.com',
    telefone: '(11) 94567-8901',
    cidade: 'Rio de Janeiro - RJ',
    status: 'Ativo',
    projetos: 2,
    projetosAtivos: 1,
    valorTotal: 'R$ 28.500',
    proximaEntrega: '2025-01-30',
    ultimaInteracao: '1 dia atrás',
    responsavel: 'Carlos Santos',
    etapaAtual: 'Desenvolvimento',
    processos: [
      { nome: 'Mobile App', etapa: 'Execução das Produções', status: 'Em Execução' },
      { nome: 'Landing Page', etapa: 'Aprovação', status: 'Concluído' }
    ]
  },
  {
    id: 3,
    nome: 'Loja Online 123',
    avatar: '',
    email: 'comercial@loja123.com.br',
    telefone: '(11) 91234-5678',
    cidade: 'Belo Horizonte - MG',
    status: 'Pendente',
    projetos: 1,
    projetosAtivos: 0,
    valorTotal: 'R$ 15.000',
    proximaEntrega: '2025-02-15',
    ultimaInteracao: '3 dias atrás',
    responsavel: 'Maria Costa',
    etapaAtual: 'Atrasado',
    processos: [
      { nome: 'E-commerce', etapa: 'Análise e Diagnóstico', status: 'Atrasado' }
    ]
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Planejamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'Em Execução': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'Concluído': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'Atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

export default function ContasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConta, setSelectedConta] = useState<any>(null)

  const filteredContas = mockContas.filter(conta =>
    conta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Contas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">3</p>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contas Ativas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">2</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projetos Ativos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">3</p>
                    </div>
                    <FolderKanban className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">R$ 88.5K</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredContas.map((conta) => (
                <Card key={conta.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conta.avatar} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {conta.nome.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                            {conta.nome}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {conta.responsavel}
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
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(conta.etapaAtual)}>
                          {conta.etapaAtual}
                        </Badge>
                        <span className="text-sm text-gray-500">{conta.ultimaInteracao}</span>
                      </div>

                      {/* Informações de contato */}
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{conta.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{conta.telefone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{conta.cidade}</span>
                        </div>
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Projetos</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {conta.projetosAtivos}/{conta.projetos}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Valor</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {conta.valorTotal}
                          </p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 pt-4">
                        <Button size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button variant="outline" size="sm">
                          <FolderKanban className="h-4 w-4" />
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

            {filteredContas.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhuma conta encontrada
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
