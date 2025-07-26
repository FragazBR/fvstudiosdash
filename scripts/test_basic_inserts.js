const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://htlzesfvekijsulzufbd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function testBasicInserts() {
    console.log('🧪 Testando inserções básicas com dados mínimos...');
    
    try {
        // Buscar agência e usuário existentes
        const { data: agencies } = await supabase.from('agencies').select('*').limit(1);
        const { data: users } = await supabase.from('user_profiles').select('*').eq('role', 'agency_owner').limit(1);
        
        if (!agencies || agencies.length === 0 || !users || users.length === 0) {
            console.log('❌ Precisa executar o setup primeiro');
            return;
        }
        
        const agency = agencies[0];
        const user = users[0];
        
        // 1. TESTAR INSERÇÃO DE CLIENTE (apenas campos essenciais)
        console.log('\n📝 Testando cliente...');
        const { data: client, error: clientError } = await supabase
            .from('contacts')
            .insert({
                name: 'TechInova Solutions',
                email: 'contato@techinova.com',
                company: 'TechInova Solutions',
                role: 'client',
                status: 'active',
                agency_id: agency.id,
                created_by: user.id
            })
            .select()
            .single();
            
        if (clientError) {
            console.log('❌ Erro ao criar cliente:', clientError.message);
        } else {
            console.log('✅ Cliente criado:', client.name);
            
            // 2. TESTAR INSERÇÃO DE PROJETO
            console.log('\n📝 Testando projeto...');
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                    name: 'Website TechInova',
                    description: 'Desenvolvimento de website corporativo',
                    client_id: client.id,
                    status: 'in_progress',
                    priority: 'high',
                    budget_total: 25000.00,
                    budget_spent: 12500.00,
                    agency_id: agency.id,
                    created_by: user.id
                })
                .select()
                .single();
                
            if (projectError) {
                console.log('❌ Erro ao criar projeto:', projectError.message);
            } else {
                console.log('✅ Projeto criado:', project.name);
                
                // 3. TESTAR INSERÇÃO DE TAREFA
                console.log('\n📝 Testando tarefa...');
                const { data: task, error: taskError } = await supabase
                    .from('tasks')
                    .insert({
                        title: 'Design Homepage',
                        description: 'Criar layout da página inicial',
                        project_id: project.id,
                        status: 'in_progress',
                        priority: 'high',
                        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        assigned_to: user.id,
                        agency_id: agency.id,
                        created_by: user.id
                    })
                    .select()
                    .single();
                    
                if (taskError) {
                    console.log('❌ Erro ao criar tarefa:', taskError.message);
                } else {
                    console.log('✅ Tarefa criada:', task.title);
                }
            }
        }
        
        // 4. VERIFICAR DADOS FINAIS
        console.log('\n📊 Verificando dados no banco...');
        
        const { data: allClients } = await supabase
            .from('contacts')
            .select('*')
            .eq('agency_id', agency.id);
            
        const { data: allProjects } = await supabase
            .from('projects')
            .select('*, contacts(name, company)')
            .eq('agency_id', agency.id);
            
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('*, projects(name)')
            .eq('agency_id', agency.id);
        
        console.log(`\n✅ Total de clientes: ${allClients?.length || 0}`);
        if (allClients) {
            allClients.forEach(client => {
                console.log(`   - ${client.name} (${client.company || 'Sem empresa'})`);
            });
        }
        
        console.log(`\n✅ Total de projetos: ${allProjects?.length || 0}`);
        if (allProjects) {
            allProjects.forEach(project => {
                console.log(`   - ${project.name} para ${project.contacts?.name || 'Cliente não encontrado'}`);
            });
        }
        
        console.log(`\n✅ Total de tarefas: ${allTasks?.length || 0}`);
        if (allTasks) {
            allTasks.forEach(task => {
                console.log(`   - ${task.title} (${task.projects?.name || 'Projeto não encontrado'}) - ${task.status}`);
            });
        }
        
        console.log('\n🎉 TESTE CONCLUÍDO!');
        console.log('📋 Agora você pode testar o sistema:');
        console.log('1. Acesse /accounts para ver os clientes');
        console.log('2. Acesse /projects para ver os projetos');
        console.log('3. Acesse /my-tasks para ver as tarefas');
        console.log('4. Acesse /workstation para ver o dashboard completo');
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error);
    }
}

testBasicInserts();