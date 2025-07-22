"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

const plans = [
  {
    id: 'agency_basic',
    name: 'Agency Basic',
    price: { monthly: 49900, yearly: 499200 },  // R$ 499/mês, R$ 4.992/ano
    description: 'Para agências iniciantes',
    icon: Building2,
    features: [
      'Até 50 clientes',
      '200 projetos/campanhas',
      'Dashboard multi-cliente',
      'Relatórios básicos',
      'White-label básico',
      'Suporte por email',
      'Google Ads + Facebook Ads'
    ],
    popular: false,
    color: 'green'
  },
  {
    id: 'agency_pro',
    name: 'Agency Pro',
    price: { monthly: 129900, yearly: 1299200 },  // R$ 1.299/mês, R$ 12.992/ano
    description: 'Para agências em crescimento',
    icon: Sparkles,
    features: [
      'Até 200 clientes',
      '1000 projetos/campanhas',
      'Dashboard avançado',
      'White-label completo',
      'Automação avançada',
      'Todas as integrações',
      'API personalizada',
      'Suporte prioritário'
    ],
    popular: true,
    color: 'emerald'
  }
];

export default function AgencySignupPage() {
  const [selectedPlan, setSelectedPlan] = useState('agency_basic');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    currentTools: '',
    estimatedClients: ''
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
      // Criar lead no Supabase
      const { data, error } = await supabaseBrowser().rpc('process_website_lead', {
        p_name: formData.name,
        p_email: formData.email,
        p_company_name: formData.company,
        p_phone: formData.phone,
        p_website: formData.website,
        p_current_tools: formData.currentTools,
        p_estimated_clients: formData.estimatedClients,
        p_plan_interest: selectedPlan,
        p_billing_cycle: billingCycle,
        p_utm_source: 'agency-signup',
        p_utm_medium: 'website',
        p_utm_campaign: 'agency-conversion'
      });

      if (error) throw error;

      // Redirecionar para pagamento Stripe
      toast.success('Cadastro realizado! Redirecionando para pagamento...');
      
      // Determinar o price_id do Stripe baseado no plano e ciclo
      const getPriceId = (plan: string, cycle: string) => {
        if (plan === 'agency_basic' && cycle === 'monthly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_BASIC_MONTHLY
        if (plan === 'agency_basic' && cycle === 'yearly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_BASIC_YEARLY
        if (plan === 'agency_pro' && cycle === 'monthly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_PRO_MONTHLY
        if (plan === 'agency_pro' && cycle === 'yearly') return process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_PRO_YEARLY
        return process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY_BASIC_MONTHLY // fallback
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
            planName: `Agency ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`,
            billingCycle,
            companyName: formData.company,
          }
        })
      })
      
      const checkoutData = await checkoutResponse.json()
      
      if (checkoutData.url) {
        // Redirecionar para o checkout Stripe
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
      green: 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700',
      emerald: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700'
    }
    return colors[color as keyof typeof colors] || 'border-gray-200 dark:border-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Transforme sua agência com nossa plataforma completa
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Gerencie clientes, projetos e campanhas em um só lugar. 
            Dashboard white-label, relatórios automáticos e integrações com as principais plataformas.
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
            <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                            plan.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                          )}>
                            <Icon className={cn(
                              'h-5 w-5',
                              plan.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-emerald-600 dark:text-emerald-400'
                            )} />
                          </div>
                          <CardTitle className="text-xl text-gray-900 dark:text-white">{plan.name}</CardTitle>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            R$ {(plan.price[billingCycle as 'monthly' | 'yearly'] / 100).toLocaleString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                          </div>
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
                  <Users className="w-5 h-5 mr-2" />
                  Dados da sua agência
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Preencha os dados para criar sua conta
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Nome do responsável *</Label>
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
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-mail corporativo *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="joao@agencia.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-gray-700 dark:text-gray-300">Nome da agência *</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Minha Agência Digital"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
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
                    <Label htmlFor="website" className="text-gray-700 dark:text-gray-300">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://agencia.com"
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
                    <Label htmlFor="estimatedClients" className="text-gray-700 dark:text-gray-300">Número de clientes estimado</Label>
                    <Select onValueChange={(value) => handleInputChange('estimatedClients', value)}>
                      <SelectTrigger className="bg-white dark:bg-[#171717] border-gray-300 dark:border-[#272727] text-gray-900 dark:text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-[#272727]">
                        <SelectItem value="1-5">1-5 clientes</SelectItem>
                        <SelectItem value="6-15">6-15 clientes</SelectItem>
                        <SelectItem value="16-30">16-30 clientes</SelectItem>
                        <SelectItem value="31-50">31-50 clientes</SelectItem>
                        <SelectItem value="50+">Mais de 50 clientes</SelectItem>
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
                          R$ {(currentPrice / 100).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Cobrança {billingCycle === 'monthly' ? 'mensal' : 'anual'}
                        {billingCycle === 'yearly' && ` • Economia de ${yearlyDiscount}%`}
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" 
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : 'Cadastrar Agência'}
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