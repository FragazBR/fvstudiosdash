// Script para executar limpeza do sistema
// Execute este script no console do browser após fazer login como admin

console.log('🧹 Iniciando limpeza do sistema...');

async function executeSystemCleanup() {
  try {
    const response = await fetch('/api/admin/system/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Importante para incluir cookies de autenticação
      body: JSON.stringify({
        confirm: 'DELETE_ALL_USERS_EXCEPT_ADMIN'
      })
    });

    const data = await response.json();
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📄 Dados da resposta:', data);

    if (response.ok) {
      console.log('✅ Limpeza executada com sucesso!');
      console.log('📈 Resumo:');
      if (data.summary) {
        console.log(`👥 Usuários encontrados: ${data.summary.total_users_found}`);
        console.log(`🗑️ Usuários excluídos: ${data.summary.users_deleted}`);
        console.log(`⚠️ Erros: ${data.summary.errors_count}`);
        console.log(`👤 Admin mantido: ${data.summary.remaining_admin}`);
        
        if (data.summary.errors && data.summary.errors.length > 0) {
          console.log('🚨 Erros encontrados:');
          data.summary.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
          });
        }
      }
    } else {
      console.error('❌ Erro na limpeza:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('💥 Erro de rede:', error);
    return { success: false, error: error.message };
  }
}

// Executar a limpeza
executeSystemCleanup();

console.log(`
📋 INSTRUÇÕES:

1. Faça login como franco@fvstudios.com.br
2. Abra o Console do Desenvolvedor (F12)
3. Este script será executado automaticamente

Ou execute manualmente:
executeSystemCleanup();
`);