'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard, 
  Plus, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Smartphone
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PaymentIntegration {
  id: string
  platform: string
  name: string
  description?: string
  is_active: boolean
  is_primary: boolean
  test_mode: boolean
  supported_currencies: string[]
  created_at: string
  api_key_preview?: string
  total_payments?: number
  total_revenue?: number
  successful_payments?: number
  failed_payments?: number
}

interface PaymentProduct {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  category?: string
  sku?: string
  is_subscription: boolean
  billing_interval?: string
  is_active: boolean
  created_at: string
  stats?: {
    total_sales: number
    total_revenue: number
    conversion_rate: number
  }
}

interface PaymentStats {
  total_revenue: number
  total_transactions: number
  successful_rate: number
  avg_transaction_value: number
  monthly_growth: number
  top_products: Array<{
    name: string
    revenue: number
    sales: number
  }>
}

export default function PaymentIntegrationDashboard() {
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([])
  const [products, setProducts] = useState<PaymentProduct[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAgency, setSelectedAgency] = useState<string>('')

  // Estados dos diálogos
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<PaymentIntegration | null>(null)
  const [editingProduct, setEditingProduct] = useState<PaymentProduct | null>(null)

  // Estados dos formulários
  const [integrationForm, setIntegrationForm] = useState({
    platform: '',
    name: '',
    description: '',
    api_key: '',
    secret_key: '',
    webhook_secret: '',
    sandbox_mode: true,
    supported_currencies: ['BRL', 'USD']
  })

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'BRL',
    category: '',
    sku: '',
    is_subscription: false,
    billing_interval: 'month',
    trial_period_days: 0,
    image_url: '',
    product_url: ''
  })

  const platforms = [
    { value: 'stripe', label: 'Stripe', icon: '💳' },
    { value: 'paypal', label: 'PayPal', icon: '🅿️' },
    { value: 'mercado_pago', label: 'Mercado Pago', icon: '💙' },
    { value: 'pagseguro', label: 'PagSeguro', icon: '🟡' },
    { value: 'asaas', label: 'Asaas', icon: '🔵' }
  ]

  const currencies = [
    { value: 'BRL', label: 'Real (BRL)' },
    { value: 'USD', label: 'Dólar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ]

  const billingIntervals = [
    { value: 'day', label: 'Diário' },
    { value: 'week', label: 'Semanal' },
    { value: 'month', label: 'Mensal' },
    { value: 'year', label: 'Anual' }
  ]

  useEffect(() => {
    loadData()
  }, [selectedAgency])

  const loadData = async () => {
    if (!selectedAgency) return

    setLoading(true)
    try {
      await Promise.all([
        loadIntegrations(),
        loadProducts(),
        loadStats()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`/api/payments/integrations?agency_id=${selectedAgency}`)
      const data = await response.json()
      
      if (response.ok) {
        setIntegrations(data.integrations || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error)
      toast.error('Erro ao carregar integrações')
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/payments/products?agency_id=${selectedAgency}`)
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast.error('Erro ao carregar produtos')
    }
  }

  const loadStats = async () => {
    // Simular dados de estatísticas
    setStats({
      total_revenue: 45230.50,
      total_transactions: 1284,
      successful_rate: 94.2,
      avg_transaction_value: 35.24,
      monthly_growth: 12.5,
      top_products: [
        { name: 'Plano Premium', revenue: 18500, sales: 87 },
        { name: 'Consultoria', revenue: 12300, sales: 41 },
        { name: 'Curso Online', revenue: 8900, sales: 203 }
      ]
    })
  }

  const handleCreateIntegration = async () => {
    try {
      const response = await fetch('/api/payments/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...integrationForm,
          agency_id: selectedAgency
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Integração criada com sucesso!')
        setShowIntegrationDialog(false)
        resetIntegrationForm()
        loadIntegrations()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao criar integração:', error)
      toast.error(`Erro ao criar integração: ${error.message}`)
    }
  }

  const handleCreateProduct = async () => {
    try {
      const response = await fetch('/api/payments/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          agency_id: selectedAgency
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Produto criado com sucesso!')
        setShowProductDialog(false)
        resetProductForm()
        loadProducts()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast.error(`Erro ao criar produto: ${error.message}`)
    }
  }

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta integração?')) return

    try {
      const response = await fetch(`/api/payments/integrations?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        loadIntegrations()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao excluir integração:', error)
      toast.error(`Erro ao excluir integração: ${error.message}`)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const response = await fetch(`/api/payments/products?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        loadProducts()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error(`Erro ao excluir produto: ${error.message}`)
    }
  }

  const resetIntegrationForm = () => {
    setIntegrationForm({
      platform: '',
      name: '',
      description: '',
      api_key: '',
      secret_key: '',
      webhook_secret: '',
      sandbox_mode: true,
      supported_currencies: ['BRL', 'USD']
    })
    setEditingIntegration(null)
  }

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      currency: 'BRL',
      category: '',
      sku: '',
      is_subscription: false,
      billing_interval: 'month',
      trial_period_days: 0,
      image_url: '',
      product_url: ''
    })
    setEditingProduct(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de pagamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Pagamentos</h1>
          <p className="text-gray-600">Gerencie integrações, produtos e transações</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowIntegrationDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Integração
          </Button>
          <Button onClick={() => setShowProductDialog(true)} variant="outline">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.monthly_growth}% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_transactions}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de sucesso: {stats.successful_rate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.avg_transaction_value)}</div>
              <p className="text-xs text-muted-foreground">
                Por transação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integrações Ativas</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrations.filter(i => i.is_active).length}</div>
              <p className="text-xs text-muted-foreground">
                de {integrations.length} total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Produtos com maior receita no período</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.top_products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} vendas</p>
                    </div>
                    <p className="font-bold">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimas transações e eventos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Pagamento aprovado</p>
                      <p className="text-xs text-gray-600">R$ 99,90 - Plano Premium</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">2min</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Nova integração</p>
                      <p className="text-xs text-gray-600">Stripe configurado</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">5min</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Produto criado</p>
                      <p className="text-xs text-gray-600">Curso Online</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">1h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrações de Pagamento</CardTitle>
              <CardDescription>Configure suas plataformas de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Transações</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {platforms.find(p => p.value === integration.platform)?.icon}
                          </span>
                          <span className="font-medium capitalize">{integration.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>{integration.name}</TableCell>
                      <TableCell>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.test_mode ? "outline" : "default"}>
                          {integration.test_mode ? 'Teste' : 'Produção'}
                        </Badge>
                      </TableCell>
                      <TableCell>{integration.total_payments || 0}</TableCell>
                      <TableCell>{formatCurrency(integration.total_revenue || 0)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteIntegration(integration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos e Serviços</CardTitle>
              <CardDescription>Gerencie seus produtos para venda</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.sku && (
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_subscription ? "default" : "outline"}>
                          {product.is_subscription ? `Assinatura (${product.billing_interval})` : 'Único'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.stats?.total_sales || 0}</TableCell>
                      <TableCell>{formatCurrency(product.stats?.total_revenue || 0)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Acompanhe todas as transações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Implemente a lista de transações aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Nova Integração */}
      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Integração de Pagamento</DialogTitle>
            <DialogDescription>
              Configure uma nova plataforma de pagamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platform">Plataforma</Label>
                <Select
                  value={integrationForm.platform}
                  onValueChange={(value) => setIntegrationForm(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        <span className="flex items-center gap-2">
                          <span>{platform.icon}</span>
                          {platform.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="name">Nome da Integração</Label>
                <Input
                  id="name"
                  value={integrationForm.name}
                  onChange={(e) => setIntegrationForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Stripe Principal"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={integrationForm.description}
                onChange={(e) => setIntegrationForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional da integração"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={integrationForm.api_key}
                  onChange={(e) => setIntegrationForm(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Sua API Key"
                />
              </div>
              
              <div>
                <Label htmlFor="secret_key">Secret Key</Label>
                <Input
                  id="secret_key"
                  type="password"
                  value={integrationForm.secret_key}
                  onChange={(e) => setIntegrationForm(prev => ({ ...prev, secret_key: e.target.value }))}
                  placeholder="Sua Secret Key"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="webhook_secret">Webhook Secret (opcional)</Label>
              <Input
                id="webhook_secret"
                type="password"
                value={integrationForm.webhook_secret}
                onChange={(e) => setIntegrationForm(prev => ({ ...prev, webhook_secret: e.target.value }))}
                placeholder="Secret para validação de webhooks"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sandbox_mode"
                checked={integrationForm.sandbox_mode}
                onCheckedChange={(checked) => setIntegrationForm(prev => ({ ...prev, sandbox_mode: checked }))}
              />
              <Label htmlFor="sandbox_mode">Modo Sandbox (Teste)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntegrationDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateIntegration}>
              Criar Integração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Novo Produto */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
            <DialogDescription>
              Crie um novo produto ou serviço para venda
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_name">Nome do Produto</Label>
                <Input
                  id="product_name"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do produto"
                />
              </div>
              
              <div>
                <Label htmlFor="sku">SKU (opcional)</Label>
                <Input
                  id="sku"
                  value={productForm.sku}
                  onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Código do produto"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product_description">Descrição</Label>
              <Textarea
                id="product_description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Moeda</Label>
                <Select
                  value={productForm.currency}
                  onValueChange={(value) => setProductForm(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={productForm.category}
                  onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Categoria"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_subscription"
                checked={productForm.is_subscription}
                onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_subscription: checked }))}
              />
              <Label htmlFor="is_subscription">Produto de Assinatura</Label>
            </div>

            {productForm.is_subscription && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billing_interval">Intervalo de Cobrança</Label>
                  <Select
                    value={productForm.billing_interval}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, billing_interval: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {billingIntervals.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="trial_period">Período de Teste (dias)</Label>
                  <Input
                    id="trial_period"
                    type="number"
                    min="0"
                    value={productForm.trial_period_days}
                    onChange={(e) => setProductForm(prev => ({ ...prev, trial_period_days: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProduct}>
              Criar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}