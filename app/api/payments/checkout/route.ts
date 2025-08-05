import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { createPaymentCheckout } from '@/lib/payment-integration-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const body = await request.json()
    
    const {
      agency_id,
      product_id,
      platform,
      customer_email,
      customer_name,
      customer_phone,
      success_url,
      cancel_url,
      metadata = {}
    } = body

    // Validação básica
    if (!agency_id || !product_id || !platform || !success_url || !cancel_url) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: agency_id, product_id, platform, success_url, cancel_url' 
      }, { status: 400 })
    }

    // Buscar produto
    const { data: product, error: productError } = await supabase
      .from('payment_products')
      .select(`
        *,
        payment_integrations(
          id,
          platform,
          is_active,
          test_mode
        )
      `)
      .eq('id', product_id)
      .eq('agency_id', agency_id)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado ou inativo' }, { status: 404 })
    }

    // Verificar se a integração existe e está ativa
    const integration = product.payment_integrations
    if (!integration || !integration.is_active || integration.platform !== platform) {
      return NextResponse.json({ 
        error: 'Integração de pagamento não encontrada ou inativa' 
      }, { status: 400 })
    }

    // Verificar estoque se necessário
    if (product.track_inventory && product.stock_quantity !== null && product.stock_quantity <= 0) {
      return NextResponse.json({ error: 'Produto fora de estoque' }, { status: 409 })
    }

    // Criar checkout
    const checkoutOptions = {
      productId: product_id,
      successUrl: success_url,
      cancelUrl: cancel_url,
      customerEmail: customer_email,
      customerName: customer_name,
      metadata: {
        ...metadata,
        agency_id,
        customer_phone
      }
    }

    const result = await createPaymentCheckout(agency_id, platform, checkoutOptions)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Falha ao criar checkout' 
      }, { status: 500 })
    }

    // Registrar tentativa de checkout para analytics
    await supabase
      .from('payment_transaction_logs')
      .insert({
        agency_id,
        integration_id: integration.id,
        action: 'checkout_created',
        status: 'success',
        amount: product.price,
        currency: product.currency,
        request_data: {
          product_id,
          customer_email,
          customer_name,
          platform
        },
        response_data: {
          checkout_url: result.checkoutUrl,
          payment_id: result.paymentId
        },
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent')
      })

    // Atualizar estoque se necessário
    if (product.track_inventory && product.stock_quantity !== null) {
      await supabase
        .from('payment_products')
        .update({
          stock_quantity: product.stock_quantity - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id)
    }

    return NextResponse.json({
      checkout_url: result.checkoutUrl,
      payment_id: result.paymentId,
      expires_in: 1800, // 30 minutos
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency
      },
      test_mode: integration.test_mode
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar checkout:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Endpoint para buscar status do checkout
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const url = new URL(request.url)
    const paymentId = url.searchParams.get('payment_id')
    const agencyId = url.searchParams.get('agency_id')

    if (!paymentId || !agencyId) {
      return NextResponse.json({ 
        error: 'payment_id e agency_id são obrigatórios' 
      }, { status: 400 })
    }

    // Buscar pagamento
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_products(
          name,
          price,
          currency
        ),
        payment_integrations(
          platform,
          test_mode
        )
      `)
      .eq('external_id', paymentId)
      .eq('agency_id', agencyId)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      payment: {
        id: payment.external_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        customer_email: payment.customer_email,
        customer_name: payment.customer_name,
        created_at: payment.created_at,
        paid_at: payment.paid_at,
        expires_at: payment.expires_at,
        checkout_url: payment.checkout_url,
        receipt_url: payment.receipt_url,
        product: payment.payment_products,
        platform: payment.payment_integrations?.platform,
        test_mode: payment.payment_integrations?.test_mode
      }
    })

  } catch (error) {
    console.error('Erro ao buscar status do checkout:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}