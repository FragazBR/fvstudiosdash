'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  FileText, 
  Calendar, 
  DollarSign, 
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NewClientModal } from '@/components/new-client-modal'
import { EditContractModal } from '@/components/edit-contract-modal'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Contract {
  id: string
  name: string
  email: string
  company: string
  phone?: string
  position?: string
  website?: string
  address?: string
  notes?: string
  contract_value: number
  contract_duration: number
  contract_start_date: string
  contract_end_date?: string
  payment_frequency: string
  contract_currency: string
  status: string
  created_at: string
}

export function ContractsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalValue: 0,
    monthlyRevenue: 0,
    averageContractValue: 0,
    contractsExpiring: 0
  })

  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const supabase = supabaseBrowser()

  useEffect(() => {
    if (!userLoading && user) {
      loadContracts()
    }
  }, [user, userLoading])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const { data: contracts, error } = await supabase
        .from('clients')
        .select('*')
        .not('contract_value', 'is', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar contratos:', error)
        return
      }

      setContracts(contracts || [])
      calculateStats(contracts || [])
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (contracts: Contract[]) => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const activeContracts = contracts.filter(c => c.status === 'active')
    const totalValue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0)
    const monthlyRevenue = contracts
      .filter(c => c.payment_frequency === 'monthly' && c.status === 'active')
      .reduce((sum, c) => sum + (c.contract_value || 0), 0)
    
    const contractsExpiring = contracts.filter(c => {
      if (!c.contract_end_date || c.status !== 'active') return false
      const endDate = new Date(c.contract_end_date)
      return endDate <= thirtyDaysFromNow && endDate >= now
    }).length

    setStats({
      totalContracts: contracts.length,
      activeContracts: activeContracts.length,
      totalValue,
      monthlyRevenue,
      averageContractValue: contracts.length > 0 ? totalValue / contracts.length : 0,
      contractsExpiring
    })
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    const matchesCurrency = currencyFilter === 'all' || contract.contract_currency === currencyFilter

    return matchesSearch && matchesStatus && matchesCurrency
  })

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    const symbols: { [key: string]: string } = { BRL: 'R$', USD: '$', EUR: '€' }
    return `${symbols[currency] || currency} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
      'active': 'default',
      'pending': 'secondary',
      'expired': 'destructive',
      'cancelled': 'destructive'
    }
    
    const labels: { [key: string]: string } = {
      'active': 'Ativo',
      'pending': 'Pendente',
      'expired': 'Expirado',
      'cancelled': 'Cancelado'
    }

    const icons: { [key: string]: React.ReactNode } = {
      'active': <CheckCircle className="h-3 w-3" />,
      'pending': <Clock className="h-3 w-3" />,
      'expired': <AlertTriangle className="h-3 w-3" />,
      'cancelled': <AlertTriangle className="h-3 w-3" />
    }

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    )
  }

  const getPaymentFrequencyLabel = (frequency: string) => {
    const labels: { [key: string]: string } = {
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'yearly': 'Anual',
      'one-time': 'Único'
    }
    return labels[frequency] || frequency
  }

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract)
    setIsViewModalOpen(true)
  }

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract)
    setIsEditModalOpen(true)
  }

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#121212]">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 md:ml-64">
          <Topbar setSidebarOpen={setSidebarOpen} />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando contratos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 md:ml-64">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Gestão de Contratos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerencie todos os contratos da sua agência com informações financeiras detalhadas
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => router.push('/contas')}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Contas
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalContracts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeContracts} ativos
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Média: {formatCurrency(stats.averageContractValue)}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Contratos mensais ativos
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencendo em 30 dias</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.contractsExpiring}</div>
                <p className="text-xs text-muted-foreground">
                  Requerem atenção
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, empresa ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="BRL">R$ Real</SelectItem>
                <SelectItem value="USD">$ Dólar</SelectItem>
                <SelectItem value="EUR">€ Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista/Tabela de Contratos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contratos ({filteredContracts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredContracts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {contracts.length === 0 ? 'Nenhum contrato encontrado' : 'Nenhum resultado para os filtros aplicados'}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    {contracts.length === 0 && 'Crie contratos adicionando clientes com informações financeiras'}
                  </p>
                  <Button 
                    onClick={() => router.push('/contas')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Cliente
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista em Cards para mobile */}
                  <div className="md:hidden space-y-4">
                    {filteredContracts.map((contract) => (
                      <Card key={contract.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{contract.name}</div>
                                <div className="text-sm text-gray-500">{contract.company}</div>
                                <div className="text-xs text-gray-400">{contract.email}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600">
                                  {formatCurrency(contract.contract_value, contract.contract_currency)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getPaymentFrequencyLabel(contract.payment_frequency)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(contract.status)}
                                <span className="text-xs text-gray-500">
                                  {contract.contract_duration} meses
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewContract(contract)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditContract(contract)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Tabela para desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium">Cliente</th>
                          <th className="text-left py-3 font-medium">Valor</th>
                          <th className="text-left py-3 font-medium">Duração</th>
                          <th className="text-left py-3 font-medium">Pagamento</th>
                          <th className="text-left py-3 font-medium">Status</th>
                          <th className="text-left py-3 font-medium">Vencimento</th>
                          <th className="text-right py-3 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContracts.map((contract) => (
                          <tr key={contract.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="py-4">
                              <div>
                                <div className="font-medium">{contract.name}</div>
                                <div className="text-sm text-gray-500">{contract.company}</div>
                                <div className="text-xs text-gray-400">{contract.email}</div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="font-medium text-green-600">
                                {formatCurrency(contract.contract_value, contract.contract_currency)}
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="text-sm">
                                {contract.contract_duration} meses
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="text-sm">
                                {getPaymentFrequencyLabel(contract.payment_frequency)}
                              </div>
                            </td>
                            <td className="py-4">
                              {getStatusBadge(contract.status)}
                            </td>
                            <td className="py-4">
                              <div className="text-sm">
                                {contract.contract_end_date ? format(new Date(contract.contract_end_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewContract(contract)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditContract(contract)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Criação de Contrato usando NewClientModal */}
      <NewClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClientCreated={() => {
          setIsCreateModalOpen(false)
          loadContracts()
        }}
      />

      {/* Modal de Visualização de Contrato */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Contrato
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedContract.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedContract.company || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedContract.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedContract.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-4 text-gray-900 dark:text-gray-100">💰 Informações Financeiras</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor do Contrato</label>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {formatCurrency(selectedContract.contract_value, selectedContract.contract_currency)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duração</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedContract.contract_duration} meses</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequência de Pagamento</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{getPaymentFrequencyLabel(selectedContract.payment_frequency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Início</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedContract.contract_start_date ? format(new Date(selectedContract.contract_start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Término</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedContract.contract_end_date ? format(new Date(selectedContract.contract_end_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedContract.notes && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {selectedContract.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Contrato */}
      <EditContractModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onContractUpdated={() => {
          setIsEditModalOpen(false)
          loadContracts()
        }}
        contract={selectedContract}
      />
    </div>
  )
}

