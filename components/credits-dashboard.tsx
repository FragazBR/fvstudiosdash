'use client'

// ==================================================
// FVStudios Dashboard - Credits Dashboard Component
// Dashboard completo de créditos com analytics e controles
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Target,
  Calendar,
  Clock,
  DollarSign,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Sparkles,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { creditsManager, type UserCredits, type CreditTransaction } from '@/lib/credits-manager'
import { CreditsRecharge } from './credits-recharge'
import { useUser } from '@/hooks/useUser'

interface CreditsDashboardProps {
  showFullDashboard?: boolean
  onRefresh?: () => void
}

export function CreditsDashboard({ 
  showFullDashboard = true,
  onRefresh
}: CreditsDashboardProps) {
  const { user } = useUser()
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [credits, transactionHistory] = await Promise.all([
        creditsManager.getUserCredits(user?.id || ''),
        creditsManager.getTransactionHistory(user?.id || '', 50)
      ])
      
      setUserCredits(credits)
      setTransactions(transactionHistory)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
    if (onRefresh) onRefresh()
    toast.success('Dashboard atualizado!')
  }

  // Processamento de dados para gráficos
  const getUsageByService = () => {
    const serviceUsage = transactions
      .filter(t => t.transaction_type === 'usage' && t.service_used)
      .reduce((acc, t) => {
        const service = t.service_used!
        const serviceName = {
          'content_generation': 'Geração de Conteúdo',
          'campaign_optimization': 'Otimização de Campanhas',
          'briefing_automation': 'Automação de Briefings',
          'insights_analysis': 'Análise de Insights',
          'keyword_research': 'Pesquisa de Palavras-chave'
        }[service] || service

        acc[serviceName] = (acc[serviceName] || 0) + Math.abs(t.credits_amount)
        return acc
      }, {} as Record<string, number>)

    return Object.entries(serviceUsage).map(([name, value]) => ({ name, value }))
  }

  const getUsageOverTime = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    return last30Days.map(date => {
      const dayUsage = transactions
        .filter(t => 
          t.transaction_type === 'usage' && 
          t.created_at.toString().startsWith(date)
        )
        .reduce((sum, t) => sum + Math.abs(t.credits_amount), 0)

      return {
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        usage: dayUsage
      }
    })
  }

  const getCreditStatus = () => {
    if (!userCredits) return { color: 'bg-gray-500', text: 'Carregando...', icon: RefreshCw }
    
    if (userCredits.current_credits <= 100) {
      return { color: 'bg-red-500', text: 'Crítico', icon: AlertTriangle }
    } else if (userCredits.current_credits <= 1000) {
      return { color: 'bg-yellow-500', text: 'Baixo', icon: AlertTriangle }
    } else if (userCredits.current_credits <= 5000) {
      return { color: 'bg-blue-500', text: 'Normal', icon: CheckCircle }
    } else {
      return { color: 'bg-green-500', text: 'Excelente', icon: CheckCircle }
    }
  }

  const getUsagePercentage = () => {
    if (!userCredits) return 0
    const total = userCredits.total_purchased_credits + userCredits.monthly_free_credits
    if (total === 0) return 0
    return Math.min(100, (userCredits.total_used_credits / total) * 100)
  }

  const formatTransactionType = (type: string) => {
    const types = {
      purchase: '💳 Compra',
      usage: '🤖 Uso IA',
      bonus: '🎁 Bônus',
      refund: '↩️ Reembolso',
      monthly_reset: '📅 Reset Mensal'
    }
    return types[type as keyof typeof types] || type
  }

  const creditStatus = getCreditStatus()
  const StatusIcon = creditStatus.icon

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

  // Versão compacta
  if (!showFullDashboard) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Créditos
              </div>
              <Badge className={`${creditStatus.color} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {creditStatus.text}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-blue-600">
                {userCredits?.current_credits?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500">créditos disponíveis</div>
            </div>
            
            <Button 
              className="w-full" 
              size="sm"
              onClick={() => window.location.href = '/intelligent/credits'}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Gerenciar Créditos
            </Button>
          </CardContent>
        </Card>

        <CreditsRecharge 
          userCredits={userCredits} 
          onRecharge={loadDashboardData}
          showFullDashboard={false}
        />
      </div>
    )
  }

  // Dashboard completo
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Créditos</h1>
            <p className="text-gray-600">Gerencie seus créditos e acompanhe o uso de IA</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Créditos Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userCredits?.current_credits?.toLocaleString() || '0'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${creditStatus.color} text-white text-xs`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {creditStatus.text}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Usado Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userCredits?.total_used_credits?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {getUsagePercentage().toFixed(1)}% do total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Comprado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userCredits?.total_purchased_credits?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              + {userCredits?.monthly_free_credits?.toLocaleString() || '0'} grátis
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Economizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {((userCredits?.total_used_credits || 0) * 0.0375 * 5).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              vs comprar direto na OpenAI
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="usage">Uso por Serviço</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="recharge">Recarregar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Uso ao Longo do Tempo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Uso nos Últimos 30 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getUsageOverTime()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Uso por Serviço */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Uso por Serviço IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getUsageByService()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getUsageByService().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][index % 5]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Barra de Progresso Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Progresso Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uso de Créditos</span>
                  <span className="text-sm text-gray-500">
                    {userCredits?.total_used_credits?.toLocaleString() || 0} / {((userCredits?.total_purchased_credits || 0) + (userCredits?.monthly_free_credits || 0)).toLocaleString()}
                  </span>
                </div>
                <Progress value={getUsagePercentage()} className="h-3" />
                <div className="text-xs text-gray-500 text-center">
                  {getUsagePercentage().toFixed(1)}% dos créditos utilizados este mês
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getUsageByService().map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full`} style={{
                        backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][index % 5]
                      }} />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{service.value.toLocaleString()} créditos</div>
                      <div className="text-sm text-gray-500">
                        {((service.value / (userCredits?.total_used_credits || 1)) * 100).toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 20).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {formatTransactionType(transaction.transaction_type).split(' ')[0]}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.credits_amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount.toLocaleString()}
                      </div>
                      {transaction.cost_usd > 0 && (
                        <div className="text-sm text-gray-500">
                          ${transaction.cost_usd.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recharge">
          <CreditsRecharge 
            userCredits={userCredits} 
            onRecharge={loadDashboardData}
            showFullDashboard={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}