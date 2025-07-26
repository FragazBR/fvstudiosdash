'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PermissionGuard } from '@/components/permission-guard'
import Topbar from '@/components/Shared/Topbar'
import { Sidebar } from '@/components/sidebar'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Home,
  TrendingUp,
  Users,
  FolderKanban,
  Calendar,
  Bell,
  MessageCircle,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Activity,
  DollarSign,
  Crown,
  Settings,
  HelpCircle,
  ArrowRight,
  Building2
} from 'lucide-react'

function HomeContent() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading } = useUser()

  const getRoleWelcomeMessage = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return 'Gerencie todo o sistema FVStudios e monitore a performance das agências.'
      case 'agency_owner':
        return 'Acompanhe o crescimento da sua agência e gerencie toda a operação.'
      case 'agency_manager':
        return 'Coordene projetos e equipes para entregar resultados excepcionais.'
      case 'agency_staff':
        return 'Execute projetos com excelência e colabore com sua equipe.'
      case 'independent_producer':
        return 'Gerencie seus clientes e projetos de forma independente.'
      case 'influencer':
        return 'Monitore suas redes sociais e gerencie suas campanhas.'
      case 'agency_client':
      case 'independent_client':
        return 'Acompanhe o progresso dos seus projetos e aprove entregas.'
      case 'free_user':
        return 'Explore as funcionalidades básicas e descubra como podemos ajudar seu negócio.'
      default:
        return 'Sua central de comando para gestão de projetos e marketing digital.'
    }
  }

  const renderRoleSpecificContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    switch (user?.role) {
      case 'admin':
        return <AdminHomeContent />
      case 'agency_owner':
      case 'agency_manager':
      case 'agency_staff':
        return <AgencyHomeContent />
      case 'independent_producer':
        return <IndependentProducerHomeContent />
      case 'influencer':
        return <InfluencerHomeContent />
      case 'agency_client':
      case 'independent_client':
        return <ClientHomeContent />
      case 'free_user':
        return <FreeUserHomeContent />
      default:
        return <DefaultHomeContent />
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Home"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Home className="h-8 w-8 text-blue-500" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Bem-vindo, {user?.name || 'Usuário'}!
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {getRoleWelcomeMessage(user?.role)}
              </p>
            </div>

            {/* Role-specific content */}
            {renderRoleSpecificContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

// Utility Components
function StatsCard({ title, value, icon: Icon, color, trend }: any) {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500', 
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {trend && (
              <p className={`text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {trend} vs mês anterior
              </p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionButton({ icon: Icon, label, onClick }: any) {
  return (
    <Button
      variant="outline"
      className="h-20 flex flex-col items-center justify-center gap-2"
      onClick={onClick}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm">{label}</span>
    </Button>
  )
}

// Admin Home Content
function AdminHomeContent() {
  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Agências"
          value="47"
          icon={Building2}
          color="blue"
          trend="+12%"
        />
        <StatsCard
          title="Usuários Ativos"
          value="2,341"
          icon={Users}
          color="green"
          trend="+8%"
        />
        <StatsCard
          title="Receita Mensal"
          value="R$ 127.500"
          icon={DollarSign}
          color="purple"
          trend="+23%"
        />
        <StatsCard
          title="Suporte Tickets"
          value="15"
          icon={HelpCircle}
          color="orange"
          trend="-5%"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton 
              icon={Settings}
              label="Configurações"
              onClick={() => router.push('/admin')}
            />
            <QuickActionButton 
              icon={Users}
              label="Gerenciar Agências"
              onClick={() => router.push('/admin/agencies')}
            />
            <QuickActionButton 
              icon={BarChart3}
              label="Relatórios"
              onClick={() => router.push('/reports')}
            />
            <QuickActionButton 
              icon={HelpCircle}
              label="Suporte"
              onClick={() => router.push('/admin/support')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Agency Home Content
function AgencyHomeContent() {
  const router = useRouter()
  
  return (
    <div className="space-y-6">
      {/* KPIs Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Receita Mensal"
          value="R$ 45.200"
          icon={DollarSign}
          color="green"
          trend="+15%"
        />
        <StatsCard
          title="Clientes Ativos"
          value="28"
          icon={Users}
          color="blue"
          trend="+3"
        />
        <StatsCard
          title="Projetos Ativos"
          value="156"
          icon={FolderKanban}
          color="purple"
          trend="+12"
        />
        <StatsCard
          title="Taxa de Conclusão"
          value="94%"
          icon={Target}
          color="orange"
          trend="+2%"
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full mt-2 bg-green-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100">Projeto 'Campanha Verão' foi aprovado pelo cliente</p>
                  <p className="text-xs text-gray-500">há 1 hora</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full mt-2 bg-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100">Nova tarefa atribuída para equipe de design</p>
                  <p className="text-xs text-gray-500">há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full mt-2 bg-orange-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100">Cliente Loja XYZ solicitou revisão</p>
                  <p className="text-xs text-gray-500">há 4 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionButton 
                icon={Plus}
                label="Novo Projeto"
                onClick={() => router.push('/projects')}
              />
              <QuickActionButton 
                icon={Users}
                label="Novo Cliente"
                onClick={() => router.push('/contas')}
              />
              <QuickActionButton 
                icon={Calendar}
                label="Calendário"
                onClick={() => router.push('/calendar')}
              />
              <QuickActionButton 
                icon={BarChart3}
                label="Relatórios"
                onClick={() => router.push('/reports')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Independent Producer Home Content
function IndependentProducerHomeContent() {
  const router = useRouter()
  
  return (
    <div className="space-y-6">
      {/* Personal Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Receita Este Mês"
          value="R$ 12.800"
          icon={DollarSign}
          color="green"
          trend="+22%"
        />
        <StatsCard
          title="Clientes Ativos"
          value="8"
          icon={Users}
          color="blue"
          trend="+2"
        />
        <StatsCard
          title="Projetos Ativos"
          value="15"
          icon={FolderKanban}
          color="purple"
          trend="+3"
        />
        <StatsCard
          title="Taxa de Entrega"
          value="98%"
          icon={Target}
          color="orange"
          trend="+5%"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton 
              icon={Plus}
              label="Novo Projeto"
              onClick={() => router.push('/projects')}
            />
            <QuickActionButton 
              icon={Users}
              label="Novo Cliente"
              onClick={() => router.push('/contas')}
            />
            <QuickActionButton 
              icon={Calendar}
              label="Calendário"
              onClick={() => router.push('/calendar')}
            />
            <QuickActionButton 
              icon={BarChart3}
              label="Relatórios"
              onClick={() => router.push('/reports')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Influencer Home Content
function InfluencerHomeContent() {
  return (
    <div className="space-y-6">
      {/* Social Media Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Seguidores Totais"
          value="127.5K"
          icon={Users}
          color="blue"
          trend="+2.3K"
        />
        <StatsCard
          title="Engajamento Médio"
          value="4.8%"
          icon={Activity}
          color="green"
          trend="+0.3%"
        />
        <StatsCard
          title="Campanhas Ativas"
          value="6"
          icon={Target}
          color="purple"
          trend="+2"
        />
        <StatsCard
          title="Receita Este Mês"
          value="R$ 8.200"
          icon={DollarSign}
          color="orange"
          trend="+15%"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton 
              icon={MessageCircle}
              label="Social Media"
              onClick={() => {}}
            />
            <QuickActionButton 
              icon={Calendar}
              label="Calendário"
              onClick={() => {}}
            />
            <QuickActionButton 
              icon={BarChart3}
              label="Analytics"
              onClick={() => {}}
            />
            <QuickActionButton 
              icon={Target}
              label="Campanhas"
              onClick={() => {}}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Client Home Content
function ClientHomeContent() {
  return (
    <div className="space-y-6">
      {/* Project Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Projetos Ativos"
          value="4"
          icon={FolderKanban}
          color="blue"
          trend="+1"
        />
        <StatsCard
          title="Entregas Este Mês"
          value="12"
          icon={CheckCircle}
          color="green"
          trend="+3"
        />
        <StatsCard
          title="Aprovações Pendentes"
          value="2"
          icon={Clock}
          color="orange"
          trend="-1"
        />
        <StatsCard
          title="Investimento Total"
          value="R$ 45.200"
          icon={DollarSign}
          color="purple"
          trend="+12%"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comunicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button className="w-full" variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat com a Agência
            </Button>
            <Button className="w-full" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Reunião
            </Button>
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Free User Home Content
function FreeUserHomeContent() {
  return (
    <div className="space-y-6">
      {/* Welcome & Limits */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Bem-vindo ao FVStudios! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Você está usando o plano gratuito. Explore nossas funcionalidades!
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">Plano Gratuito</Badge>
                <span className="text-sm text-gray-500">
                  2 de 3 projetos utilizados
                </span>
              </div>
            </div>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Crown className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-500" />
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 / 3</div>
            <Progress value={66} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">Limite do plano gratuito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 / 2</div>
            <Progress value={50} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">Incluindo você</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245 MB / 500 MB</div>
            <Progress value={49} className="mt-2" />
            <p className="text-sm text-gray-500 mt-2">Arquivos e mídia</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Default fallback content
function DefaultHomeContent() {
  return (
    <div className="text-center py-12">
      <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Bem-vindo ao FVStudios
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Sua plataforma de gestão de projetos e marketing digital
      </p>
    </div>
  )
}

export default function HomePage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'agency_staff', 'independent_producer', 'influencer', 'agency_client', 'independent_client', 'free_user']} showUnauthorized>
      <HomeContent />
    </PermissionGuard>
  )
}