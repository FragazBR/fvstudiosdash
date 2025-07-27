import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Parâmetros de consulta
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir query
    let query = supabase
      .from('cms_tags')
      .select(`
        id,
        name,
        slug,
        description,
        color,
        usage_count,
        created_at,
        updated_at
      `)
      .eq('agency_id', profile.agency_id);

    // Aplicar filtro de busca
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: tags, error } = await query
      .order('usage_count', { ascending: false })
      .order('name')
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar tags:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: tags
    });

  } catch (error) {
    console.error('Erro na API de tags:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'agency_owner', 'agency_manager', 'agency_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      color
    } = body;

    // Validações básicas
    if (!name) {
      return NextResponse.json({ 
        error: 'Nome é obrigatório' 
      }, { status: 400 });
    }

    // Gerar slug se não fornecido
    const finalSlug = slug || name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Verificar se slug já existe
    const { data: existingTag } = await supabase
      .from('cms_tags')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('slug', finalSlug)
      .single();

    if (existingTag) {
      return NextResponse.json({ 
        error: 'Já existe uma tag com este slug' 
      }, { status: 409 });
    }

    // Criar tag
    const { data: tag, error } = await supabase
      .from('cms_tags')
      .insert({
        agency_id: profile.agency_id,
        name,
        slug: finalSlug,
        description,
        color,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar tag:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: tag
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de tags:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}