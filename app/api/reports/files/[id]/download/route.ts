import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Buscar arquivo
    const { data: file, error: fileError } = await supabase
      .from('report_files')
      .select(`
        id,
        filename,
        format,
        file_path,
        file_size_bytes,
        is_password_protected,
        password_hash,
        expires_at,
        download_count,
        max_downloads,
        execution_id,
        report_executions!inner(
          report_id,
          agency_id,
          reports!inner(
            name,
            agency_id
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ 
        error: 'Arquivo não encontrado' 
      }, { status: 404 });
    }

    // Verificar se o arquivo pertence à agência do usuário
    const reportAgencyId = file.report_executions.reports.agency_id;
    if (reportAgencyId !== profile.agency_id) {
      return NextResponse.json({ 
        error: 'Acesso negado' 
      }, { status: 403 });
    }

    // Verificar se arquivo não expirou
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Arquivo expirado' 
      }, { status: 410 });
    }

    // Verificar limite de downloads
    if (file.max_downloads && file.download_count >= file.max_downloads) {
      return NextResponse.json({ 
        error: 'Limite de downloads excedido' 
      }, { status: 429 });
    }

    // Verificar se arquivo existe no sistema de arquivos
    try {
      await fs.access(file.file_path);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Arquivo não encontrado no sistema' 
      }, { status: 404 });
    }

    // Verificar senha se necessário
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (file.is_password_protected) {
      if (!password) {
        return NextResponse.json({ 
          error: 'Senha obrigatória para download',
          requires_password: true
        }, { status: 401 });
      }

      // TODO: Implementar verificação de senha com hash
      // const isValidPassword = await bcrypt.compare(password, file.password_hash);
      // if (!isValidPassword) {
      //   return NextResponse.json({ 
      //     error: 'Senha incorreta' 
      //   }, { status: 401 });
      // }
    }

    // Ler arquivo
    const fileBuffer = await fs.readFile(file.file_path);

    // Incrementar contador de downloads
    await supabase
      .from('report_files')
      .update({
        download_count: file.download_count + 1
      })
      .eq('id', params.id);

    // Determinar content-type baseado no formato
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      json: 'application/json',
      html: 'text/html'
    };

    const contentType = contentTypes[file.format] || 'application/octet-stream';

    // Retornar arquivo
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': file.file_size_bytes.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Erro no download de arquivo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}