'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Plus,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  LineChart,
  CreditCard,
  Wallet,
  Building2,
  User,
  ShoppingBag,
  Car,
  Home as HomeIcon,
  Coffee,
  Zap,
  Smartphone,
  Edit,
  Trash2,
  Eye,
  Bell,
  Calendar as CalendarIcon,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

// Mock data for demonstration
const mockTransactions = [
  {
    id: 1,
    type: 'income',
    category: 'cliente',
    title: 'Pagamento Cliente - Campanha Verão',
    amount: 12500.00,
    date: '2024-01-15',
    status: 'paid',
    recurring: false,
    description: 'Pagamento referente à campanha de verão para Loja ABC'
  },
  {
    id: 2,
    type: 'expense',
    category: 'escritorio',
    title: 'Aluguel Escritório',
    amount: 3200.00,
    date: '2024-01-10',
    status: 'paid',
    recurring: true,
    description: 'Aluguel mensal do escritório'
  },
  {
    id: 3,
    type: 'expense',
    category: 'marketing',
    title: 'Anúncios Facebook',
    amount: 850.00,
    date: '2024-01-12',
    status: 'pending',
    recurring: false,
    description: 'Investimento em anúncios para cliente XYZ'
  },
  {
    id: 4,
    type: 'income',
    category: 'cliente',
    title: 'Contrato Mensal - Empresa XYZ',
    amount: 8900.00,
    date: '2024-01-05',
    status: 'paid',
    recurring: true,
    description: 'Mensalidade do contrato de gestão de redes sociais'
  },
  {
    id: 5,
    type: 'expense',
    category: 'equipe',
    title: 'Salários Equipe',
    amount: 15600.00,
    date: '2024-01-01',
    status: 'paid',
    recurring: true,
    description: 'Pagamento de salários da equipe'
  }
]

const categories = {
  income: [
    { id: 'cliente', name: 'Clientes', icon: User, color: 'bg-green-500' },
    { id: 'servicos', name: 'Serviços', icon: Building2, color: 'bg-blue-500' },
    { id: 'outros', name: 'Outros', icon: DollarSign, color: 'bg-purple-500' }
  ],
  expense: [
    { id: 'escritorio', name: 'Escritório', icon: HomeIcon, color: 'bg-red-500' },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp, color: 'bg-orange-500' },
    { id: 'equipe', name: 'Equipe', icon: User, color: 'bg-indigo-500' },
    { id: 'tecnologia', name: 'Tecnologia', icon: Smartphone, color: 'bg-cyan-500' },
    { id: 'transporte', name: 'Transporte', icon: Car, color: 'bg-yellow-500' },
    { id: 'alimentacao', name: 'Alimentação', icon: Coffee, color: 'bg-pink-500' },
    { id: 'utilitarios', name: 'Utilitários', icon: Zap, color: 'bg-gray-500' },
    { id: 'outros', name: 'Outros', icon: ShoppingBag, color: 'bg-teal-500' }
  ]
}

interface Transaction {
  id: number
  type: 'income' | 'expense'
  category: string
  title: string
  amount: number
  date: string
  status: 'paid' | 'pending' | 'overdue'
  recurring: boolean
  description: string
}

export function FinancialControlPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(mockTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'list' | 'chart'>('list')

  // Estados para dados de contratos
  const [contracts, setContracts] = useState([])
  const [contractStats, setContractStats] = useState({
    totalRevenue: 0,
    monthlyRecurring: 0,
    averageContractValue: 0,
    activeContracts: 0
  })

  const router = useRouter()
  const { user, loading } = useUser()
  const supabase = supabaseBrowser()

  // Carregar dados de contratos
  useEffect(() => {
    if (!loading && user) {
      loadContracts()
    }
  }, [user, loading])

  const loadContracts = async () => {
    try {
      const { data: contracts, error } = await supabase
        .from('clients')
        .select('*')
        .not('contract_value', 'is', null)
        .eq('status', 'active')

      if (error) {
        console.error('Erro ao carregar contratos:', error)
        return
      }

      setContracts(contracts || [])
      calculateContractStats(contracts || [])
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
    }
  }

  const calculateContractStats = (contracts) => {
    const totalRevenue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0)
    const monthlyRecurring = contracts
      .filter(c => c.payment_frequency === 'monthly')
      .reduce((sum, c) => sum + (c.contract_value || 0), 0)
    
    setContractStats({
      totalRevenue,
      monthlyRecurring,
      averageContractValue: contracts.length > 0 ? totalRevenue / contracts.length : 0,
      activeContracts: contracts.length
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Calculate KPIs
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
  })

  const totalIncome = monthlyTransactions.reduce((sum, t) => t.type === 'income' && t.status === 'paid' ? sum + t.amount : sum, 0)
  const totalExpenses = monthlyTransactions.reduce((sum, t) => t.type === 'expense' && t.status === 'paid' ? sum + t.amount : sum, 0)
  const currentBalance = totalIncome - totalExpenses
  const monthlyVariation = 15.2 // Mock data for demonstration

  // Filter and sort transactions
  useEffect(() => {
    let filtered = [...transactions]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory)
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, filterType, filterCategory, filterStatus, sortBy, sortOrder])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Pago', variant: 'default', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendente', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Vencido', variant: 'destructive', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getCategoryIcon = (type: 'income' | 'expense', categoryId: string) => {
    const categoryList = categories[type]
    const category = categoryList.find(c => c.id === categoryId)
    if (!category) return { icon: DollarSign, color: 'bg-gray-500' }
    return { icon: category.icon, color: category.color }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const exportToCSV = () => {
    const headers = ['Tipo', 'Categoria', 'Título', 'Valor', 'Data', 'Status', 'Recorrente', 'Descrição']
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.type === 'income' ? 'Entrada' : 'Saída',
        categories[t.type].find(c => c.id === t.category)?.name || t.category,
        `"${t.title}"`,
        t.amount.toString().replace('.', ','),
        formatDate(t.date),
        t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : 'Vencido',
        t.recurring ? 'Sim' : 'Não',
        `"${t.description}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `financeiro_${new Date().getTime()}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Controle Financeiro"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header with Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Controle Financeiro
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gerencie suas receitas e despesas com visão completa do fluxo de caixa
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  className="hidden lg:flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Transação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Transação</DialogTitle>
                    </DialogHeader>
                    <TransactionForm 
                      onSubmit={() => setIsCreateModalOpen(false)}
                      onCancel={() => setIsCreateModalOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Seção de Contratos */}
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Receita de Contratos
                  </h2>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Visão geral da receita proveniente de contratos ativos
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/agency/contratos')}
                  className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900/20"
                >
                  Ver Contratos
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contratos Ativos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {contractStats.activeContracts}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(contractStats.totalRevenue)}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Mensal</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(contractStats.monthlyRecurring)}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Médio</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(contractStats.averageContractValue)}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Saldo Atual</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(currentBalance)}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">+{monthlyVariation}% vs mês anterior</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Receitas do Mês</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(totalIncome)}
                      </p>
                      <div className="flex items-center mt-2">
                        <ArrowUpRight className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-sm text-blue-600">+12% vs mês anterior</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Despesas do Mês</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency(totalExpenses)}
                      </p>
                      <div className="flex items-center mt-2">
                        <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                        <span className="text-sm text-red-600">-3% vs mês anterior</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Variação Mensal</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        +{monthlyVariation}%
                      </p>
                      <div className="flex items-center mt-2">
                        <BarChart3 className="h-4 w-4 text-purple-600 mr-1" />
                        <span className="text-sm text-purple-600">Crescimento consistente</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar transações..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="income">Receitas</SelectItem>
                        <SelectItem value="expense">Despesas</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Vencido</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Data</SelectItem>
                        <SelectItem value="amount">Valor</SelectItem>
                        <SelectItem value="title">Título</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
              <TabsList className="grid w-full grid-cols-2 lg:w-80">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="chart" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Gráficos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-6">
                {/* Transactions List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Transações Recentes</span>
                      <Badge variant="secondary">
                        {filteredTransactions.length} transação(ões)
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Nenhuma transação encontrada
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Tente ajustar os filtros ou criar uma nova transação.
                          </p>
                        </div>
                      ) : (
                        filteredTransactions.map((transaction) => {
                          const { icon: Icon, color } = getCategoryIcon(transaction.type, transaction.category)
                          
                          return (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className={`h-10 w-10 ${color} rounded-full flex items-center justify-center`}>
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {transaction.title}
                                    </h4>
                                    {transaction.recurring && (
                                      <Badge variant="outline" className="text-xs">
                                        Recorrente
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {transaction.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {formatDate(transaction.date)}
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">
                                      {categories[transaction.type].find(c => c.id === transaction.category)?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className={`font-bold text-lg ${
                                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                  </div>
                                  {getStatusBadge(transaction.status)}
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTransaction(transaction)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTransaction(transaction)
                                      setIsEditModalOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTransaction(transaction)
                                      setIsDeleteModalOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chart" className="space-y-6">
                {/* Charts Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-blue-500" />
                        Receitas por Categoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            Gráfico de pizza será implementado com biblioteca de charts
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-red-500" />
                        Despesas por Categoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            Gráfico de pizza será implementado com biblioteca de charts
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-purple-500" />
                        Fluxo de Caixa Mensal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                          <LineChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            Gráfico de linha será implementado com biblioteca de charts
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Upcoming Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-500" />
                  Próximos Vencimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Aluguel Escritório</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Vence em 3 dias</p>
                      </div>
                    </div>
                    <span className="font-bold text-red-600">R$ 3.200,00</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Contrato Mensal - Empresa ABC</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Vence em 7 dias</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">+R$ 5.500,00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            transaction={selectedTransaction}
            onSubmit={() => setIsEditModalOpen(false)}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir a transação "{selectedTransaction?.title}"?
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(false)}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Transaction Form Component
function TransactionForm({ 
  transaction, 
  onSubmit, 
  onCancel 
}: { 
  transaction?: Transaction | null
  onSubmit: () => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    type: transaction?.type || 'income',
    category: transaction?.category || '',
    title: transaction?.title || '',
    amount: transaction?.amount || 0,
    date: transaction?.date || new Date().toISOString().split('T')[0],
    status: transaction?.status || 'pending',
    recurring: transaction?.recurring || false,
    description: transaction?.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally save to the database
    console.log('Form submitted:', formData)
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories[formData.type as 'income' | 'expense'].map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Título da transação"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
            placeholder="0,00"
            required
          />
        </div>

        <div>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descrição da transação"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="recurring"
          checked={formData.recurring}
          onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
          className="rounded border-gray-300"
        />
        <Label htmlFor="recurring">Transação recorrente</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {transaction ? 'Atualizar' : 'Criar'} Transação
        </Button>
      </div>
    </form>
  )
}