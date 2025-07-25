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
    const leadId = session.metadata?.leadId
    const planName = session.metadata?.planName
    const userName = session.metadata?.userName
    const userPassword = session.metadata?.userPassword
    const companyName = session.metadata?.companyName
    const email = session.customer_details?.email
    
    console.log('📋 Session metadata:', { leadId, planName, userName, email })
    
    if (!email) {
      console.error('Email not found in session')
      return
    }

    // Buscar o lead no banco (tabela correta: website_leads)
    const { data: lead, error: leadError } = await supabase
      .from('website_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Lead not found:', leadError)
      // Continuar mesmo sem lead, usando dados da sessão
    }

    // Criar usuário no Supabase Auth
    console.log('👤 Creating user in Supabase Auth...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: userPassword || 'TempPassword123!', // Senha temporária se não fornecida
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: userName || lead?.name,
        company: companyName || lead?.company_name,
        role: 'agency_owner'
      }
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      return
    }

    console.log('✅ User created in Auth:', authUser.user?.id)

    // Criar perfil do usuário
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user?.id,
        email: email,
        name: userName || lead?.name || email,
        role: 'agency_owner',
        company: companyName || lead?.company_name,
        phone: lead?.phone,
        stripe_customer_id: session.customer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError)
    } else {
      console.log('✅ User profile created')
    }

    // Marcar lead como convertido
    if (leadId) {
      await supabase
        .from('website_leads')
        .update({ status: 'converted', updated_at: new Date().toISOString() })
        .eq('id', leadId)
    }

    console.log('✅ Checkout processing completed successfully!')

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