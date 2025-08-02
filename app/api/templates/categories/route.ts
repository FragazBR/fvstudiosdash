import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('template_type')

    // Buscar categorias únicas dos templates
    let query = supabase
      .from('advanced_templates')
      .select('category')
      .not('category', 'is', null)

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      )
    }

    // Extrair categorias únicas
    const categories = [...new Set(templates?.map(t => t.category).filter(Boolean))]
      .sort()
      .map(category => ({
        name: category,
        count: templates?.filter(t => t.category === category).length || 0
      }))

    // Adicionar categorias padrão se não existirem
    const defaultCategories = [
      'Onboarding',
      'Marketing',
      'Transacional',
      'Relatórios',
      'Projetos',
      'Comercial',
      'Suporte',
      'Interno'
    ]

    defaultCategories.forEach(defaultCategory => {
      if (!categories.find(c => c.name === defaultCategory)) {
        categories.push({
          name: defaultCategory,
          count: 0
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: categories.sort((a, b) => a.name.localeCompare(b.name))
    })

  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}