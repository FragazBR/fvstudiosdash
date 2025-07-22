import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Checkout completed:', session.id)
  
  try {
    const leadId = session.metadata?.lead_id
    const planName = session.metadata?.plan_name
    
    if (!leadId) {
      console.error('Lead ID not found in session metadata')
      return
    }

    // Buscar o lead no banco
    const { data: lead, error: leadError } = await supabase
      .from('agency_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Lead not found:', leadError)
      return
    }

    // Atualizar lead como convertido
    await supabase
      .from('agency_leads')
      .update({
        status: 'converted',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        converted_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    // Criar agência usando a função existente
    const { error: agencyError } = await supabase.rpc('create_agency_after_payment', {
      p_lead_id: leadId,
      p_stripe_customer_id: session.customer as string,
      p_stripe_subscription_id: session.subscription as string,
      p_plan_name: planName || 'Agency Basic'
    })

    if (agencyError) {
      console.error('Error creating agency:', agencyError)
      return
    }

    console.log('✅ Agency created successfully for lead:', leadId)

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('📅 Subscription created:', subscription.id)
  
  // Atualizar status da subscription no banco
  await supabase
    .from('agency_subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)
  
  await supabase
    .from('agency_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('❌ Subscription canceled:', subscription.id)
  
  await supabase
    .from('agency_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('✅ Payment succeeded:', invoice.id)
  
  // Salvar fatura no banco
  await supabase.from('invoices').insert({
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    amount: invoice.amount_paid / 100, // Converter de centavos para reais
    currency: invoice.currency,
    status: 'paid',
    invoice_date: new Date(invoice.created * 1000).toISOString(),
    paid_at: new Date().toISOString(),
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Payment failed:', invoice.id)
  
  // Marcar subscription como com problema de pagamento
  if ((invoice as any).subscription) {
    await supabase
      .from('agency_subscriptions')
      .update({
        status: 'past_due'
      })
      .eq('stripe_subscription_id', (invoice as any).subscription as string)
  }
}