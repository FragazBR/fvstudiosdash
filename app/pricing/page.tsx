"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Building2, User, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from 'sonner'

// Definição completa de todos os planos
const allPlans = [
  // PLANOS INDIVIDUAIS
  {
    id: 'free',
    name: 'Free',
    type: 'Individual',
    icon: User,
    price: { monthly: 0, annual: 0 },
    originalPrice: { monthly: 0, annual: 0 },
    description: 'Para iniciantes que querem experimentar',
    features: [
      '1 cliente',
      '3 projetos',
      'Google Analytics básico',
      'Relatórios simples',
      'Suporte via email'
    ],
    limits: {
      clients: 1,
      projects: 3,
      storage: '500MB'
    },
    color: 'gray',
    popular: false,
    cta: 'Começar Grátis'
  },
  {
    id: 'basic',
    name: 'Basic',
    type: 'Individual',
    icon: User,
    price: { monthly: 9900, annual: 99000 }, // R$ 99/mês, R$ 990/ano
    originalPrice: { monthly: 9900, annual: 118800 },
    description: 'Ideal para profissionais independentes',
    features: [
      '5 clientes',
      '20 projetos',
      'Google Analytics + Facebook Ads',
      'Relatórios avançados',
      'Dashboard personalizado',
      'Suporte prioritário'
    ],
    limits: {
      clients: 5,
      projects: 20,
      storage: '5GB'
    },
    color: 'blue',
    popular: false,
    cta: 'Assinar Basic'
  },
  {
    id: 'premium',
    name: 'Premium',
    type: 'Individual',
    icon: Star,
    price: { monthly: 29900, annual: 299000 }, // R$ 299/mês, R$ 2.990/ano
    originalPrice: { monthly: 29900, annual: 358800 },
    description: 'Para profissionais avançados',
    features: [
      '25 clientes',
      '100 projetos',
      'LinkedIn + Automação',
      'Relatórios white-label',
      'API básica',
      'Integrações avançadas',
      'Suporte telefônico'
    ],
    limits: {
      clients: 25,
      projects: 100,
      storage: '50GB'
    },
    color: 'purple',
    popular: true,
    cta: 'Assinar Premium'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    type: 'Individual',
    icon: Crown,
    price: { monthly: 99900, annual: 999000 }, // R$ 999/mês, R$ 9.990/ano
    originalPrice: { monthly: 99900, annual: 1198800 },
    description: 'Solução completa para especialistas',
    features: [
      'Clientes ilimitados',
      'Projetos ilimitados',
      'Todas as integrações',
      'API completa',
      'Automação avançada',
      'Suporte dedicado',
      'Onboarding personalizado'
    ],
    limits: {
      clients: 'Ilimitados',
      projects: 'Ilimitados',
      storage: '500GB'
    },
    color: 'gold',
    popular: false,
    cta: 'Assinar Enterprise'
  },
  // PLANOS DE AGÊNCIA
  {
    id: 'agency_basic',
    name: 'Agency Basic',
    type: 'Agência',
    icon: Building2,
    price: { monthly: 49900, annual: 499200 }, // R$ 499/mês, R$ 4.992/ano
    originalPrice: { monthly: 49900, annual: 598800 },
    description: 'Para agências iniciantes',
    features: [
      '50 clientes',
      '200 projetos/campanhas',
      'Dashboard multi-cliente',
      'White-label básico',
      'Relatórios automáticos',
      'Google + Facebook Ads',
      'Gestão de equipe'
    ],
    limits: {
      clients: 50,
      projects: 200,
      storage: '100GB'
    },
    color: 'green',
    popular: false,
    cta: 'Assinar Agency Basic'
  },
  {
    id: 'agency_pro',
    name: 'Agency Pro',
    type: 'Agência',
    icon: Sparkles,
    price: { monthly: 129900, annual: 1299200 }, // R$ 1.299/mês, R$ 12.992/ano
    originalPrice: { monthly: 129900, annual: 1558800 },
    description: 'Para agências em crescimento',
    features: [
      '200 clientes',
      '1000 projetos/campanhas',
      'Dashboard avançado',
      'White-label completo',
      'API personalizada',
      'Automação avançada',
      'Todas as integrações',
      'Suporte prioritário',
      'Onboarding dedicado'
    ],
    limits: {
      clients: 200,
      projects: 1000,
      storage: '1TB'
    },
    color: 'emerald',
    popular: true,
    cta: 'Assinar Agency Pro'
  }
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'individual' | 'agency'>('all')

  const filteredPlans = allPlans.filter(plan => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'individual') return plan.type === 'Individual'
    if (selectedCategory === 'agency') return plan.type === 'Agência'
    return true
  })

  const getPlanColor = (color: string) => {
    const colors = {
      gray: 'border-gray-200 dark:border-gray-700',
      blue: 'border-blue-200 dark:border-blue-800 ring-blue-500',
      purple: 'border-purple-200 dark:border-purple-800 ring-purple-500',
      gold: 'border-yellow-200 dark:border-yellow-800 ring-yellow-500',
      green: 'border-green-200 dark:border-green-800 ring-green-500',
      emerald: 'border-emerald-200 dark:border-emerald-800 ring-emerald-500'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const getPlanAccent = (color: string) => {
    const colors = {
      gray: 'text-gray-600 dark:text-gray-400',
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      gold: 'text-yellow-600 dark:text-yellow-400',
      green: 'text-green-600 dark:text-green-400',
      emerald: 'text-emerald-600 dark:text-emerald-400'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') {
      // Redirecionar para cadastro gratuito
      window.location.href = '/signup?plan=free'
      return
    }

    // Para planos pagos, redirecionar para checkout
    toast.success('Redirecionando para checkout...')
    
    // Aqui integraria com o sistema de checkout
    const plan = allPlans.find(p => p.id === planId)
    if (plan?.type === 'Agência') {
      window.location.href = `/agency-signup?plan=${planId}&billing=${billingCycle}`
    } else {
      window.location.href = `/signup?plan=${planId}&billing=${billingCycle}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="relative bg-white/90 dark:bg-[#171717]/90 backdrop-blur-sm border-b border-gray-200 dark:border-[#272727]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Escolha o plano perfeito para você
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Desde profissionais independentes até grandes agências, temos a solução ideal para impulsionar seus resultados digitais.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-gray-100 dark:bg-[#1f1f1f] p-1 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-6 py-2 rounded-md text-sm font-medium transition-all',
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-[#171717] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={cn(
                  'px-6 py-2 rounded-md text-sm font-medium transition-all',
                  billingCycle === 'annual'
                    ? 'bg-white dark:bg-[#171717] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                Anual
                <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Economize até 20%
                </Badge>
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center mt-6">
            <div className="bg-gray-100 dark:bg-[#1f1f1f] p-1 rounded-lg">
              {[
                { id: 'all', name: 'Todos os Planos' },
                { id: 'individual', name: 'Individual' },
                { id: 'agency', name: 'Agências' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all',
                    selectedCategory === category.id
                      ? 'bg-white dark:bg-[#171717] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlans.map((plan) => {
            const Icon = plan.icon
            const currentPrice = plan.price[billingCycle]
            const originalPrice = plan.originalPrice[billingCycle]
            const savings = billingCycle === 'annual' ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative bg-white/90 dark:bg-[#1f1f1f]/80 backdrop-blur-sm border hover:shadow-lg transition-all duration-300 group cursor-pointer',
                  getPlanColor(plan.color),
                  plan.popular && 'ring-2 scale-105'
                )}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      ⭐ Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      'p-3 rounded-full',
                      plan.color === 'gray' ? 'bg-gray-100 dark:bg-gray-800' :
                      plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      plan.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      plan.color === 'gold' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      plan.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                      'bg-emerald-100 dark:bg-emerald-900/30'
                    )}>
                      <Icon className={cn('h-8 w-8', getPlanAccent(plan.color))} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {plan.type}
                    </Badge>
                  </div>
                  
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    {currentPrice === 0 ? (
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        Grátis
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                          R$ {(currentPrice / 100).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </div>
                        {savings > 0 && (
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Economize {savings}% no plano anual
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Button 
                    className={cn(
                      'w-full mb-6 group-hover:scale-105 transition-transform',
                      plan.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
                    )}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Recursos inclusos:
                      </h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Limites:
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Clientes:</span>
                          <span className="font-medium">{plan.limits.clients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Projetos:</span>
                          <span className="font-medium">{plan.limits.projects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage:</span>
                          <span className="font-medium">{plan.limits.storage}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Precisa de algo personalizado?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Entre em contato conosco para soluções enterprise personalizadas com recursos exclusivos.
              </p>
              <Button asChild size="lg">
                <Link href="/contact">
                  Falar com Especialista
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}