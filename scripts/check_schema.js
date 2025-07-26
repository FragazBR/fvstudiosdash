const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://htlzesfvekijsulzufbd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('🔍 Verificando schema das tabelas...');
    
    try {
        // Verificar tabelas existentes
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (tablesError) {
            console.log('❌ Erro ao buscar tabelas:', tablesError.message);
            return;
        }
        
        console.log('\n📊 Tabelas encontradas:');
        tables.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });
        
        // Verificar colunas da tabela contacts
        console.log('\n🔍 Verificando colunas da tabela "contacts":');
        const { data: contactsColumns, error: contactsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_schema', 'public')
            .eq('table_name', 'contacts');
            
        if (contactsColumns) {
            contactsColumns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
            });
        }
        
        // Verificar colunas da tabela projects
        console.log('\n🔍 Verificando colunas da tabela "projects":');
        const { data: projectsColumns, error: projectsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_schema', 'public')
            .eq('table_name', 'projects');
            
        if (projectsColumns) {
            projectsColumns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
            });
        }
        
        // Verificar colunas da tabela tasks
        console.log('\n🔍 Verificando colunas da tabela "tasks":');
        const { data: tasksColumns, error: tasksError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_schema', 'public')
            .eq('table_name', 'tasks');
            
        if (tasksColumns) {
            tasksColumns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
            });
        }
        
        // Testar inserção simples
        console.log('\n🧪 Testando inserção de cliente simples...');
        const { data: testClient, error: testError } = await supabase
            .from('contacts')
            .insert({
                name: 'Teste Cliente',
                email: 'teste@exemplo.com',
                company: 'Empresa Teste',
                role: 'client',
                status: 'active'
            })
            .select()
            .single();
            
        if (testError) {
            console.log('❌ Erro ao inserir cliente teste:', testError.message);
        } else {
            console.log('✅ Cliente teste inserido com sucesso:', testClient.name);
            
            // Remover cliente teste
            await supabase
                .from('contacts')
                .delete()
                .eq('id', testClient.id);
                
            console.log('🗑️  Cliente teste removido');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar schema:', error);
    }
}

checkSchema();