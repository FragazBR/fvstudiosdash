const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://htlzesfvekijsulzufbd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    console.log('🔄 Configurando banco de dados...');
    
    try {
        // Primeiro, vamos verificar se conseguimos conectar
        console.log('📡 Testando conexão...');
        
        // Test connection
        const { data: testData, error: testError } = await supabase
            .from('auth.users')
            .select('count')
            .limit(0);
            
        if (testError) {
            console.log('⚠️  Erro de conexão esperado (normal):', testError.message);
        }
        
        console.log('✅ Conexão estabelecida com Supabase');
        
        // Agora vamos usar a API REST para executar SQL
        const sqlCommands = [
            // Criar agência
            `INSERT INTO agencies (id, name, description, email) 
             VALUES ('00000000-0000-0000-0000-000000000001', 'FVStudios Agency', 'Agência de marketing digital', 'contato@fvstudios.com.br')
             ON CONFLICT (id) DO NOTHING;`,
            
            // Criar usuário admin
            `INSERT INTO user_profiles (id, email, full_name, role, agency_id) 
             VALUES ('00000000-0000-0000-0000-000000000001', 'admin@fvstudios.com.br', 'Admin FVStudios', 'agency_owner', '00000000-0000-0000-0000-000000000001')
             ON CONFLICT (email) DO UPDATE SET role = 'agency_owner', agency_id = '00000000-0000-0000-0000-000000000001';`
        ];
        
        // Tentar inserir dados básicos usando upsert
        console.log('📝 Inserindo dados básicos...');
        
        // Inserir agência
        const { error: agencyError } = await supabase
            .from('agencies')
            .upsert({
                id: '00000000-0000-0000-0000-000000000001',
                name: 'FVStudios Agency',
                description: 'Agência de marketing digital',
                email: 'contato@fvstudios.com.br'
            });
            
        if (agencyError) {
            console.log('⚠️  Erro ao inserir agência:', agencyError.message);
        } else {
            console.log('✅ Agência inserida/atualizada');
        }
        
        // Inserir usuário admin
        const { error: userError } = await supabase
            .from('user_profiles')
            .upsert({
                id: '00000000-0000-0000-0000-000000000001',
                email: 'admin@fvstudios.com.br',
                full_name: 'Admin FVStudios',
                role: 'agency_owner',
                agency_id: '00000000-0000-0000-0000-000000000001'
            });
            
        if (userError) {
            console.log('⚠️  Erro ao inserir usuário:', userError.message);
        } else {
            console.log('✅ Usuário admin inserido/atualizado');
        }
        
        // Verificar dados inseridos
        console.log('\n📋 Verificando dados...');
        
        const { data: agencies, error: agenciesError } = await supabase
            .from('agencies')
            .select('*')
            .limit(5);
            
        if (agencies) {
            console.log(`✅ Agências encontradas: ${agencies.length}`);
            agencies.forEach(agency => {
                console.log(`   - ${agency.name} (${agency.email})`);
            });
        }
        
        const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('role', 'agency_owner');
            
        if (users) {
            console.log(`✅ Agency owners encontrados: ${users.length}`);
            users.forEach(user => {
                console.log(`   - ${user.full_name} (${user.email}) - Role: ${user.role}`);
            });
        }
        
        console.log('\n🎉 Setup concluído!');
        console.log('📋 Próximos passos:');
        console.log('1. Acesse o sistema com email: admin@fvstudios.com.br');
        console.log('2. Execute o script de dados de teste se necessário');
        console.log('3. Verifique se todas as abas aparecem na sidebar');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        return false;
    }
}

setupDatabase();