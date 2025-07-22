import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { priceId, email, metadata = {} } = body

    if (!priceId || !email) {
      return NextResponse.json(
        { error: 'Price ID and email are required' },
        { status: 400 }
      )
    }

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
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
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}