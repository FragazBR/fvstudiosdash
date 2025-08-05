// Test script para verificar APIs de criação de usuário
// Execute este script após fazer login no admin em https://fvstudiosdash.vercel.app

const testUserCreation = async () => {
  const baseUrl = 'https://fvstudiosdash.vercel.app';
  
  // Dados de teste para criação de usuário
  const testUserData = {
    email: 'teste@exemplo.com',
    password: 'teste123',
    name: 'Usuário Teste',
    role: 'client',
    agency_id: null,
    company: 'Empresa Teste',
    phone: '(11) 99999-9999',
    send_welcome_email: false,
    create_new_agency: true,
    new_agency_name: 'Agência Teste LTDA'
  };

  try {
    console.log('🔍 Testando criação direta de usuário...');
    
    const response = await fetch(`${baseUrl}/api/admin/users/create-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Precisa estar logado no browser para ter cookies de auth
      },
      credentials: 'include',  // Incluir cookies de autenticação
      body: JSON.stringify(testUserData)
    });

    const data = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📄 Resposta:', data);
    
    if (response.ok) {
      console.log('✅ Usuário criado com sucesso!');
      console.log('👤 ID do usuário:', data.user?.id);
    } else {
      console.log('❌ Erro na criação:', data.error);
    }
    
  } catch (error) {
    console.log('💥 Erro de rede:', error.message);
  }
};

// Instruções de uso
console.log(`
📋 INSTRUÇÕES PARA TESTE:

1. Abra https://fvstudiosdash.vercel.app/admin/users no browser
2. Faça login como admin
3. Abra o Console do Desenvolvedor (F12)
4. Cole e execute este código:

${testUserCreation.toString()}

testUserCreation();

5. Verifique se a criação de usuário funciona corretamente
`);

// Para usar no Node.js (necessário instalar node-fetch)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testUserCreation };
}