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
    const daysBack = parseInt(searchParams.get('days_back') || '30');

    // Usar função de estatísticas do PostgreSQL
    const { data: stats, error } = await supabase
      .rpc('get_cms_stats', {
        p_agency_id: profile.agency_id,
        p_days_back: daysBack
      });

    if (error) {
      console.error('Erro ao obter estatísticas:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    const statsData = stats[0] || {};

    // Obter estatísticas adicionais
    const { data: recentContents } = await supabase
      .from('cms_contents')
      .select(`
        id,
        title,
        status,
        created_at,
        cms_content_types(name, icon)
      `)
      .eq('agency_id', profile.agency_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Obter conteúdos mais visualizados
    const { data: popularContents } = await supabase
      .from('cms_contents')
      .select(`
        id,
        title,
        view_count,
        created_at,
        cms_content_types(name, icon)
      `)
      .eq('agency_id', profile.agency_id)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(5);

    // Estatísticas por status
    const { data: statusStats } = await supabase
      .from('cms_contents')
      .select('status')
      .eq('agency_id', profile.agency_id)
      .neq('status', 'deleted');

    const statusCounts = statusStats?.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Atividade mensal
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: dailyActivity } = await supabase
      .from('cms_contents')
      .select('created_at, status')
      .eq('agency_id', profile.agency_id)
      .gte('created_at', startDate.toISOString());

    // Processar atividade diária
    const dailyStats = dailyActivity?.reduce((acc: any, item: any) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, created: 0, published: 0 };
      }
      acc[date].created++;
      if (item.status === 'published') {
        acc[date].published++;
      }
      return acc;
    }, {}) || {};

    const dailyStatsArray = Object.values(dailyStats)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_contents: statsData.total_contents || 0,
          published_contents: statsData.published_contents || 0,
          draft_contents: statsData.draft_contents || 0,
          total_categories: statsData.total_categories || 0,
          total_tags: statsData.total_tags || 0,
          total_views: statsData.total_views || 0,
          recent_contents: statsData.recent_contents || 0
        },
        by_type: statsData.content_by_type || [],
        by_status: statusCounts,
        recent_contents: recentContents || [],
        popular_contents: popularContents || [],
        daily_activity: dailyStatsArray,
        period: {
          days_back: daysBack,
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Erro na API de estatísticas:', error);
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
    const { action, content_id, metric } = body;

    if (action === 'increment_view') {
      // Incrementar contador de visualizações
      const { error } = await supabase
        .from('cms_contents')
        .update({ view_count: supabase.sql`view_count + 1` })
        .eq('id', content_id)
        .eq('agency_id', profile.agency_id);

      if (error) {
        console.error('Erro ao incrementar visualizações:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Visualização registrada'
      });

    } else if (action === 'increment_like') {
      // Incrementar contador de likes
      const { error } = await supabase
        .from('cms_contents')
        .update({ like_count: supabase.sql`like_count + 1` })
        .eq('id', content_id)
        .eq('agency_id', profile.agency_id);

      if (error) {
        console.error('Erro ao incrementar likes:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Like registrado'
      });

    } else if (action === 'increment_share') {
      // Incrementar contador de compartilhamentos
      const { error } = await supabase
        .from('cms_contents')
        .update({ share_count: supabase.sql`share_count + 1` })
        .eq('id', content_id)
        .eq('agency_id', profile.agency_id);

      if (error) {
        console.error('Erro ao incrementar compartilhamentos:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Compartilhamento registrado'
      });

    } else if (action === 'custom_metric') {
      // Registrar métrica customizada (pode ser expandido no futuro)
      return NextResponse.json({
        success: true,
        message: 'Métrica customizada registrada'
      });
    }

    return NextResponse.json({
      error: 'Ação não reconhecida'
    }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de estatísticas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}