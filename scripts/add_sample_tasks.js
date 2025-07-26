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

async function addSampleTasks() {
    console.log('🚀 Adicionando tarefas de exemplo...');
    
    try {
        // Buscar projetos e usuário existentes
        const { data: projects } = await supabase.from('projects').select('*');
        const { data: users } = await supabase.from('user_profiles').select('*').eq('role', 'agency_owner').limit(1);
        const { data: agencies } = await supabase.from('agencies').select('*').limit(1);
        
        if (!projects || projects.length === 0) {
            console.log('❌ Nenhum projeto encontrado. Execute o script de criação de dados primeiro.');
            return;
        }
        
        if (!users || users.length === 0) {
            console.log('❌ Nenhum usuário encontrado.');
            return;
        }
        
        if (!agencies || agencies.length === 0) {
            console.log('❌ Nenhuma agência encontrada.');
            return;
        }
        
        const user = users[0];
        const agency = agencies[0];
        
        console.log(`✅ Usando usuário: ${user.email}`);
        console.log(`✅ Projetos encontrados: ${projects.length}`);
        
        // Tarefas de exemplo para cada projeto
        const sampleTasks = [
            // Projeto 1
            {
                title: 'Análise de Requisitos',
                description: 'Levantamento completo dos requisitos do projeto',
                project_id: projects[0]?.id,
                status: 'completed',
                priority: 'high',
                due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
                progress: 100
            },
            {
                title: 'Design da Interface',
                description: 'Criação do layout e design das telas principais',
                project_id: projects[0]?.id,
                status: 'in_progress',
                priority: 'high',
                due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias
                progress: 65
            },
            {
                title: 'Desenvolvimento Frontend',
                description: 'Implementação das telas em React/Next.js',
                project_id: projects[0]?.id,
                status: 'todo',
                priority: 'medium',
                due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias
                progress: 0
            },
            
            // Projeto 2 (se existir)
            ...(projects[1] ? [
                {
                    title: 'Estratégia de Conteúdo',
                    description: 'Planejamento do calendário editorial',
                    project_id: projects[1].id,
                    status: 'completed',
                    priority: 'high',
                    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
                    progress: 100
                },
                {
                    title: 'Criação de Posts',
                    description: 'Desenvolvimento de 20 posts para redes sociais',
                    project_id: projects[1].id,
                    status: 'in_progress',
                    priority: 'urgent',
                    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // amanhã
                    progress: 75
                },
                {
                    title: 'Análise de Métricas',
                    description: 'Relatório de performance das campanhas',
                    project_id: projects[1].id,
                    status: 'review',
                    priority: 'medium',
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
                    progress: 90
                }
            ] : []),
            
            // Projeto 3 (se existir)
            ...(projects[2] ? [
                {
                    title: 'Configuração do Servidor',
                    description: 'Setup do ambiente de produção',
                    project_id: projects[2].id,
                    status: 'todo',
                    priority: 'high',
                    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias
                    progress: 0
                },
                {
                    title: 'Testes de Performance',
                    description: 'Validação de velocidade e otimização',
                    project_id: projects[2].id,
                    status: 'todo',
                    priority: 'low',
                    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias
                    progress: 0
                }
            ] : [])
        ];
        
        console.log(`📝 Criando ${sampleTasks.length} tarefas...`);
        
        // Inserir tarefas
        for (const task of sampleTasks) {
            if (!task.project_id) continue;
            
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    id: generateUUID(),
                    title: task.title,
                    description: task.description,
                    project_id: task.project_id,
                    status: task.status,
                    priority: task.priority,
                    due_date: task.due_date,
                    assigned_to: user.id,
                    agency_id: agency.id,
                    created_by: user.id,
                    progress: task.progress || 0
                })
                .select()
                .single();
                
            if (error) {
                console.log(`⚠️  Erro ao criar tarefa "${task.title}":`, error.message);
            } else {
                console.log(`✅ Tarefa criada: ${task.title} (${task.status})`);
            }
        }
        
        // Verificar resultado final
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('*, projects(name)')
            .eq('agency_id', agency.id);
        
        console.log(`\n📊 Total de tarefas no sistema: ${allTasks?.length || 0}`);
        
        if (allTasks) {
            const byStatus = allTasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\n📈 Distribuição por status:');
            Object.entries(byStatus).forEach(([status, count]) => {
                const statusLabel = {
                    'todo': 'A fazer',
                    'in_progress': 'Em progresso',
                    'review': 'Em revisão',
                    'completed': 'Concluído'
                }[status] || status;
                console.log(`   - ${statusLabel}: ${count}`);
            });
        }
        
        console.log('\n🎉 TAREFAS DE EXEMPLO CRIADAS COM SUCESSO!');
        console.log('\n📋 AGORA VOCÊ PODE:');
        console.log('1. Acessar /my-tasks e ver as tarefas organizadas por prazo');
        console.log('2. Usar o botão "Nova Tarefa" para criar mais tarefas');
        console.log('3. Ver as tarefas integradas no /workstation');
        console.log('4. Testar os filtros e busca na página de tarefas');
        
    } catch (error) {
        console.error('❌ Erro ao criar tarefas:', error);
    }
}

addSampleTasks();