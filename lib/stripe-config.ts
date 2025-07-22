// Configuração dos produtos e preços do Stripe
export const STRIPE_PRODUCTS = {
  AGENCY_BASIC: {
    name: 'Agency Basic',
    description: 'Plano básico para agências - 50 clientes, 200 projetos, recursos essenciais',
    price_monthly: 49900, // R$ 499 em centavos
    price_yearly: 499200, // R$ 4.992 (economia de 2 meses)
    features: [
      '50 clientes',
      '200 projetos',
      'Multi-cliente + White-label',
      'Google & Facebook Ads',
      'Relatórios automáticos',
      'Suporte por email'
    ]
  },
  AGENCY_PRO: {
    name: 'Agency Pro',
    description: 'Plano profissional para agências - 200 clientes, 1000 projetos, API + Automação',
    price_monthly: 129900, // R$ 1.299 em centavos
    price_yearly: 1299200, // R$ 12.992 (economia de 2 meses)
    features: [
      '200 clientes',
      '1000 projetos',
      'Tudo do Basic +',
      'API completa',
      'Automação avançada',
      'LinkedIn Ads',
      'Integrações ilimitadas',
      'Suporte prioritário'
    ]
  }
} as const

export type StripeProductKey = keyof typeof STRIPE_PRODUCTS

// IDs dos preços no Stripe (serão preenchidos após criar no dashboard)
export const STRIPE_PRICE_IDS = {
  AGENCY_BASIC_MONTHLY: process.env.STRIPE_PRICE_AGENCY_BASIC_MONTHLY || '',
  AGENCY_BASIC_YEARLY: process.env.STRIPE_PRICE_AGENCY_BASIC_YEARLY || '',
  AGENCY_PRO_MONTHLY: process.env.STRIPE_PRICE_AGENCY_PRO_MONTHLY || '',
  AGENCY_PRO_YEARLY: process.env.STRIPE_PRICE_AGENCY_PRO_YEARLY || '',
} as const

// Função para obter o price_id baseado no plano e billing
export function getStripePriceId(plan: StripeProductKey, billing: 'monthly' | 'yearly'): string {
  const key = `${plan}_${billing.toUpperCase()}` as keyof typeof STRIPE_PRICE_IDS
  return STRIPE_PRICE_IDS[key] || ''
}