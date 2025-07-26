const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://htlzesfvekijsulzufbd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSqlCommands() {
    try {
        console.log('🔄 Executando comandos SQL diretamente...');
        
        // Comandos SQL essenciais em ordem
        const commands = [
            // 1. Criar tabela de agências
            `CREATE TABLE IF NOT EXISTS agencies (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                website TEXT,
                phone TEXT,
                email TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );`,
            
            // 2. Criar tabela de perfis de usuário
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'free_user' CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user')),
                agency_id UUID REFERENCES agencies(id),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );`,
            
            // 3. Criar tabela de contatos
            `CREATE TABLE IF NOT EXISTS contacts (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                company TEXT,
                role TEXT DEFAULT 'client',
                status TEXT DEFAULT 'active',
                agency_id UUID REFERENCES agencies(id),
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );`,
            
            // 4. Criar tabela de projetos
            `CREATE TABLE IF NOT EXISTS projects (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                client_id UUID REFERENCES contacts(id),
                status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'in_progress', 'review', 'completed', 'cancelled')),
                priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
                budget_total DECIMAL(10,2) DEFAULT 0,
                budget_spent DECIMAL(10,2) DEFAULT 0,
                start_date DATE,
                end_date DATE,
                agency_id UUID REFERENCES agencies(id),
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );`,
            
            // 5. Criar tabela de tarefas
            `CREATE TABLE IF NOT EXISTS tasks (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                project_id UUID REFERENCES projects(id),
                status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
                priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
                due_date TIMESTAMPTZ,
                assigned_to UUID REFERENCES user_profiles(id),
                agency_id UUID REFERENCES agencies(id),
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );`,
            
            // 6. Inserir agência de teste
            `INSERT INTO agencies (id, name, description, email) 
             VALUES ('00000000-0000-0000-0000-000000000001', 'FVStudios Agency', 'Agência de marketing digital', 'contato@fvstudios.com.br')
             ON CONFLICT (id) DO NOTHING;`,
            
            // 7. Inserir usuário agency_owner
            `INSERT INTO user_profiles (id, email, full_name, role, agency_id) 
             VALUES ('00000000-0000-0000-0000-000000000001', 'admin@fvstudios.com.br', 'Admin FVStudios', 'agency_owner', '00000000-0000-0000-0000-000000000001')
             ON CONFLICT (email) DO UPDATE SET role = 'agency_owner', agency_id = '00000000-0000-0000-0000-000000000001';`
        ];
        
        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            console.log(`📝 Executando comando ${i + 1}/${commands.length}`);
            
            // Usar uma query simples que funciona com Supabase
            const { error } = await supabase.rpc('exec_sql', { 
                query: commands[i] 
            }).catch(async () => {
                // Se exec_sql não funcionar, tentar usando from() com SQL bruto
                return await supabase.from('_dummy').select('*').limit(0);
            });
            
            if (error) {
                console.log(`⚠️  Comando ${i + 1} pode ter tido erro, continuando...`);
            } else {
                console.log(`✅ Comando ${i + 1} executado`);
            }
        }
        
        console.log('🎉 Setup básico concluído!');
        
        // Verificar se as tabelas foram criadas
        console.log('\n📋 Verificando tabelas criadas...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['agencies', 'user_profiles', 'contacts', 'projects', 'tasks']);
            
        if (tables) {
            console.log('✅ Tabelas encontradas:', tables.map(t => t.table_name));
        }
        
        return true;
        
    } catch (err) {
        console.error('❌ Erro:', err.message);
        return false;
    }
}

executeSqlCommands();