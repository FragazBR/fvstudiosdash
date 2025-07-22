"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, User, Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Para iniciantes que querem experimentar',
    icon: User,
    features: [
      '1 cliente',
      '3 projetos',
      'Google Analytics básico',
      'Relatórios simples',
      'Suporte via email'
    ],
    popular: false,
    color: 'gray'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: 9900, yearly: 99000 },
    description: 'Ideal para profissionais independentes',
    icon: User,
    features: [
      '5 clientes',
      '20 projetos',
      'Google Analytics + Facebook Ads',
      'Relatórios avançados',
      'Dashboard personalizado',
      'Suporte prioritário'
    ],
    popular: false,
    color: 'blue'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: { monthly: 29900, yearly: 299000 },
    description: 'Para profissionais avançados',
    icon: Star,
    features: [
      '25 clientes',
      '100 projetos',
      'LinkedIn + Automação',
      'Relatórios white-label',
      'API básica',
      'Integrações avançadas',
      'Suporte telefônico'
    ],
    popular: true,
    color: 'purple'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 99900, yearly: 999000 },
    description: 'Solução completa para especialistas',
    icon: Crown,
    features: [
      'Clientes ilimitados',
      'Projetos ilimitados',
      'Todas as integrações',
      'API completa',
      'Automação avançada',
      'Suporte dedicado',
      'Onboarding personalizado'
    ],
    popular: false,
    color: 'gold'
  }
];

function SignupContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const billingParam = searchParams.get('billing');

  const [selectedPlan, setSelectedPlan] = useState(planParam || 'free');
  const [billingCycle, setBillingCycle] = useState(billingParam || 'monthly');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    currentTools: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
  const currentPrice = selectedPlanData?.price[billingCycle as 'monthly' | 'yearly'] || 0;
  const yearlyDiscount = selectedPlanData?.price.monthly ? 
    Math.round(((selectedPlanData?.price.monthly || 0) * 12 - (selectedPlanData?.price.yearly || 0)) / (selectedPlanData?.price.monthly || 1)) : 0;

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Se for plano gratuito, apenas criar conta
      if (selectedPlan === 'free') {
        const { data, error } = await supabaseBrowser().rpc('process_website_lead', {
          p_name: formData.name,
          p_email: formData.email,
          p_company_name: formData.company,
          p_phone: formData.phone,
          p_website: formData.website,
          p_current_tools: formData.currentTools,
          p_estimated_clients: '1-5',
          p_plan_interest: selectedPlan,
          p_billing_cycle: billingCycle,
          p_utm_source: 'individual-signup',
          p_utm_medium: 'website',
          p_utm_campaign: 'individual-conversion'
        });

        if (error) throw error;

        toast.success('Conta criada com sucesso! Redirecionando...');
        window.location.href = '/dashboard';
        return;
      }

      // Para planos pagos, criar lead no Supabase
      const { data, error } = await supabaseBrowser().rpc('process_website_lead', {
        p_name: formData.name,
        p_email: formData.email,
        p_company_name: formData.company,
        p_phone: formData.phone,
        p_website: formData.website,
        p_current_tools: formData.currentTools,
        p_estimated_clients: '1-5',
        p_plan_interest: selectedPlan,
        p_billing_cycle: billingCycle,
        p_utm_source: 'individual-signup',
        p_utm_medium: 'website',
        p_utm_campaign: 'individual-conversion'
      });

      if (error) throw error;

      toast.success('Cadastro realizado! Redirecionando para pagamento...');
      
      // Determinar o price_id do Stripe baseado no plano e ciclo
      const getPriceId = (plan: string, cycle: string) => {
        if (plan === 'basic' && cycle === 'monthly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY
        if (plan === 'basic' && cycle === 'yearly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY
        if (plan === 'premium' && cycle === 'monthly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY
        if (plan === 'premium' && cycle === 'yearly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY
        if (plan === 'enterprise' && cycle === 'monthly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY
        if (plan === 'enterprise' && cycle === 'yearly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY
        return process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY // fallback
      }
      
      const priceId = getPriceId(selectedPlan, billingCycle)
      
      // Criar sessão de checkout Stripe
      const checkoutResponse = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          email: formData.email,
          metadata: {
            leadId: data.lead_id,
            planName: selectedPlanData?.name,
            billingCycle,
            companyName: formData.company,
          }
        })
      })
      
      const checkoutData = await checkoutResponse.json()
      
      if (checkoutData.url) {
        window.location.href = checkoutData.url
      } else {
        throw new Error('Erro ao criar sessão de pagamento')
      }

    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao processar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (color: string, selected: boolean) => {
    if (selected) {
      return 'ring-2 ring-blue-500 dark:ring-[#64f481] shadow-lg border-blue-200 dark:border-[#64f481]/30'
    }
    const colors = {
      gray: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
      blue: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700',
      purple: 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700',
      gold: 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700'
    }
    return colors[color as keyof typeof colors] || 'border-gray-200 dark:border-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Acelere seus resultados digitais
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Escolha o plano ideal para profissionais independentes, freelancers e especialistas digitais.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Seleção de Planos */}
          <div className="lg:col-span-2">
            {/* Toggle Billing */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 dark:bg-[#1f1f1f] rounded-lg p-1 shadow-sm border border-gray-200 dark:border-[#272727]">
                <div className="grid grid-cols-2 gap-1">
                  {(['monthly', 'yearly'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        billingCycle === cycle
                          ? 'bg-white dark:bg-[#171717] text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-[#272727]/50'
                      }`}
                    >
                      {cycle === 'monthly' ? 'Mensal' : 'Anual'}
                      {cycle === 'yearly' && (
                        <Badge className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          Economize {yearlyDiscount}%
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {plans.map((plan) => {
                const Icon = plan.icon
                const isSelected = selectedPlan === plan.id
                
                return (
                  <Card 
                    key={plan.id}
                    className={cn(
                      'relative cursor-pointer transition-all duration-200 bg-white/90 dark:bg-[#1f1f1f]/80 backdrop-blur-sm border hover:shadow-lg hover:-translate-y-1',
                      getPlanColor(plan.color, isSelected)
                    )}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          ⭐ Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-lg',
                            plan.color === 'gray' ? 'bg-gray-100 dark:bg-gray-900/30' :
                            plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            plan.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                            'bg-yellow-100 dark:bg-yellow-900/30'
                          )}>
                            <Icon className={cn(
                              'h-5 w-5',
                              plan.color === 'gray' ? 'text-gray-600 dark:text-gray-400' :
                              plan.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                              plan.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                              'text-yellow-600 dark:text-yellow-400'
                            )} />
                          </div>
                          <CardTitle className="text-xl text-gray-900 dark:text-white">{plan.name}</CardTitle>
                        </div>
                        <div className="text-right">
                          {plan.price[billingCycle as 'monthly' | 'yearly'] === 0 ? (
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              Grátis
                            </div>
                          ) : (
                            <>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                R$ {(plan.price[billingCycle as 'monthly' | 'yearly'] / 100).toLocaleString('pt-BR')}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-gray-600 dark:text-gray-400">{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Formulário */}
          <div>
            <Card className="bg-white/90 dark:bg-[#1f1f1f]/80 backdrop-blur-sm border border-gray-200 dark:border-[#272727] sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <User className="w-5 h-5 mr-2" />
                  Seus dados
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Preencha os dados para criar sua conta
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Nome completo *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="joao@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-gray-700 dark:text-gray-300">Empresa/Freelancer</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Minha Empresa"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-gray-700 dark:text-gray-300">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://meusite.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentTools" className="text-gray-700 dark:text-gray-300">Ferramentas atuais</Label>
                    <Select onValueChange={(value) => handleInputChange('currentTools', value)}>
                      <SelectTrigger className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-[#272727]">
                        <SelectItem value="google-ads">Google Ads</SelectItem>
                        <SelectItem value="facebook-ads">Facebook Ads</SelectItem>
                        <SelectItem value="linkedin-ads">LinkedIn Ads</SelectItem>
                        <SelectItem value="google-analytics">Google Analytics</SelectItem>
                        <SelectItem value="other">Outras</SelectItem>
                        <SelectItem value="none">Nenhuma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience" className="text-gray-700 dark:text-gray-300">Nível de experiência</Label>
                    <Select onValueChange={(value) => handleInputChange('experience', value)}>
                      <SelectTrigger className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-[#272727]">
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                        <SelectItem value="expert">Especialista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resumo do Plano */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Resumo do plano selecionado:
                    </h4>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <div className="flex justify-between">
                        <span>{selectedPlanData?.name}</span>
                        <span className="font-medium">
                          {currentPrice === 0 ? 'Grátis' : `R$ ${(currentPrice / 100).toLocaleString('pt-BR')}`}
                        </span>
                      </div>
                      {currentPrice > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Cobrança {billingCycle === 'monthly' ? 'mensal' : 'anual'}
                          {billingCycle === 'yearly' && ` • Economia de ${yearlyDiscount}%`}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" 
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : selectedPlan === 'free' ? 'Criar Conta Grátis' : 'Continuar para Pagamento'}
                  </Button>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Ao continuar, você aceita nossos Termos de Serviço e Política de Privacidade
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SignupContent />
    </Suspense>
  );
}