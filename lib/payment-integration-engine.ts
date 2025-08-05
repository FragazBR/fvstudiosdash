import { EventEmitter } from 'events'
import { supabaseServer } from './supabaseServer'
import Stripe from 'stripe'
import { PayPalApi } from '@paypal/checkout-server-sdk'

export interface PaymentConfig {
  platform: 'stripe' | 'paypal' | 'mercado_pago' | 'pagseguro' | 'asaas'
  apiKey: string
  secretKey: string
  webhookSecret?: string
  sandboxMode?: boolean
  supportedCurrencies?: string[]
  config?: Record<string, any>
}

export interface PaymentProduct {
  id?: string
  name: string
  description?: string
  price: number
  currency: string
  isSubscription?: boolean
  billingInterval?: 'day' | 'week' | 'month' | 'year'
  trialPeriodDays?: number
  metadata?: Record<string, any>
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  customerId?: string
  customerEmail?: string
  customerName?: string
  productId?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  checkoutUrl?: string
  error?: string
  data?: any
}

export interface WebhookEvent {
  id: string
  type: string
  data: any
  platform: string
  signature?: string
  timestamp: number
}

export interface SubscriptionData {
  id: string
  customerId: string
  status: string
  amount: number
  currency: string
  interval: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  canceledAt?: Date
  metadata?: Record<string, any>
}

export class PaymentIntegrationEngine extends EventEmitter {
  private integrations: Map<string, any> = new Map()
  private webhookProcessors: Map<string, Function> = new Map()
  private supabase: any

  constructor() {
    super()
    this.initializeSupabase()
    this.setupWebhookProcessors()
  }

  private async initializeSupabase() {
    this.supabase = await supabaseServer()
  }

  // Inicializar integração com plataforma
  async initializeIntegration(agencyId: string, config: PaymentConfig): Promise<boolean> {
    try {
      const integrationKey = `${agencyId}_${config.platform}`
      
      switch (config.platform) {
        case 'stripe':
          const stripe = new Stripe(config.secretKey, {
            apiVersion: '2024-11-20.acacia'
          })
          this.integrations.set(integrationKey, { client: stripe, config })
          break
          
        case 'paypal':
          // Implementar PayPal SDK
          const paypalConfig = {
            clientId: config.apiKey,
            clientSecret: config.secretKey,
            environment: config.sandboxMode ? 'sandbox' : 'live'
          }
          this.integrations.set(integrationKey, { config: paypalConfig })
          break
          
        case 'mercado_pago':
          // Implementar Mercado Pago SDK
          this.integrations.set(integrationKey, { config })
          break
          
        default:
          throw new Error(`Plataforma ${config.platform} não suportada`)
      }

      // Salvar configuração no banco
      await this.saveIntegrationConfig(agencyId, config)
      
      this.emit('integration_initialized', { agencyId, platform: config.platform })
      return true
      
    } catch (error) {
      this.emit('integration_error', { agencyId, platform: config.platform, error })
      throw error
    }
  }

  // Salvar configuração da integração
  private async saveIntegrationConfig(agencyId: string, config: PaymentConfig) {
    const { data, error } = await this.supabase
      .from('payment_integrations')
      .upsert({
        agency_id: agencyId,
        platform: config.platform,
        name: `${config.platform.charAt(0).toUpperCase() + config.platform.slice(1)} Integration`,
        api_key_encrypted: this.encryptKey(config.apiKey),
        secret_key_encrypted: this.encryptKey(config.secretKey),
        webhook_secret_encrypted: config.webhookSecret ? this.encryptKey(config.webhookSecret) : null,
        sandbox_mode: config.sandboxMode || false,
        supported_currencies: config.supportedCurrencies || ['BRL', 'USD'],
        config: config.config || {},
        is_active: true,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return data
  }

  // Criar produto
  async createProduct(agencyId: string, platform: string, product: PaymentProduct): Promise<PaymentResult> {
    try {
      const integrationKey = `${agencyId}_${platform}`
      const integration = this.integrations.get(integrationKey)
      
      if (!integration) {
        throw new Error(`Integração ${platform} não encontrada para agência ${agencyId}`)
      }

      let result: PaymentResult
      
      switch (platform) {
        case 'stripe':
          result = await this.createStripeProduct(integration.client, product)
          break
        case 'paypal':
          result = await this.createPayPalProduct(integration.config, product)
          break
        default:
          throw new Error(`Criação de produto não implementada para ${platform}`)
      }

      if (result.success) {
        // Salvar produto no banco
        await this.saveProduct(agencyId, platform, product, result.data)
        this.emit('product_created', { agencyId, platform, product, result })
      }

      return result
      
    } catch (error) {
      this.emit('product_creation_error', { agencyId, platform, product, error })
      return { success: false, error: error.message }
    }
  }

  // Criar produto no Stripe
  private async createStripeProduct(stripe: Stripe, product: PaymentProduct): Promise<PaymentResult> {
    try {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: product.metadata || {}
      })

      const priceData: any = {
        unit_amount: Math.round(product.price * 100), // Stripe usa centavos
        currency: product.currency.toLowerCase(),
        product: stripeProduct.id,
        metadata: product.metadata || {}
      }

      if (product.isSubscription) {
        priceData.recurring = {
          interval: product.billingInterval || 'month'
        }
      }

      const price = await stripe.prices.create(priceData)

      return {
        success: true,
        data: {
          productId: stripeProduct.id,
          priceId: price.id,
          product: stripeProduct,
          price: price
        }
      }
      
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Criar produto no PayPal
  private async createPayPalProduct(config: any, product: PaymentProduct): Promise<PaymentResult> {
    // Implementar lógica do PayPal
    return { success: true, data: { productId: 'paypal_product_id' } }
  }

  // Salvar produto no banco
  private async saveProduct(agencyId: string, platform: string, product: PaymentProduct, externalData: any) {
    const { data, error } = await this.supabase
      .from('payment_products')
      .insert({
        agency_id: agencyId,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        is_subscription: product.isSubscription || false,
        billing_interval: product.billingInterval,
        trial_period_days: product.trialPeriodDays || 0,
        stripe_product_id: platform === 'stripe' ? externalData.productId : null,
        stripe_price_id: platform === 'stripe' ? externalData.priceId : null,
        paypal_product_id: platform === 'paypal' ? externalData.productId : null,
        metadata: product.metadata || {},
        is_active: true
      })

    if (error) throw error
    return data
  }

  // Criar sessão de checkout
  async createCheckoutSession(agencyId: string, platform: string, options: {
    productId: string
    successUrl: string
    cancelUrl: string
    customerEmail?: string
    customerName?: string
    metadata?: Record<string, any>
  }): Promise<PaymentResult> {
    try {
      const integrationKey = `${agencyId}_${platform}`
      const integration = this.integrations.get(integrationKey)
      
      if (!integration) {
        throw new Error(`Integração ${platform} não encontrada`)
      }

      let result: PaymentResult
      
      switch (platform) {
        case 'stripe':
          result = await this.createStripeCheckout(integration.client, options)
          break
        case 'paypal':
          result = await this.createPayPalCheckout(integration.config, options)
          break
        default:
          throw new Error(`Checkout não implementado para ${platform}`)
      }

      if (result.success) {
        // Salvar payment intent no banco
        await this.savePaymentIntent(agencyId, platform, options, result)
        this.emit('checkout_created', { agencyId, platform, options, result })
      }

      return result
      
    } catch (error) {
      this.emit('checkout_error', { agencyId, platform, options, error })
      return { success: false, error: error.message }
    }
  }

  // Criar checkout no Stripe
  private async createStripeCheckout(stripe: Stripe, options: any): Promise<PaymentResult> {
    try {
      // Buscar produto no banco para obter price_id
      const { data: product } = await this.supabase
        .from('payment_products')
        .select('stripe_price_id, price, currency')
        .eq('id', options.productId)
        .single()

      if (!product || !product.stripe_price_id) {
        throw new Error('Produto não encontrado ou sem price_id do Stripe')
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: product.stripe_price_id,
          quantity: 1
        }],
        mode: 'payment',
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        customer_email: options.customerEmail,
        metadata: options.metadata || {}
      })

      return {
        success: true,
        paymentId: session.id,
        checkoutUrl: session.url,
        data: session
      }
      
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Criar checkout no PayPal
  private async createPayPalCheckout(config: any, options: any): Promise<PaymentResult> {
    // Implementar lógica do PayPal
    return {
      success: true,
      paymentId: 'paypal_payment_id',
      checkoutUrl: 'https://paypal.com/checkout'
    }
  }

  // Salvar payment intent
  private async savePaymentIntent(agencyId: string, platform: string, options: any, result: PaymentResult) {
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        agency_id: agencyId,
        product_id: options.productId,
        external_id: result.paymentId,
        session_id: result.paymentId,
        customer_email: options.customerEmail,
        customer_name: options.customerName,
        amount: 0, // Será atualizado pelo webhook
        currency: 'BRL',
        status: 'pending',
        platform: platform,
        checkout_url: result.checkoutUrl,
        metadata: options.metadata || {}
      })

    if (error) throw error
    return data
  }

  // Processar webhook
  async processWebhook(platform: string, signature: string, payload: any, headers: any): Promise<boolean> {
    try {
      const processor = this.webhookProcessors.get(platform)
      if (!processor) {
        throw new Error(`Processador de webhook não encontrado para ${platform}`)
      }

      const event = await processor(signature, payload, headers)
      if (!event) return false

      // Salvar evento no banco
      await this.saveWebhookEvent(event)
      
      // Processar evento específico
      await this.handleWebhookEvent(event)
      
      this.emit('webhook_processed', { platform, event })
      return true
      
    } catch (error) {
      this.emit('webhook_error', { platform, error, payload })
      throw error
    }
  }

  // Configurar processadores de webhook
  private setupWebhookProcessors() {
    // Stripe webhook processor
    this.webhookProcessors.set('stripe', async (signature: string, payload: any, headers: any) => {
      // Implementar verificação de assinatura do Stripe
      return {
        id: payload.id,
        type: payload.type,
        data: payload.data,
        platform: 'stripe',
        signature,
        timestamp: Date.now()
      }
    })

    // PayPal webhook processor
    this.webhookProcessors.set('paypal', async (signature: string, payload: any, headers: any) => {
      // Implementar verificação de assinatura do PayPal
      return {
        id: payload.id,
        type: payload.event_type,
        data: payload,
        platform: 'paypal',
        signature,
        timestamp: Date.now()
      }
    })
  }

  // Salvar evento de webhook
  private async saveWebhookEvent(event: WebhookEvent) {
    const { data, error } = await this.supabase
      .from('payment_webhook_events')
      .insert({
        external_event_id: event.id,
        event_type: this.mapEventType(event.type),
        platform: event.platform,
        payload: event.data,
        headers: { signature: event.signature },
        processed: false,
        processing_attempts: 0
      })

    if (error) throw error
    return data
  }

  // Mapear tipos de evento
  private mapEventType(eventType: string): string {
    const eventMap: Record<string, string> = {
      'payment_intent.succeeded': 'payment_succeeded',
      'payment_intent.payment_failed': 'payment_failed',
      'checkout.session.completed': 'payment_succeeded',
      'invoice.payment_succeeded': 'payment_succeeded',
      'customer.subscription.created': 'subscription_created',
      'customer.subscription.updated': 'subscription_updated',
      'customer.subscription.deleted': 'subscription_canceled'
    }
    
    return eventMap[eventType] || 'unknown'
  }

  // Lidar com eventos específicos
  private async handleWebhookEvent(event: WebhookEvent) {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'checkout.session.completed':
        await this.handlePaymentSuccess(event)
        break
        
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event)
        break
        
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event)
        break
        
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event)
        break
        
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event)
        break
    }
  }

  // Lidar com pagamento bem-sucedido
  private async handlePaymentSuccess(event: WebhookEvent) {
    const { data, error } = await this.supabase
      .from('payments')
      .update({
        status: 'succeeded',
        paid_at: new Date().toISOString(),
        webhook_data: event.data,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', event.data.object.id)

    if (error) throw error
    
    this.emit('payment_succeeded', { event, payment: data })
  }

  // Lidar com falha de pagamento
  private async handlePaymentFailure(event: WebhookEvent) {
    const { data, error } = await this.supabase
      .from('payments')
      .update({
        status: 'failed',
        webhook_data: event.data,
        updated_at: new Date().toISOString()
      })
      .eq('external_id', event.data.object.id)

    if (error) throw error
    
    this.emit('payment_failed', { event, payment: data })
  }

  // Lidar com criação de assinatura
  private async handleSubscriptionCreated(event: WebhookEvent) {
    const subscription = event.data.object
    
    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({
        external_id: subscription.id,
        customer_id: subscription.customer,
        customer_email: subscription.customer_email,
        status: subscription.status,
        platform: event.platform,
        amount: subscription.items.data[0].price.unit_amount / 100,
        currency: subscription.currency,
        billing_interval: subscription.items.data[0].price.recurring.interval,
        started_at: new Date(subscription.start_date * 1000).toISOString(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        metadata: subscription.metadata
      })

    if (error) throw error
    
    this.emit('subscription_created', { event, subscription: data })
  }

  // Lidar com atualização de assinatura
  private async handleSubscriptionUpdated(event: WebhookEvent) {
    const subscription = event.data.object
    
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('external_id', subscription.id)

    if (error) throw error
    
    this.emit('subscription_updated', { event, subscription: data })
  }

  // Lidar com cancelamento de assinatura
  private async handleSubscriptionCanceled(event: WebhookEvent) {
    const subscription = event.data.object
    
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('external_id', subscription.id)

    if (error) throw error
    
    this.emit('subscription_canceled', { event, subscription: data })
  }

  // Gerar relatório de pagamentos
  async generatePaymentReport(agencyId: string, options: {
    startDate: Date
    endDate: Date
    platform?: string
    groupBy?: 'day' | 'week' | 'month'
    includeRefunds?: boolean
  }) {
    let query = this.supabase
      .from('payments')
      .select(`
        *,
        payment_products(name, category),
        payment_integrations(platform, name)
      `)
      .eq('agency_id', agencyId)
      .gte('created_at', options.startDate.toISOString())
      .lte('created_at', options.endDate.toISOString())

    if (options.platform) {
      query = query.eq('platform', options.platform)
    }

    const { data: payments, error } = await query

    if (error) throw error

    // Calcular estatísticas
    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      successfulPayments: payments.filter(p => p.status === 'succeeded').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      avgPaymentAmount: payments.length > 0 ? payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length : 0,
      byPlatform: this.groupBy(payments, 'platform'),
      byStatus: this.groupBy(payments, 'status')
    }

    return {
      payments,
      stats,
      period: {
        startDate: options.startDate,
        endDate: options.endDate
      }
    }
  }

  // Agrupar dados
  private groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown'
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {})
  }

  // Criptografar chave (implementação básica)
  private encryptKey(key: string): string {
    // Implementar criptografia real aqui
    return Buffer.from(key).toString('base64')
  }

  // Descriptografar chave
  private decryptKey(encryptedKey: string): string {
    // Implementar descriptografia real aqui
    return Buffer.from(encryptedKey, 'base64').toString()
  }
}

// Instância global
let paymentEngine: PaymentIntegrationEngine

export function getPaymentEngine(): PaymentIntegrationEngine {
  if (!paymentEngine) {
    paymentEngine = new PaymentIntegrationEngine()
  }
  return paymentEngine
}

// Funções utilitárias para usar nos API routes
export async function initializePaymentIntegration(agencyId: string, config: PaymentConfig) {
  const engine = getPaymentEngine()
  return await engine.initializeIntegration(agencyId, config)
}

export async function createPaymentProduct(agencyId: string, platform: string, product: PaymentProduct) {
  const engine = getPaymentEngine()
  return await engine.createProduct(agencyId, platform, product)
}

export async function createPaymentCheckout(agencyId: string, platform: string, options: any) {
  const engine = getPaymentEngine()
  return await engine.createCheckoutSession(agencyId, platform, options)
}

export async function processPaymentWebhook(platform: string, signature: string, payload: any, headers: any) {
  const engine = getPaymentEngine()
  return await engine.processWebhook(platform, signature, payload, headers)
}