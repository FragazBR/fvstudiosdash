'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Sidebar from './sidebar'
import Topbar from './Shared/Topbar'
import { Toaster } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  PieChart,
  BarChart3,
  FileText,
  Settings,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react'
import { type ClientContract, type AgencyMetrics, type AgencyPlanning, type ClientProfitability, type ClientGrowthMetrics, type AgencyGrowthMetrics } from '@/types/workflow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock data para demonstração
const mockContracts: ClientContract[] = [
  {
    id: '1',
    clientId: 'client-1',
    clientName: 'Nike Brasil',
    contractType: 'monthly',
    monthlyValue: 25000,
    totalContractValue: 300000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    contractDuration: 12,
    remainingMonths: 8,
    status: 'active',
    paymentStatus: 'up_to_date',
    services: ['Social Media', 'Google Ads', 'Creative'],
    performanceMetrics: {
      roiTarget: 400,
      currentRoi: 380,
      conversionTarget: 3.5,
      currentConversion: 4.1
    },
    billingHistory: [
      {
        id: '1',
        date: new Date('2024-01-01'),
        amount: 25000,
        status: 'paid',
        invoiceNumber: 'INV-2024-001',
        dueDate: new Date('2024-01-15'),
        paymentMethod: 'Bank Transfer'
      }
    ],
    nextBillingDate: new Date('2024-08-01'),
    autoRenewal: true
  },
  {
    id: '2',
    clientId: 'client-2',
    clientName: 'Adidas Sport',
    contractType: 'retainer',
    monthlyValue: 18000,
    totalContractValue: 216000,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    contractDuration: 12,
    remainingMonths: 9,
    status: 'active',
    paymentStatus: 'pending',
    services: ['Meta Ads', 'TikTok Ads', 'Analytics'],
    billingHistory: [],
    nextBillingDate: new Date('2024-08-01'),
    autoRenewal: false
  },
  {
    id: '3',
    clientId: 'client-3',
    clientName: 'Local Store',
    contractType: 'project',
    monthlyValue: 5000,
    totalContractValue: 5000,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-07-31'),
    contractDuration: 1,
    remainingMonths: 0,
    status: 'expired',
    paymentStatus: 'overdue',
    services: ['Website', 'SEO'],
    billingHistory: [],
    nextBillingDate: new Date('2024-07-15'),
    autoRenewal: false
  }
]

const mockAgencyMetrics: AgencyMetrics = {
  financial: {
    monthlyRevenue: 148000,
    yearlyRevenue: 1200000,
    recurringRevenue: 135000,
    averageContractValue: 180000,
    churnRate: 8.5,
    growthRate: 12.3,
    profitMargin: 32.5,
    totalOutstanding: 23000
  },
  clients: {
    totalActive: 18,
    newThisMonth: 3,
    churnedThisMonth: 1,
    averageLifetime: 14,
    satisfactionScore: 8.7,
    contractsExpiring: 4
  },
  performance: {
    projectsCompleted: 124,
    averageProjectDuration: 45,
    teamUtilization: 87.5,
    clientRetentionRate: 91.5,
    onTimeDelivery: 94.2,
    budgetAccuracy: 96.8
  },
  forecast: {
    nextMonthRevenue: 156000,
    quarterProjection: 450000,
    yearProjection: 1800000,
    renewalsPipeline: 780000,
    riskAmount: 45000
  }
}

const mockProfitability: ClientProfitability[] = [
  {
    clientId: '1',
    clientName: 'Nike Brasil',
    monthlyRevenue: 25000,
    resourceCost: 12000,
    operationalCost: 3000,
    grossProfit: 10000,
    grossMargin: 40,
    lifetimeValue: 300000,
    acquisitionCost: 5000,
    profitabilityScore: 8,
    riskLevel: 'low',
    recommendations: ['Manter relacionamento', 'Propor expansão de serviços']
  },
  {
    clientId: '2',
    clientName: 'Adidas Sport',
    monthlyRevenue: 18000,
    resourceCost: 9000,
    operationalCost: 2500,
    grossProfit: 6500,
    grossMargin: 36,
    lifetimeValue: 216000,
    acquisitionCost: 3000,
    profitabilityScore: 7,
    riskLevel: 'medium',
    recommendations: ['Otimizar processos', 'Revisar precificação']
  },
  {
    clientId: '3',
    clientName: 'Local Store',
    monthlyRevenue: 5000,
    resourceCost: 4000,
    operationalCost: 800,
    grossProfit: 200,
    grossMargin: 4,
    lifetimeValue: 5000,
    acquisitionCost: 1000,
    profitabilityScore: 3,
    riskLevel: 'high',
    recommendations: ['Revisar estratégia', 'Considerar descontinuar']
  }
]

// Mock data para crescimento dos clientes
const mockClientGrowth: ClientGrowthMetrics[] = [
  {
    clientName: 'Nike Brasil',
    contractStartDate: new Date('2024-01-01'),
    contractDuration: 12,
    initialMetrics: {
      revenue: 1200000, // R$ 1.2M/mês
      employees: 150,
      marketShare: 18.5,
      brandAwareness: 65,
      digitalPresence: 72,
      conversionRate: 2.8,
      customerSatisfaction: 78,
      websiteTraffic: 85000,
      socialFollowers: 450000
    },
    currentMetrics: {
      revenue: 1680000, // R$ 1.68M/mês (+40%)
      employees: 180,
      marketShare: 22.3,
      brandAwareness: 82,
      digitalPresence: 91,
      conversionRate: 4.1,
      customerSatisfaction: 89,
      websiteTraffic: 145000,
      socialFollowers: 680000
    },
    growthPercentages: {
      revenue: 40.0,
      employees: 20.0,
      marketShare: 20.5,
      brandAwareness: 26.2,
      digitalPresence: 26.4,
      conversionRate: 46.4,
      customerSatisfaction: 14.1,
      websiteTraffic: 70.6,
      socialFollowers: 51.1
    },
    overallGrowthScore: 95,
    growthTrend: 'accelerating',
    keyAchievements: [
      'Aumento de 40% na receita',
      'Liderança em presença digital no setor',
      'Conversão 46% acima da meta',
      '230K novos seguidores nas redes sociais'
    ],
    challengesFaced: [
      'Concorrência acirrada no Q2',
      'Mudança no algoritmo das redes sociais',
      'Sazonalidade no setor esportivo'
    ],
    nextQuarterGoals: [
      'Expandir para novos mercados regionais',
      'Lançar linha de produtos sustentáveis',
      'Atingir 800K seguidores'
    ],
    agencyContribution: {
      services: ['Social Media', 'Google Ads', 'Creative', 'Strategy'],
      impactScore: 88,
      roiGenerated: 380,
      campaignsDelivered: 24,
      successRate: 91.7
    },
    monthlyProgress: [
      { month: '2024-01', revenue: 1200000, digitalPresence: 72, conversionRate: 2.8, customerSatisfaction: 78, websiteTraffic: 85000, socialFollowers: 450000, campaignsActive: 3, growthRate: 0 },
      { month: '2024-02', revenue: 1260000, digitalPresence: 75, conversionRate: 3.1, customerSatisfaction: 80, websiteTraffic: 92000, socialFollowers: 485000, campaignsActive: 4, growthRate: 5.0 },
      { month: '2024-03', revenue: 1350000, digitalPresence: 78, conversionRate: 3.4, customerSatisfaction: 82, websiteTraffic: 105000, socialFollowers: 520000, campaignsActive: 5, growthRate: 7.1 },
      { month: '2024-04', revenue: 1420000, digitalPresence: 83, conversionRate: 3.7, customerSatisfaction: 85, websiteTraffic: 118000, socialFollowers: 560000, campaignsActive: 4, growthRate: 5.2 },
      { month: '2024-05', revenue: 1520000, digitalPresence: 87, conversionRate: 3.9, customerSatisfaction: 87, websiteTraffic: 132000, socialFollowers: 610000, campaignsActive: 6, growthRate: 7.0 },
      { month: '2024-06', revenue: 1600000, digitalPresence: 89, conversionRate: 4.0, customerSatisfaction: 88, websiteTraffic: 140000, socialFollowers: 650000, campaignsActive: 5, growthRate: 5.3 },
      { month: '2024-07', revenue: 1680000, digitalPresence: 91, conversionRate: 4.1, customerSatisfaction: 89, websiteTraffic: 145000, socialFollowers: 680000, campaignsActive: 4, growthRate: 5.0 }
    ]
  },
  {
    clientName: 'Adidas Sport',
    contractStartDate: new Date('2024-02-15'),
    contractDuration: 10,
    initialMetrics: {
      revenue: 850000,
      employees: 95,
      marketShare: 12.3,
      brandAwareness: 58,
      digitalPresence: 65,
      conversionRate: 2.4,
      customerSatisfaction: 74,
      websiteTraffic: 62000,
      socialFollowers: 320000
    },
    currentMetrics: {
      revenue: 1050000,
      employees: 105,
      marketShare: 15.1,
      brandAwareness: 71,
      digitalPresence: 84,
      conversionRate: 3.2,
      customerSatisfaction: 83,
      websiteTraffic: 89000,
      socialFollowers: 420000
    },
    growthPercentages: {
      revenue: 23.5,
      employees: 10.5,
      marketShare: 22.8,
      brandAwareness: 22.4,
      digitalPresence: 29.2,
      conversionRate: 33.3,
      customerSatisfaction: 12.2,
      websiteTraffic: 43.5,
      socialFollowers: 31.3
    },
    overallGrowthScore: 78,
    growthTrend: 'steady',
    keyAchievements: [
      'Crescimento consistente de 23.5% na receita',
      'Melhoria significativa na presença digital',
      'Aumento de 33% na taxa de conversão'
    ],
    challengesFaced: [
      'Competição intensa com Nike',
      'Budget limitado para campanhas premium',
      'Dificuldade em algumas regiões'
    ],
    nextQuarterGoals: [
      'Alcançar 500K seguidores',
      'Melhorar satisfação do cliente para 85%',
      'Expandir presença no e-commerce'
    ],
    agencyContribution: {
      services: ['Social Media', 'SEO', 'Content'],
      impactScore: 75,
      roiGenerated: 285,
      campaignsDelivered: 18,
      successRate: 83.3
    },
    monthlyProgress: [
      { month: '2024-02', revenue: 850000, digitalPresence: 65, conversionRate: 2.4, customerSatisfaction: 74, websiteTraffic: 62000, socialFollowers: 320000, campaignsActive: 2, growthRate: 0 },
      { month: '2024-03', revenue: 890000, digitalPresence: 68, conversionRate: 2.6, customerSatisfaction: 76, websiteTraffic: 67000, socialFollowers: 340000, campaignsActive: 3, growthRate: 4.7 },
      { month: '2024-04', revenue: 920000, digitalPresence: 72, conversionRate: 2.8, customerSatisfaction: 78, websiteTraffic: 72000, socialFollowers: 365000, campaignsActive: 3, growthRate: 3.4 },
      { month: '2024-05', revenue: 975000, digitalPresence: 76, conversionRate: 2.9, customerSatisfaction: 80, websiteTraffic: 78000, socialFollowers: 385000, campaignsActive: 4, growthRate: 6.0 },
      { month: '2024-06', revenue: 1015000, digitalPresence: 80, conversionRate: 3.1, customerSatisfaction: 82, websiteTraffic: 84000, socialFollowers: 400000, campaignsActive: 3, growthRate: 4.1 },
      { month: '2024-07', revenue: 1050000, digitalPresence: 84, conversionRate: 3.2, customerSatisfaction: 83, websiteTraffic: 89000, socialFollowers: 420000, campaignsActive: 3, growthRate: 3.4 }
    ]
  }
]

// Mock data para crescimento da própria agência
const mockAgencyGrowth: AgencyGrowthMetrics = {
  period: '2024',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-07-31'),
  initialMetrics: {
    monthlyRevenue: 85000,      // R$ 85K/mês em Jan
    totalClients: 8,            // 8 clientes
    activeContracts: 10,        // 10 contratos ativos
    teamSize: 12,               // 12 funcionários
    averageContractValue: 10625, // valor médio por contrato
    clientRetentionRate: 75.0,  // 75% retenção
    profitMargin: 22.5,         // 22.5% margem
    operationalCosts: 66000,    // R$ 66K custos
  },
  currentMetrics: {
    monthlyRevenue: 148000,     // R$ 148K/mês em Jul (+74.1%)
    totalClients: 18,           // 18 clientes (+125%)
    activeContracts: 22,        // 22 contratos (+120%)
    teamSize: 24,               // 24 funcionários (+100%)
    averageContractValue: 6727, // valor médio (-36.7%)
    clientRetentionRate: 91.5,  // 91.5% retenção (+22%)
    profitMargin: 32.5,         // 32.5% margem (+44.4%)
    operationalCosts: 98000,    // R$ 98K custos (+48.5%)
  },
  growthPercentages: {
    monthlyRevenue: 74.1,
    totalClients: 125.0,
    activeContracts: 120.0,
    teamSize: 100.0,
    averageContractValue: -36.7,
    clientRetentionRate: 22.0,
    profitMargin: 44.4,
    operationalCosts: 48.5,
  },
  overallGrowthScore: 88,
  growthTrend: 'accelerating',
  keyMilestones: [
    'Duplicamos o tamanho da equipe',
    'Crescimento de 74% na receita mensal',
    '125% de aumento na base de clientes',
    'Melhoria de 22% na retenção de clientes',
    'Margem de lucro aumentou para 32.5%',
    'Expandimos para 3 novos segmentos de mercado'
  ],
  challengesOvercome: [
    'Contratação e treinamento de 12 novos funcionários',
    'Estruturação de processos para maior escala',
    'Implementação de ferramentas de gestão',
    'Padronização de metodologias de entrega',
    'Criação de departamentos especializados'
  ],
  strategicGoals: [
    'Atingir 25 clientes até o final do ano',
    'Aumentar receita mensal para R$ 200K',
    'Manter taxa de retenção acima de 90%',
    'Expandir equipe para 30 funcionários',
    'Lançar novos serviços de IA e automação',
    'Abrir filial em São Paulo'
  ],
  quarterlyProgress: [
    { 
      quarter: '2024-Q1', 
      revenue: 85000, 
      clients: 8, 
      contracts: 10, 
      teamSize: 12, 
      profitMargin: 22.5, 
      retentionRate: 75.0,
      newClientsAcquired: 2,
      contractsRenewed: 6,
      averageContractValue: 10625,
      growthRate: 0 
    },
    { 
      quarter: '2024-Q2', 
      revenue: 112000, 
      clients: 13, 
      contracts: 16, 
      teamSize: 18, 
      profitMargin: 28.2, 
      retentionRate: 84.6,
      newClientsAcquired: 5,
      contractsRenewed: 8,
      averageContractValue: 8615,
      growthRate: 31.8 
    },
    { 
      quarter: '2024-Q3', 
      revenue: 148000, 
      clients: 18, 
      contracts: 22, 
      teamSize: 24, 
      profitMargin: 32.5, 
      retentionRate: 91.5,
      newClientsAcquired: 7,
      contractsRenewed: 12,
      averageContractValue: 6727,
      growthRate: 32.1 
    }
  ]
}

export function AgencyManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedContract, setSelectedContract] = useState<ClientContract | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredContracts = mockContracts.filter(contract => {
    const matchesSearch = contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.services.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'pending_renewal': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'up_to_date': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTrend = (value: number) => {
    if (value > 0) return { icon: ArrowUp, color: 'text-green-500', text: '+' + value + '%' }
    if (value < 0) return { icon: ArrowDown, color: 'text-red-500', text: value + '%' }
    return { icon: Minus, color: 'text-gray-500', text: '0%' }
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col pt-16">
        <Topbar
          name="Gestão da Agência"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#64f481]/20 rounded-lg">
                <Building2 className="h-8 w-8 text-[#64f481]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agency Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Controle financeiro, contratos e performance interna da agência
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
              <Button className="bg-[#64f481] hover:bg-[#50d66f] text-black">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="financial">Controle Financeiro</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
          <TabsTrigger value="client-growth">Cliente</TabsTrigger>
          <TabsTrigger value="agency-growth">Agência</TabsTrigger>
          <TabsTrigger value="forecast">Previsões</TabsTrigger>
          <TabsTrigger value="planning">Planejamento</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receita Mensal</p>
                    <p className="text-2xl font-semibold">{formatCurrency(mockAgencyMetrics.financial.monthlyRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+{mockAgencyMetrics.financial.growthRate}%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">MRR (Receita Recorrente)</p>
                    <p className="text-2xl font-semibold">{formatCurrency(mockAgencyMetrics.financial.recurringRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+8.4%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Margem de Lucro</p>
                    <p className="text-2xl font-semibold">{mockAgencyMetrics.financial.profitMargin}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+2.1%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Ativos</p>
                    <p className="text-2xl font-semibold">{mockAgencyMetrics.clients.totalActive}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Plus className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+{mockAgencyMetrics.clients.newThisMonth} este mês</span>
                    </div>
                  </div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Operacional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Entrega no Prazo</span>
                    <span>{mockAgencyMetrics.performance.onTimeDelivery}%</span>
                  </div>
                  <Progress value={mockAgencyMetrics.performance.onTimeDelivery} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilização da Equipe</span>
                    <span>{mockAgencyMetrics.performance.teamUtilization}%</span>
                  </div>
                  <Progress value={mockAgencyMetrics.performance.teamUtilization} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Precisão de Orçamento</span>
                    <span>{mockAgencyMetrics.performance.budgetAccuracy}%</span>
                  </div>
                  <Progress value={mockAgencyMetrics.performance.budgetAccuracy} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Alertas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">4 contratos expiram em 30 dias</p>
                    <p className="text-xs text-gray-600">Renovações pendentes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(mockAgencyMetrics.financial.totalOutstanding)} em atraso</p>
                    <p className="text-xs text-gray-600">Cobranças pendentes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Taxa de retenção: 91.5%</p>
                    <p className="text-xs text-gray-600">Acima da meta de 90%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Projeções
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Próximo Mês</p>
                  <p className="text-lg font-semibold">{formatCurrency(mockAgencyMetrics.forecast.nextMonthRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trimestre</p>
                  <p className="text-lg font-semibold">{formatCurrency(mockAgencyMetrics.forecast.quarterProjection)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pipeline de Renovações</p>
                  <p className="text-lg font-semibold">{formatCurrency(mockAgencyMetrics.forecast.renewalsPipeline)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Buscar contratos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="pending_renewal">Renovação Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contracts List */}
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => setSelectedContract(contract)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{contract.clientName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contract.services.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Valor Mensal</p>
                        <p className="font-semibold text-lg">{formatCurrency(contract.monthlyValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Restam</p>
                        <p className="font-semibold text-lg">{contract.remainingMonths} meses</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                        <Badge className={getPaymentStatusColor(contract.paymentStatus)}>
                          {contract.paymentStatus}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Início</p>
                        <p>{contract.startDate.toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Fim</p>
                        <p>{contract.endDate.toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Próxima Cobrança</p>
                        <p>{contract.nextBillingDate.toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Auto-renovação</p>
                        <p>{contract.autoRenewal ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Financial Control Tab */}
        <TabsContent value="financial" className="space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entradas Este Mês</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ 148.000</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+12.3%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saídas Este Mês</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ 98.000</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">+8.5%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ 50.000</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-blue-600">+18.2%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Margem Líquida</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">33.8%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-purple-600">+4.1%</span>
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Income */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-green-500" />
                  Entradas Recentes
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Entrada
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Building2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Nike Brasil - Mensalidade</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">25 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+ R$ 25.000</p>
                      <p className="text-xs text-gray-500">Recebido</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Building2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Adidas Sport - Monthly</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">24 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+ R$ 18.000</p>
                      <p className="text-xs text-gray-500">Recebido</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Local Store - Projeto</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">15 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-600">R$ 5.000</p>
                      <p className="text-xs text-gray-500">Pendente</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Building2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Tech Startup - Setup</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">20 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+ R$ 12.500</p>
                      <p className="text-xs text-gray-500">Recebido</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-red-500" />
                  Saídas Recentes
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Saída
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Users className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Folha de Pagamento</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">25 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">- R$ 45.000</p>
                      <p className="text-xs text-gray-500">Pago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Building2 className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Aluguel Escritório</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">20 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">- R$ 8.500</p>
                      <p className="text-xs text-gray-500">Pago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Settings className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Softwares e Ferramentas</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">18 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">- R$ 3.200</p>
                      <p className="text-xs text-gray-500">Pago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Target className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Facebook Ads - Cliente</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">15 Jul 2024</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">- R$ 15.000</p>
                      <p className="text-xs text-gray-500">Pago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income Categories */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Categorias de Entrada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Contratos Mensais</span>
                    <span className="font-medium text-green-600">R$ 110.000</span>
                  </div>
                  <Progress value={74} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Projetos Únicos</span>
                    <span className="font-medium text-green-600">R$ 25.000</span>
                  </div>
                  <Progress value={17} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Consultoria</span>
                    <span className="font-medium text-green-600">R$ 13.000</span>
                  </div>
                  <Progress value={9} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Categorias de Saída
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pessoal</span>
                    <span className="font-medium text-red-600">R$ 45.000</span>
                  </div>
                  <Progress value={46} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Marketing/Ads</span>
                    <span className="font-medium text-red-600">R$ 25.000</span>
                  </div>
                  <Progress value={26} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operacional</span>
                    <span className="font-medium text-red-600">R$ 15.500</span>
                  </div>
                  <Progress value={16} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ferramentas</span>
                    <span className="font-medium text-red-600">R$ 12.500</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Prediction */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Fluxo de Caixa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Atual</p>
                  <p className="text-2xl font-bold text-blue-600">R$ 85.300</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Próximos 30 dias</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Entradas previstas</span>
                      <span className="text-green-600">+ R$ 125.000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Saídas previstas</span>
                      <span className="text-red-600">- R$ 95.000</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Saldo projetado</span>
                        <span className="text-blue-600">R$ 115.300</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Entrada
            </Button>
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
              <Minus className="h-4 w-4 mr-2" />
              Registrar Saída
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Ver Extrato Completo
            </Button>
          </div>
        </TabsContent>

        {/* Profitability Tab */}
        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {mockProfitability.map((client) => (
              <Card key={client.clientId} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{client.clientName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${
                          client.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                          client.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Risco {client.riskLevel}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Score: {client.profitabilityScore}/10
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Margem Bruta</p>
                      <p className="text-2xl font-semibold text-green-600">{client.grossMargin}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receita Mensal</p>
                      <p className="font-semibold">{formatCurrency(client.monthlyRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Custo Recursos</p>
                      <p className="font-semibold">{formatCurrency(client.resourceCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Custo Operacional</p>
                      <p className="font-semibold">{formatCurrency(client.operationalCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Bruto</p>
                      <p className="font-semibold text-green-600">{formatCurrency(client.grossProfit)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">LTV</p>
                      <p className="font-semibold">{formatCurrency(client.lifetimeValue)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Recomendações:</p>
                    <div className="flex flex-wrap gap-2">
                      {client.recommendations.map((rec, index) => (
                        <Badge key={index} variant="outline">
                          {rec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Client Growth Tab */}
        <TabsContent value="client-growth" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Crescimento dos Clientes</h2>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  <SelectItem value="nike">Nike Brasil</SelectItem>
                  <SelectItem value="adidas">Adidas Sport</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {mockClientGrowth.map((client, index) => (
              <Card key={index} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 p-6 transition-all duration-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{client.clientName}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Contrato iniciado em {client.contractStartDate.toLocaleDateString('pt-BR')} • {client.contractDuration} meses
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          client.growthTrend === 'accelerating' ? 'default' :
                          client.growthTrend === 'steady' ? 'secondary' : 'destructive'
                        }
                      >
                        {client.growthTrend === 'accelerating' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {client.growthTrend === 'steady' && <Minus className="w-3 h-3 mr-1" />}
                        {client.growthTrend === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {client.growthTrend === 'accelerating' ? 'Acelerando' :
                         client.growthTrend === 'steady' ? 'Estável' : 
                         client.growthTrend === 'declining' ? 'Declínio' : 'Estagnado'}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {client.overallGrowthScore}/100
                    </div>
                    <p className="text-sm text-gray-500">Score Geral</p>
                  </div>
                </div>

                {/* Métricas de Crescimento */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Receita</span>
                      <span className={`text-sm font-medium ${client.growthPercentages.revenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {client.growthPercentages.revenue > 0 ? '+' : ''}{client.growthPercentages.revenue.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        R$ {(client.initialMetrics.revenue / 1000000).toFixed(1)}M → R$ {(client.currentMetrics.revenue / 1000000).toFixed(1)}M
                      </div>
                      <Progress value={Math.min(client.growthPercentages.revenue + 20, 100)} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Presença Digital</span>
                      <span className={`text-sm font-medium ${client.growthPercentages.digitalPresence > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {client.growthPercentages.digitalPresence > 0 ? '+' : ''}{client.growthPercentages.digitalPresence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        {client.initialMetrics.digitalPresence} → {client.currentMetrics.digitalPresence}
                      </div>
                      <Progress value={client.currentMetrics.digitalPresence} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Conversão</span>
                      <span className={`text-sm font-medium ${client.growthPercentages.conversionRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {client.growthPercentages.conversionRate > 0 ? '+' : ''}{client.growthPercentages.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        {client.initialMetrics.conversionRate.toFixed(1)}% → {client.currentMetrics.conversionRate.toFixed(1)}%
                      </div>
                      <Progress value={client.currentMetrics.conversionRate * 20} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Seguidores</span>
                      <span className={`text-sm font-medium ${client.growthPercentages.socialFollowers > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {client.growthPercentages.socialFollowers > 0 ? '+' : ''}{client.growthPercentages.socialFollowers.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        {(client.initialMetrics.socialFollowers / 1000).toFixed(0)}K → {(client.currentMetrics.socialFollowers / 1000).toFixed(0)}K
                      </div>
                      <Progress value={Math.min(client.growthPercentages.socialFollowers, 100)} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Contribuição da Agência */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Contribuição da Agência
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{client.agencyContribution.impactScore}</div>
                      <div className="text-xs text-gray-500">Score de Impacto</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{client.agencyContribution.roiGenerated}%</div>
                      <div className="text-xs text-gray-500">ROI Gerado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{client.agencyContribution.campaignsDelivered}</div>
                      <div className="text-xs text-gray-500">Campanhas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{client.agencyContribution.successRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">Taxa de Sucesso</div>
                    </div>
                  </div>
                </div>

                {/* Conquistas e Desafios */}
                <div className="grid md:grid-cols-2 gap-6 mt-6 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Principais Conquistas
                    </h4>
                    <ul className="space-y-1">
                      {client.keyAchievements.map((achievement, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      Próximas Metas
                    </h4>
                    <ul className="space-y-1">
                      {client.nextQuarterGoals.map((goal, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Agency Growth Tab */}
        <TabsContent value="agency-growth" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Crescimento da Agência</h2>
            <div className="flex gap-2">
              <Select defaultValue="2024">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 p-6 transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Performance da Agência - 2024</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Janeiro a Julho • 7 meses de operação
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Acelerando
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {mockAgencyGrowth.overallGrowthScore}/100
                </div>
                <p className="text-sm text-gray-500">Score Geral</p>
              </div>
            </div>

            {/* Métricas Principais da Agência */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Receita Mensal</span>
                  <span className="text-sm font-medium text-green-600">
                    +{mockAgencyGrowth.growthPercentages.monthlyRevenue.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    R$ {(mockAgencyGrowth.initialMetrics.monthlyRevenue / 1000).toFixed(0)}K → R$ {(mockAgencyGrowth.currentMetrics.monthlyRevenue / 1000).toFixed(0)}K
                  </div>
                  <Progress value={Math.min(mockAgencyGrowth.growthPercentages.monthlyRevenue, 100)} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total de Clientes</span>
                  <span className="text-sm font-medium text-green-600">
                    +{mockAgencyGrowth.growthPercentages.totalClients.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    {mockAgencyGrowth.initialMetrics.totalClients} → {mockAgencyGrowth.currentMetrics.totalClients} clientes
                  </div>
                  <Progress value={Math.min(mockAgencyGrowth.growthPercentages.totalClients, 100)} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tamanho da Equipe</span>
                  <span className="text-sm font-medium text-green-600">
                    +{mockAgencyGrowth.growthPercentages.teamSize.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    {mockAgencyGrowth.initialMetrics.teamSize} → {mockAgencyGrowth.currentMetrics.teamSize} pessoas
                  </div>
                  <Progress value={mockAgencyGrowth.growthPercentages.teamSize} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Margem de Lucro</span>
                  <span className="text-sm font-medium text-green-600">
                    +{mockAgencyGrowth.growthPercentages.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    {mockAgencyGrowth.initialMetrics.profitMargin.toFixed(1)}% → {mockAgencyGrowth.currentMetrics.profitMargin.toFixed(1)}%
                  </div>
                  <Progress value={mockAgencyGrowth.currentMetrics.profitMargin} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Contratos Ativos</span>
                  <span className="text-sm font-medium text-green-600">
                    +{mockAgencyGrowth.growthPercentages.activeContracts.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    {mockAgencyGrowth.initialMetrics.activeContracts} → {mockAgencyGrowth.currentMetrics.activeContracts} contratos
                  </div>
                  <Progress value={Math.min(mockAgencyGrowth.growthPercentages.activeContracts, 100)} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Retenção</span>
                  <span className="text-sm font-medium text-green-600">
                    +{mockAgencyGrowth.growthPercentages.clientRetentionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    {mockAgencyGrowth.initialMetrics.clientRetentionRate.toFixed(1)}% → {mockAgencyGrowth.currentMetrics.clientRetentionRate.toFixed(1)}%
                  </div>
                  <Progress value={mockAgencyGrowth.currentMetrics.clientRetentionRate} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Valor Médio Contrato</span>
                  <span className="text-sm font-medium text-red-600">
                    {mockAgencyGrowth.growthPercentages.averageContractValue.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    R$ {(mockAgencyGrowth.initialMetrics.averageContractValue / 1000).toFixed(1)}K → R$ {(mockAgencyGrowth.currentMetrics.averageContractValue / 1000).toFixed(1)}K
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="text-xs text-blue-600">Estratégia: Mais clientes, valores menores</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Custos Operacionais</span>
                  <span className="text-sm font-medium text-orange-600">
                    +{mockAgencyGrowth.growthPercentages.operationalCosts.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    R$ {(mockAgencyGrowth.initialMetrics.operationalCosts / 1000).toFixed(0)}K → R$ {(mockAgencyGrowth.currentMetrics.operationalCosts / 1000).toFixed(0)}K
                  </div>
                  <Progress value={mockAgencyGrowth.growthPercentages.operationalCosts} className="h-2" />
                  <div className="text-xs text-green-600">Controlado: Crescimento menor que receita</div>
                </div>
              </div>
            </div>

            {/* Progresso Trimestral */}
            <div className="border-t pt-4 mb-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Evolução Trimestral
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockAgencyGrowth.quarterlyProgress.map((quarter, index) => (
                  <Card key={index} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 p-4 transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{quarter.quarter}</h5>
                      <Badge variant={index === 0 ? 'secondary' : index === 1 ? 'default' : 'outline'}>
                        {quarter.growthRate > 0 ? '+' : ''}{quarter.growthRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500">Receita</div>
                        <div className="font-medium">R$ {(quarter.revenue / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Clientes</div>
                        <div className="font-medium">{quarter.clients}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Equipe</div>
                        <div className="font-medium">{quarter.teamSize}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Margem</div>
                        <div className="font-medium">{quarter.profitMargin.toFixed(1)}%</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500">Novos Clientes</div>
                        <div className="font-medium text-green-600">+{quarter.newClientsAcquired}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Conquistas e Metas */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Principais Conquistas
                </h4>
                <ul className="space-y-1">
                  {mockAgencyGrowth.keyMilestones.map((milestone, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {milestone}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                  <Target className="w-4 h-4" />
                  Metas Estratégicas 2024
                </h4>
                <ul className="space-y-1">
                  {mockAgencyGrowth.strategicGoals.map((goal, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle>Projeção de Receita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Próximo Mês</span>
                    <span className="font-semibold">{formatCurrency(mockAgencyMetrics.forecast.nextMonthRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trimestre</span>
                    <span className="font-semibold">{formatCurrency(mockAgencyMetrics.forecast.quarterProjection)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ano</span>
                    <span className="font-semibold">{formatCurrency(mockAgencyMetrics.forecast.yearProjection)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle>Pipeline de Renovações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Contratos para Renovar</span>
                    <span className="font-semibold">{mockAgencyMetrics.clients.contractsExpiring}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Valor em Pipeline</span>
                    <span className="font-semibold">{formatCurrency(mockAgencyMetrics.forecast.renewalsPipeline)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Valor em Risco</span>
                    <span className="font-semibold text-red-600">{formatCurrency(mockAgencyMetrics.forecast.riskAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Planning Tab */}
        <TabsContent value="planning" className="space-y-6">
          <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
            <CardHeader>
              <CardTitle>Planejamento Estratégico</CardTitle>
              <CardDescription>
                Defina metas e iniciativas para o crescimento da agência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Funcionalidade em desenvolvimento - Sistema de planejamento estratégico completo
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <ContractDetailModal 
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
        </div>
      </div>
      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

function ContractDetailModal({ contract, onClose }: { contract: ClientContract; onClose: () => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{contract.clientName}</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="space-y-6">
          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de Contrato</p>
              <p className="font-medium">{contract.contractType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Mensal</p>
              <p className="font-medium">{formatCurrency(contract.monthlyValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="font-medium">{formatCurrency(contract.totalContractValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Meses Restantes</p>
              <p className="font-medium">{contract.remainingMonths}</p>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Serviços</p>
            <div className="flex flex-wrap gap-2">
              {contract.services.map((service) => (
                <Badge key={service} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          {contract.performanceMetrics && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Métricas de Performance</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">ROI Atual vs Meta</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contract.performanceMetrics.currentRoi}%</span>
                    <span className="text-gray-500">/ {contract.performanceMetrics.roiTarget}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm">Conversão Atual vs Meta</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contract.performanceMetrics.currentConversion}%</span>
                    <span className="text-gray-500">/ {contract.performanceMetrics.conversionTarget}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button className="flex-1">
              Editar Contrato
            </Button>
            <Button variant="outline" className="flex-1">
              Gerar Fatura
            </Button>
            <Button variant="outline">
              Renovar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
