import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Create checkout API called')
    const body = await req.json()
    const { priceId, email, metadata = {} } = body

    console.log('📝 Request data:', { priceId, email, metadata })

    if (!priceId || !email) {
      console.error('❌ Missing required fields:', { priceId, email })
      return NextResponse.json(
        { error: 'Price ID and email are required' },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed, creating Stripe session...')

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Removido PIX temporariamente
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/agency-signup?canceled=true`,
      customer_email: email,
      metadata: {
        ...metadata,
        lead_id: metadata.leadId || '',
        plan_name: metadata.planName || '',
      },
      subscription_data: {
        metadata: {
          ...metadata,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      currency: 'brl',
      locale: 'pt-BR',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}