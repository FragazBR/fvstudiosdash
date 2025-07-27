'use client'

// ==================================================
// FVStudios Dashboard - Credits Management System
// Sistema completo de créditos com recarga e billing
// ==================================================

import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

// Tipos do sistema de créditos
export interface UserCredits {
  id: string
  user_id: string
  agency_id: string
  plan_type: 'free' | 'basic' | 'premium' | 'enterprise'
  current_credits: number
  monthly_free_credits: number
  total_purchased_credits: number
  total_used_credits: number
  last_reset_date: Date
  blocked_reason?: string
  is_blocked: boolean
  created_at: Date
  updated_at: Date
}

export interface CreditTransaction {
  id: string
  user_id: string
  agency_id: string
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'monthly_reset'
  credits_amount: number
  cost_usd: number
  description: string
  service_used?: string
  tokens_consumed?: number
  payment_method?: string
  payment_id?: string
  metadata?: any
  created_at: Date
}

export interface CreditPackage {
  id: string
  name: string
  credits_amount: number
  price_usd: number
  price_brl: number
  discount_percentage: number
  popular: boolean
  features: string[]
}

// Configuração dos planos e créditos
export const CREDIT_PLANS = {
  free: {
    name: 'Gratuito',
    monthly_credits: 1000,
    price: 0,
    features: [
      '1.000 créditos/mês grátis',
      'Acesso básico aos sistemas IA',
      'Suporte por email'
    ]
  },
  basic: {
    name: 'Básico',
    monthly_credits: 5000,
    price: 0,
    features: [
      '5.000 créditos/mês grátis',
      'Todos os sistemas IA',
      'Relatórios básicos',
      'Suporte prioritário'
    ]
  },
  premium: {
    name: 'Premium',
    monthly_credits: 0,
    initial_credits: 50000,
    price: 97,
    features: [
      '50.000 créditos iniciais',
      'Sistema de recarga',
      'Todos os sistemas IA avançados',
      'Relatórios detalhados',
      'Suporte 24/7'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    monthly_credits: 0,
    initial_credits: 200000,
    price: 297,
    features: [
      '200.000 créditos iniciais',
      'Recarga com desconto',
      'Recursos exclusivos',
      'Manager dedicado',
      'SLA garantido'
    ]
  }
}

// Pacotes de créditos para recarga
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'small',
    name: 'Pacote Pequeno',
    credits_amount: 10000,
    price_usd: 3.75, // 25% markup sobre $3.00 da OpenAI
    price_brl: 18.75,
    discount_percentage: 0,
    popular: false,
    features: ['10.000 créditos', 'Válido por 12 meses']
  },
  {
    id: 'medium',
    name: 'Pacote Médio',
    credits_amount: 50000,
    price_usd: 15.00, // 25% markup + 20% desconto por volume
    price_brl: 75.00,
    discount_percentage: 20,
    popular: true,
    features: ['50.000 créditos', '20% de desconto', 'Válido por 12 meses']
  },
  {
    id: 'large',
    name: 'Pacote Grande',
    credits_amount: 100000,
    price_usd: 25.00, // 25% markup + 33% desconto por volume
    price_brl: 125.00,
    discount_percentage: 33,
    popular: false,
    features: ['100.000 créditos', '33% de desconto', 'Válido por 12 meses']
  },
  {
    id: 'enterprise',
    name: 'Pacote Enterprise',
    credits_amount: 500000,
    price_usd: 100.00, // 25% markup + 47% desconto por volume
    price_brl: 500.00,
    discount_percentage: 47,
    popular: false,
    features: ['500.000 créditos', '47% de desconto', 'Suporte dedicado', 'Válido por 12 meses']
  }
]

// Custos OpenAI para cálculo de créditos
export const OPENAI_TOKEN_COSTS = {
  'gpt-4': 0.03, // $0.03 per 1K tokens (média input/output)
  'gpt-4-turbo': 0.02, // $0.02 per 1K tokens
  'gpt-3.5-turbo': 0.0015, // $0.0015 per 1K tokens
  'claude-3': 0.025, // Para futuro
  'gemini-pro': 0.001 // Para futuro
}

export class CreditsManager {
  private supabase = supabaseBrowser()
  private markup = 0.25 // 25% markup

  // Verificar se usuário tem créditos suficientes
  async hasCredits(userId: string, requiredCredits: number): Promise<{
    hasCredits: boolean
    currentCredits: number
    isBlocked: boolean
    blockReason?: string
  }> {
    try {
      const userCredits = await this.getUserCredits(userId)
      
      if (!userCredits) {
        return {
          hasCredits: false,
          currentCredits: 0,
          isBlocked: true,
          blockReason: 'Usuário não encontrado'
        }
      }

      if (userCredits.is_blocked) {
        return {
          hasCredits: false,
          currentCredits: userCredits.current_credits,
          isBlocked: true,
          blockReason: userCredits.blocked_reason || 'Conta bloqueada'
        }
      }

      return {
        hasCredits: userCredits.current_credits >= requiredCredits,
        currentCredits: userCredits.current_credits,
        isBlocked: false
      }
    } catch (error) {
      console.error('Erro ao verificar créditos:', error)
      return {
        hasCredits: false,
        currentCredits: 0,
        isBlocked: true,
        blockReason: 'Erro interno'
      }
    }
  }

  // Debitar créditos do usuário
  async debitCredits(
    userId: string,
    agencyId: string,
    creditsToDebit: number,
    serviceUsed: string,
    tokensConsumed: number,
    metadata?: any
  ): Promise<boolean> {
    try {
      const userCredits = await this.getUserCredits(userId)
      
      if (!userCredits || userCredits.current_credits < creditsToDebit) {
        return false
      }

      // Atualizar créditos
      const { error: updateError } = await this.supabase
        .from('user_credits')
        .update({
          current_credits: userCredits.current_credits - creditsToDebit,
          total_used_credits: userCredits.total_used_credits + creditsToDebit,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Erro ao debitar créditos:', updateError)
        return false
      }

      // Registrar transação
      await this.recordTransaction({
        user_id: userId,
        agency_id: agencyId,
        transaction_type: 'usage',
        credits_amount: -creditsToDebit,
        cost_usd: this.calculateCostFromCredits(creditsToDebit),
        description: `Uso de ${serviceUsed}`,
        service_used: serviceUsed,
        tokens_consumed: tokensConsumed,
        metadata: metadata || {},
        created_at: new Date()
      })

      // Verificar se precisa bloquear por créditos baixos
      const remainingCredits = userCredits.current_credits - creditsToDebit
      if (remainingCredits <= 100) { // Bloquear quando restam 100 créditos
        await this.blockUser(userId, 'Créditos insuficientes. Recarregue sua conta.')
        toast.warning('⚠️ Créditos baixos! Recarregue sua conta para continuar usando os serviços IA.')
      }

      return true
    } catch (error) {
      console.error('Erro ao debitar créditos:', error)
      return false
    }
  }

  // Buscar créditos do usuário
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar créditos:', error)
        return null
      }

      if (!data) {
        // Criar créditos iniciais para usuário novo
        return await this.createInitialCredits(userId)
      }

      // Verificar se precisa resetar créditos mensais
      const lastReset = new Date(data.last_reset_date)
      const now = new Date()
      
      if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        return await this.resetMonthlyCredits(userId)
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar créditos do usuário:', error)
      return null
    }
  }

  // Criar créditos iniciais
  private async createInitialCredits(userId: string): Promise<UserCredits | null> {
    try {
      // Buscar informações do usuário
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('agency_id, role')
        .eq('id', userId)
        .single()

      if (!profile) return null

      // Determinar plano inicial
      let planType = 'free'
      let initialCredits = CREDIT_PLANS.free.monthly_credits

      if (profile.role === 'admin' || profile.role === 'owner') {
        planType = 'basic'
        initialCredits = CREDIT_PLANS.basic.monthly_credits
      }

      const creditsData = {
        user_id: userId,
        agency_id: profile.agency_id,
        plan_type: planType,
        current_credits: initialCredits,
        monthly_free_credits: initialCredits,
        total_purchased_credits: 0,
        total_used_credits: 0,
        last_reset_date: new Date().toISOString(),
        is_blocked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('user_credits')
        .insert(creditsData)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar créditos iniciais:', error)
        return null
      }

      // Registrar transação de bônus inicial
      await this.recordTransaction({
        user_id: userId,
        agency_id: profile.agency_id,
        transaction_type: 'bonus',
        credits_amount: initialCredits,
        cost_usd: 0,
        description: `Créditos iniciais do plano ${CREDIT_PLANS[planType as keyof typeof CREDIT_PLANS].name}`,
        created_at: new Date()
      })

      return data
    } catch (error) {
      console.error('Erro ao criar créditos iniciais:', error)
      return null
    }
  }

  // Resetar créditos mensais
  private async resetMonthlyCredits(userId: string): Promise<UserCredits | null> {
    try {
      const { data: currentData } = await this.supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!currentData) return null

      const plan = CREDIT_PLANS[currentData.plan_type as keyof typeof CREDIT_PLANS]
      const monthlyCredits = plan.monthly_credits || 0

      const { data, error } = await this.supabase
        .from('user_credits')
        .update({
          current_credits: currentData.current_credits + monthlyCredits,
          monthly_free_credits: monthlyCredits,
          last_reset_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao resetar créditos mensais:', error)
        return null
      }

      // Registrar transação de reset mensal
      if (monthlyCredits > 0) {
        await this.recordTransaction({
          user_id: userId,
          agency_id: currentData.agency_id,
          transaction_type: 'monthly_reset',
          credits_amount: monthlyCredits,
          cost_usd: 0,
          description: `Créditos mensais do plano ${plan.name}`,
          created_at: new Date()
        })
      }

      return data
    } catch (error) {
      console.error('Erro ao resetar créditos mensais:', error)
      return null
    }
  }

  // Comprar créditos
  async purchaseCredits(
    userId: string,
    packageId: string,
    paymentMethod: string,
    paymentId: string
  ): Promise<boolean> {
    try {
      const package_info = CREDIT_PACKAGES.find(p => p.id === packageId)
      if (!package_info) return false

      const userCredits = await this.getUserCredits(userId)
      if (!userCredits) return false

      // Adicionar créditos
      const { error: updateError } = await this.supabase
        .from('user_credits')
        .update({
          current_credits: userCredits.current_credits + package_info.credits_amount,
          total_purchased_credits: userCredits.total_purchased_credits + package_info.credits_amount,
          is_blocked: false, // Desbloquear se estava bloqueado
          blocked_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Erro ao adicionar créditos:', updateError)
        return false
      }

      // Registrar transação de compra
      await this.recordTransaction({
        user_id: userId,
        agency_id: userCredits.agency_id,
        transaction_type: 'purchase',
        credits_amount: package_info.credits_amount,
        cost_usd: package_info.price_usd,
        description: `Compra de ${package_info.name}`,
        payment_method: paymentMethod,
        payment_id: paymentId,
        metadata: { package_info },
        created_at: new Date()
      })

      toast.success(`🎉 ${package_info.credits_amount.toLocaleString()} créditos adicionados!`)
      return true
    } catch (error) {
      console.error('Erro na compra de créditos:', error)
      toast.error('Erro ao processar compra de créditos')
      return false
    }
  }

  // Registrar transação
  private async recordTransaction(transaction: Omit<CreditTransaction, 'id'>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('credit_transactions')
        .insert({
          ...transaction,
          created_at: transaction.created_at.toISOString()
        })

      if (error) {
        console.error('Erro ao registrar transação:', error)
      }
    } catch (error) {
      console.error('Erro ao registrar transação:', error)
    }
  }

  // Bloquear usuário
  private async blockUser(userId: string, reason: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_credits')
        .update({
          is_blocked: true,
          blocked_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Erro ao bloquear usuário:', error)
      }
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error)
    }
  }

  // Calcular custo em USD baseado nos créditos
  private calculateCostFromCredits(credits: number): number {
    // Assumindo GPT-4 como modelo padrão para cálculo
    const baseCost = (credits / 1000) * OPENAI_TOKEN_COSTS['gpt-4']
    return baseCost * (1 + this.markup)
  }

  // Buscar histórico de transações
  async getTransactionHistory(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await this.supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Erro ao buscar histórico:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico de transações:', error)
      return []
    }
  }

  // Estatísticas para admin
  async getAdminStats(agencyId: string) {
    try {
      const { data: transactions, error } = await this.supabase
        .from('credit_transactions')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 dias

      if (error) {
        console.error('Erro ao buscar stats:', error)
        return null
      }

      const stats = {
        totalRevenue: transactions
          .filter(t => t.transaction_type === 'purchase')
          .reduce((sum, t) => sum + t.cost_usd, 0),
        totalCreditsUsed: transactions
          .filter(t => t.transaction_type === 'usage')
          .reduce((sum, t) => sum + Math.abs(t.credits_amount), 0),
        totalCreditsPurchased: transactions
          .filter(t => t.transaction_type === 'purchase')
          .reduce((sum, t) => sum + t.credits_amount, 0),
        averageTransactionValue: 0,
        topServices: {} as Record<string, number>
      }

      // Calcular média de transação
      const purchases = transactions.filter(t => t.transaction_type === 'purchase')
      if (purchases.length > 0) {
        stats.averageTransactionValue = stats.totalRevenue / purchases.length
      }

      // Top serviços
      transactions
        .filter(t => t.service_used)
        .forEach(t => {
          const service = t.service_used!
          stats.topServices[service] = (stats.topServices[service] || 0) + Math.abs(t.credits_amount)
        })

      return stats
    } catch (error) {
      console.error('Erro ao calcular estatísticas admin:', error)
      return null
    }
  }
}

// Instância global
export const creditsManager = new CreditsManager()