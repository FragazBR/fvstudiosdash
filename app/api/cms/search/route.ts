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
    const query = searchParams.get('q') || '';
    const contentTypeId = searchParams.get('content_type_id');
    const categoryId = searchParams.get('category_id');
    const tagId = searchParams.get('tag_id');
    const status = searchParams.get('status') || 'published';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validação básica
    if (!query.trim()) {
      return NextResponse.json({ 
        error: 'Termo de busca é obrigatório' 
      }, { status: 400 });
    }

    // Usar a função de busca do PostgreSQL
    const { data: results, error } = await supabase
      .rpc('search_cms_content', {
        p_agency_id: profile.agency_id,
        p_query: query,
        p_content_type_id: contentTypeId || null,
        p_category_id: categoryId || null,
        p_tag_id: tagId || null,
        p_status: status as any,
        p_limit: limit,
        p_offset: offset
      });

    if (error) {
      console.error('Erro na busca:', error);
      return NextResponse.json({ error: 'Erro ao realizar busca' }, { status: 500 });
    }

    // Contar total de resultados
    const { data: countResults, error: countError } = await supabase
      .rpc('search_cms_content', {
        p_agency_id: profile.agency_id,
        p_query: query,
        p_content_type_id: contentTypeId || null,
        p_category_id: categoryId || null,
        p_tag_id: tagId || null,
        p_status: status as any,
        p_limit: 999999,
        p_offset: 0
      });

    const totalResults = countResults?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        results: results || [],
        pagination: {
          total: totalResults,
          limit,
          offset,
          hasMore: totalResults > offset + limit
        },
        query: {
          term: query,
          content_type_id: contentTypeId,
          category_id: categoryId,
          tag_id: tagId,
          status
        }
      }
    });

  } catch (error) {
    console.error('Erro na API de busca:', error);
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

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      query,
      filters = {},
      sort = { field: 'search_rank', direction: 'desc' },
      pagination = { limit: 20, offset: 0 }
    } = body;

    // Validação básica
    if (!query || !query.trim()) {
      return NextResponse.json({ 
        error: 'Termo de busca é obrigatório' 
      }, { status: 400 });
    }

    // Usar a função de busca avançada
    const { data: results, error } = await supabase
      .rpc('search_cms_content', {
        p_agency_id: profile.agency_id,
        p_query: query.trim(),
        p_content_type_id: filters.content_type_id || null,
        p_category_id: filters.category_id || null,
        p_tag_id: filters.tag_id || null,
        p_status: filters.status || 'published',
        p_limit: pagination.limit,
        p_offset: pagination.offset
      });

    if (error) {
      console.error('Erro na busca avançada:', error);
      return NextResponse.json({ error: 'Erro ao realizar busca' }, { status: 500 });
    }

    // Aplicar ordenação customizada se necessário
    let sortedResults = results || [];
    if (sort.field !== 'search_rank') {
      sortedResults.sort((a: any, b: any) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        
        if (sort.direction === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });
    }

    // Estatísticas da busca
    const totalResults = sortedResults.length;
    const typeStats = sortedResults.reduce((acc: any, item: any) => {
      const type = item.content_type_name;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        results: sortedResults,
        pagination: {
          total: totalResults,
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore: totalResults > pagination.offset + pagination.limit
        },
        statistics: {
          total: totalResults,
          by_type: typeStats,
          query_time: Date.now()
        },
        query: {
          term: query,
          filters,
          sort
        }
      }
    });

  } catch (error) {
    console.error('Erro na API de busca avançada:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}