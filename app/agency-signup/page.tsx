'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, BarChart3, Zap } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

const plans = [
  {
    id: 'agency_basic',
    name: 'Agency Basic',
    price: { monthly: 499, annual: 4990 },
    description: 'Para agências iniciantes',
    features: [
      'Até 50 clientes',
      '200 projetos/campanhas',
      'Dashboard multi-cliente',
      'Relatórios básicos',
      'Suporte por email',
      'Google Ads + Facebook Ads'
    ],
    popular: false
  },
  {
    id: 'agency_pro',
    name: 'Agency Pro',
    price: { monthly: 1299, annual: 12990 },
    description: 'Para agências em crescimento',
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
    popular: true
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
    estimatedClients: '1-10'
  });
  const [loading, setLoading] = useState(false);
  const supabase = supabaseBrowser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar lead no banco
      const { data, error } = await supabase.rpc('process_website_lead', {
        email: formData.email,
        name: formData.name,
        company_name: formData.company,
        phone: formData.phone,
        interested_plan: selectedPlan,
        lead_source: 'website'
      });

      if (error) throw error;

      // Redirecionar para pagamento (Stripe/PagSeguro)
      toast.success('Cadastro realizado! Redirecionando para pagamento...');
      
      // Aqui você integraria com Stripe/PagSeguro
      // window.location.href = `/checkout?plan=${selectedPlan}&cycle=${billingCycle}&lead_id=${data.lead_id}`;
      
      // Por enquanto, simular sucesso
      setTimeout(() => {
        toast.success('Pagamento aprovado! Sua conta está sendo criada...');
      }, 2000);

    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao processar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const currentPrice = selectedPlanData?.price[billingCycle as 'monthly' | 'annual'] || 0;
  const savings = billingCycle === 'annual' ? 
    Math.round(((selectedPlanData?.price.monthly || 0) * 12 - (selectedPlanData?.price.annual || 0)) / (selectedPlanData?.price.monthly || 1)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comece sua jornada com FVStudios Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gerencie todos seus clientes em um só lugar. Dashboard multi-tenant para agências de marketing digital.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Planos */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Escolha seu plano</h2>
              
              {/* Toggle de período */}
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 mb-6 w-fit">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === 'monthly' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === 'annual' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Anual
                  <Badge variant="secondary" className="ml-2">
                    Economize {savings > 0 ? `${savings}%` : ''}
                  </Badge>
                </button>
              </div>

              {/* Cards dos planos */}
              <div className="grid md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer transition-all ${
                      selectedPlan === plan.id 
                        ? 'ring-2 ring-blue-500 shadow-lg' 
                        : 'hover:shadow-md'
                    } ${plan.popular ? 'relative' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-orange-500 text-white px-3 py-1">
                          <Star className="w-3 h-3 mr-1" />
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            R$ {(plan.price[billingCycle as 'monthly' | 'annual'] / 100).toLocaleString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-500">
                            /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                          </div>
                        </div>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Dados da sua agência
                </CardTitle>
                <CardDescription>
                  Preencha os dados para criar sua conta
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="João Silva"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email profissional</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="joao@suaagencia.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Nome da agência</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="Sua Agência Marketing"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website (opcional)</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://suaagencia.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimatedClients">Quantos clientes você tem?</Label>
                    <Select 
                      value={formData.estimatedClients} 
                      onValueChange={(value) => setFormData({...formData, estimatedClients: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 clientes</SelectItem>
                        <SelectItem value="11-25">11-25 clientes</SelectItem>
                        <SelectItem value="26-50">26-50 clientes</SelectItem>
                        <SelectItem value="51-100">51-100 clientes</SelectItem>
                        <SelectItem value="100+">Mais de 100 clientes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currentTools">Ferramentas que usa atualmente</Label>
                    <Textarea
                      id="currentTools"
                      value={formData.currentTools}
                      onChange={(e) => setFormData({...formData, currentTools: e.target.value})}
                      placeholder="Google Ads, Facebook Ads, Google Analytics..."
                      rows={3}
                    />
                  </div>

                  {/* Resumo do pedido */}
                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-medium mb-2">Resumo do pedido</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{selectedPlanData?.name}</span>
                        <span>R$ {(currentPrice / 100).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Período</span>
                        <span>{billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</span>
                      </div>
                      {billingCycle === 'annual' && savings > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Economia</span>
                          <span>-{savings}%</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>R$ {(currentPrice / 100).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Continuar para pagamento
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Ao continuar, você concorda com nossos termos de uso e política de privacidade.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Por que escolher FVStudios Dashboard?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-tenant</h3>
              <p className="text-gray-600">
                Gerencie múltiplos clientes com isolamento completo de dados e dashboards personalizados.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Relatórios Avançados</h3>
              <p className="text-gray-600">
                Relatórios automáticos com métricas calculadas (CTR, CPC, ROAS) e integração com APIs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automação</h3>
              <p className="text-gray-600">
                Automatize relatórios, alertas de performance e notificações para você e seus clientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
