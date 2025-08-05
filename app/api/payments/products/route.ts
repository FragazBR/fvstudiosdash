import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { createPaymentProduct } from '@/lib/payment-integration-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const agencyId = url.searchParams.get('agency_id')
    const category = url.searchParams.get('category')
    const isActive = url.searchParams.get('is_active')
    const isSubscription = url.searchParams.get('is_subscription')

    if (!agencyId) {
      return NextResponse.json({ error: 'agency_id é obrigatório' }, { status: 400 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', agencyId)
      .single()

    if (!permissions) {
      return NextResponse.json({ error: 'Sem permissão para esta agência' }, { status: 403 })
    }

    // Construir query
    let query = supabase
      .from('payment_products')
      .select(`
        *,
        payment_integrations(id, name, platform, is_active)
      `)
      .eq('agency_id', agencyId)

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (isSubscription !== null) {
      query = query.eq('is_subscription', isSubscription === 'true')
    }

    const { data: products, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Calcular estatísticas por produto
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const { data: stats } = await supabase
          .from('payments')
          .select('status, amount')
          .eq('product_id', product.id)

        const totalSales = stats?.filter(s => s.status === 'succeeded').length || 0
        const totalRevenue = stats?.filter(s => s.status === 'succeeded').reduce((sum, s) => sum + (s.amount || 0), 0) || 0

        return {
          ...product,
          stats: {
            total_sales: totalSales,
            total_revenue: totalRevenue,
            conversion_rate: stats && stats.length > 0 ? (totalSales / stats.length) * 100 : 0
          }
        }
      })
    )

    return NextResponse.json({
      products: productsWithStats,
      total: products.length
    })

  } catch (error) {
    console.error('Erro no endpoint de produtos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      agency_id,
      integration_id,
      name,
      description,
      price,
      currency = 'BRL',
      category,
      sku,
      is_subscription = false,
      billing_interval,
      billing_interval_count = 1,
      trial_period_days = 0,
      image_url,
      product_url,
      track_inventory = false,
      stock_quantity,
      metadata = {}
    } = body

    // Validação
    if (!agency_id || !name || !price || price <= 0) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: agency_id, name, price (maior que 0)' 
      }, { status: 400 })
    }

    if (is_subscription && !billing_interval) {
      return NextResponse.json({ 
        error: 'billing_interval é obrigatório para produtos de assinatura' 
      }, { status: 400 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', agency_id)
      .single()

    if (!permissions || (permissions.role !== 'admin' && permissions.permissions?.manage_payments !== 'true')) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar pagamentos' }, { status: 403 })
    }

    // Verificar se SKU já existe (se fornecido)
    if (sku) {
      const { data: existingProduct } = await supabase
        .from('payment_products')
        .select('id')
        .eq('agency_id', agency_id)
        .eq('sku', sku)
        .single()

      if (existingProduct) {
        return NextResponse.json({ 
          error: 'SKU já existe para esta agência' 
        }, { status: 409 })
      }
    }

    // Buscar dados da integração se fornecida
    let integration = null
    if (integration_id) {
      const { data: integrationData, error: integrationError } = await supabase
        .from('payment_integrations')
        .select('platform, is_active')
        .eq('id', integration_id)
        .eq('agency_id', agency_id)
        .single()

      if (integrationError || !integrationData) {
        return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 })
      }

      if (!integrationData.is_active) {
        return NextResponse.json({ error: 'Integração não está ativa' }, { status: 400 })
      }

      integration = integrationData
    }

    // Criar produto no banco primeiro
    const { data: newProduct, error: insertError } = await supabase
      .from('payment_products')
      .insert({
        agency_id,
        integration_id,
        name,
        description,
        price,
        currency,
        category,
        sku,
        is_subscription,
        billing_interval: is_subscription ? billing_interval : null,
        billing_interval_count: is_subscription ? billing_interval_count : 1,
        trial_period_days: is_subscription ? trial_period_days : 0,
        image_url,
        product_url,
        track_inventory,
        stock_quantity: track_inventory ? stock_quantity : null,
        metadata,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir produto:', insertError)
      return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
    }

    // Se há integração, criar produto na plataforma externa
    if (integration) {
      try {
        const productData = {
          id: newProduct.id,
          name,
          description,
          price,
          currency,
          isSubscription: is_subscription,
          billingInterval: billing_interval,
          trialPeriodDays: trial_period_days,
          metadata
        }

        const result = await createPaymentProduct(agency_id, integration.platform, productData)
        
        if (result.success && result.data) {
          // Atualizar produto com IDs externos
          const updateData: any = {}
          
          if (integration.platform === 'stripe') {
            updateData.stripe_product_id = result.data.productId
            updateData.stripe_price_id = result.data.priceId
          } else if (integration.platform === 'paypal') {
            updateData.paypal_product_id = result.data.productId
          }

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from('payment_products')
              .update(updateData)
              .eq('id', newProduct.id)
          }
        }
      } catch (externalError) {
        console.error('Erro ao criar produto na plataforma externa:', externalError)
        // Produto já foi criado no banco, mas falhou na plataforma externa
        // Não falhar a requisição, mas logar o erro
      }
    }

    return NextResponse.json({
      product: newProduct,
      message: 'Produto criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 })
    }

    // Buscar produto existente
    const { data: product, error: fetchError } = await supabase
      .from('payment_products')
      .select('agency_id, sku')
      .eq('id', id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', product.agency_id)
      .single()

    if (!permissions || (permissions.role !== 'admin' && permissions.permissions?.manage_payments !== 'true')) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar pagamentos' }, { status: 403 })
    }

    // Verificar conflito de SKU se está sendo alterado
    if (updateData.sku && updateData.sku !== product.sku) {
      const { data: existingProduct } = await supabase
        .from('payment_products')
        .select('id')
        .eq('agency_id', product.agency_id)
        .eq('sku', updateData.sku)
        .neq('id', id)
        .single()

      if (existingProduct) {
        return NextResponse.json({ 
          error: 'SKU já existe para outro produto desta agência' 
        }, { status: 409 })
      }
    }

    // Atualizar produto
    const { data: updatedProduct, error: updateError } = await supabase
      .from('payment_products')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar produto:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
    }

    return NextResponse.json({
      product: updatedProduct,
      message: 'Produto atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 })
    }

    // Buscar produto existente
    const { data: product, error: fetchError } = await supabase
      .from('payment_products')
      .select('agency_id, name')
      .eq('id', id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', product.agency_id)
      .single()

    if (!permissions || (permissions.role !== 'admin' && permissions.permissions?.manage_payments !== 'true')) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar pagamentos' }, { status: 403 })
    }

    // Verificar se há pagamentos para este produto
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('product_id', id)
      .limit(1)

    if (paymentsError) {
      console.error('Erro ao verificar pagamentos:', paymentsError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    if (payments && payments.length > 0) {
      // Se há pagamentos, apenas desativar o produto
      const { data: deactivatedProduct, error: deactivateError } = await supabase
        .from('payment_products')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (deactivateError) {
        console.error('Erro ao desativar produto:', deactivateError)
        return NextResponse.json({ error: 'Erro ao desativar produto' }, { status: 500 })
      }

      return NextResponse.json({
        product: deactivatedProduct,
        message: 'Produto desativado com sucesso (não pode ser excluído pois possui pagamentos)'
      })
    }

    // Se não há pagamentos, excluir produto
    const { error: deleteError } = await supabase
      .from('payment_products')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir produto:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Produto ${product.name} excluído com sucesso`
    })

  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}