'use client'

// ==================================================
// FVStudios Dashboard - Credits Recharge Component
// Sistema de recarga de créditos com gateway de pagamento
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreditCard,
  Zap,
  Star,
  CheckCircle,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Gift,
  DollarSign,
  Calendar,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { creditsManager, CREDIT_PACKAGES, type UserCredits } from '@/lib/credits-manager'
import { useUser } from '@/hooks/useUser'

interface CreditsRechargeProps {
  userCredits: UserCredits | null
  onRecharge?: () => void
  showFullDashboard?: boolean
}

export function CreditsRecharge({ 
  userCredits, 
  onRecharge,
  showFullDashboard = false 
}: CreditsRechargeProps) {
  const { user } = useUser()
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('card')
  const [loading, setLoading] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  const getCreditStatus = () => {
    if (!userCredits) return { color: 'bg-gray-500', text: 'Carregando...' }
    
    if (userCredits.current_credits <= 100) {
      return { color: 'bg-red-500', text: 'Créditos Esgotados' }
    } else if (userCredits.current_credits <= 1000) {
      return { color: 'bg-yellow-500', text: 'Créditos Baixos' }
    } else if (userCredits.current_credits <= 5000) {
      return { color: 'bg-blue-500', text: 'Créditos Normais' }
    } else {
      return { color: 'bg-green-500', text: 'Créditos Abundantes' }
    }
  }

  const getUsagePercentage = () => {
    if (!userCredits) return 0
    const total = userCredits.total_purchased_credits + userCredits.monthly_free_credits
    if (total === 0) return 0
    return Math.min(100, (userCredits.total_used_credits / total) * 100)
  }

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return

    setLoading(true)
    
    try {
      // Simular processamento de pagamento
      // Em produção, integrar com Stripe, PagSeguro, etc.
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const success = await creditsManager.purchaseCredits(
        user.id,
        selectedPackage,
        paymentMethod,
        `payment_${Date.now()}`
      )

      if (success) {
        setShowPurchaseDialog(false)
        setSelectedPackage('')
        if (onRecharge) onRecharge()
        toast.success('🎉 Créditos adicionados com sucesso!')
      } else {
        toast.error('❌ Erro no processamento do pagamento')
      }
    } catch (error) {
      console.error('Erro na compra:', error)
      toast.error('❌ Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (priceUsd: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(priceUsd * 5) // Conversão aproximada USD->BRL
  }

  const creditStatus = getCreditStatus()

  // Versão compacta para dashboards
  if (!showFullDashboard) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Meus Créditos
            </div>
            <Badge className={`${creditStatus.color} text-white`}>
              {creditStatus.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {userCredits?.current_credits?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500">créditos disponíveis</div>
            </div>
            
            <Progress 
              value={getUsagePercentage()} 
              className="h-2"
            />
            
            <div className="text-xs text-gray-500 text-center">
              {userCredits?.total_used_credits?.toLocaleString() || 0} de{' '}
              {((userCredits?.total_purchased_credits || 0) + (userCredits?.monthly_free_credits || 0)).toLocaleString()} usados
            </div>

            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Recarregar Créditos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Recarregar Créditos IA
                  </DialogTitle>
                  <DialogDescription>
                    Escolha o pacote ideal para continuar usando nossos serviços de IA
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedPackage === pkg.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${pkg.popular ? 'border-blue-500 shadow-md' : ''}`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          {pkg.popular && (
                            <Badge className="bg-blue-500">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        {pkg.discount_percentage > 0 && (
                          <Badge variant="secondary" className="text-green-600">
                            {pkg.discount_percentage}% OFF
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {pkg.credits_amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">créditos</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-xl font-semibold">
                              {formatPrice(pkg.price_usd)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ~R$ {(pkg.price_usd * 5 / pkg.credits_amount * 1000).toFixed(2)}/1k créditos
                            </div>
                          </div>

                          <div className="space-y-1">
                            {pkg.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedPackage && (
                  <div className="border-t pt-4">
                    <div className="mb-4">
                      <label className="text-sm font-medium mb-2 block">
                        Método de Pagamento
                      </label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">💳 Cartão de Crédito</SelectItem>
                          <SelectItem value="pix">📱 PIX</SelectItem>
                          <SelectItem value="boleto">🧾 Boleto Bancário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Alert>
                      <DollarSign className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Resumo da compra:</strong><br />
                        {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits_amount.toLocaleString()} créditos por{' '}
                        {formatPrice(CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price_usd || 0)}
                        {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.discount_percentage ? 
                          ` (${CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.discount_percentage}% de desconto)` : ''
                        }
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handlePurchase}
                    disabled={!selectedPackage || loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Comprar Créditos
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Versão completa do dashboard
  return (
    <div className="space-y-6">
      {/* Status dos Créditos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Créditos Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userCredits?.current_credits?.toLocaleString() || '0'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${creditStatus.color} text-white text-xs`}>
                {creditStatus.text}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Usado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userCredits?.total_used_credits?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Comprado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userCredits?.total_purchased_credits?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <Gift className="h-3 w-3 inline mr-1" />
              + {userCredits?.monthly_free_credits?.toLocaleString() || '0'} grátis
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Uso Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={getUsagePercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{userCredits?.total_used_credits?.toLocaleString() || 0} usados</span>
              <span>
                {((userCredits?.total_purchased_credits || 0) + (userCredits?.monthly_free_credits || 0)).toLocaleString()} total
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {userCredits?.current_credits && userCredits.current_credits <= 1000 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong> Seus créditos estão acabando. 
            Recarregue agora para continuar usando os serviços de IA.
          </AlertDescription>
        </Alert>
      )}

      {/* Botão Principal de Recarga */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Potencialize sua IA</h3>
          <p className="text-gray-600 mb-4">
            Recarregue seus créditos e continue criando conteúdo incrível com nossos sistemas inteligentes
          </p>
          
          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Zap className="h-5 w-5 mr-2" />
                Recarregar Créditos Agora
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              {/* Mesmo conteúdo do dialog acima */}
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Recarregar Créditos IA
                </DialogTitle>
                <DialogDescription>
                  Escolha o pacote ideal para continuar usando nossos serviços de IA
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPackage === pkg.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    } ${pkg.popular ? 'border-blue-500 shadow-md' : ''}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {pkg.popular && (
                          <Badge className="bg-blue-500">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      {pkg.discount_percentage > 0 && (
                        <Badge variant="secondary" className="text-green-600">
                          {pkg.discount_percentage}% OFF
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {pkg.credits_amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">créditos</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xl font-semibold">
                            {formatPrice(pkg.price_usd)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ~R$ {(pkg.price_usd * 5 / pkg.credits_amount * 1000).toFixed(2)}/1k créditos
                          </div>
                        </div>

                        <div className="space-y-1">
                          {pkg.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedPackage && (
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">
                      Método de Pagamento
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">💳 Cartão de Crédito</SelectItem>
                        <SelectItem value="pix">📱 PIX</SelectItem>
                        <SelectItem value="boleto">🧾 Boleto Bancário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Resumo da compra:</strong><br />
                      {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits_amount.toLocaleString()} créditos por{' '}
                      {formatPrice(CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price_usd || 0)}
                      {CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.discount_percentage ? 
                        ` (${CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.discount_percentage}% de desconto)` : ''
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handlePurchase}
                  disabled={!selectedPackage || loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Comprar Créditos
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}