const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://htlzesfvekijsulzufbd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para gerar UUID simples
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function createTestData() {
    console.log('🚀 Criando dados de teste integrados...');
    
    try {
        // Buscar agência e usuário existentes
        const { data: agencies } = await supabase
            .from('agencies')
            .select('*')
            .limit(1);
            
        const { data: users } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('role', 'agency_owner')
            .limit(1);
            
        if (!agencies || agencies.length === 0) {
            console.log('❌ Nenhuma agência encontrada. Execute o setup primeiro.');
            return false;
        }
        
        if (!users || users.length === 0) {
            console.log('❌ Nenhum agency_owner encontrado. Execute o setup primeiro.');
            return false;
        }
        
        const agency = agencies[0];
        const user = users[0];
        
        console.log(`✅ Usando agência: ${agency.name}`);
        console.log(`✅ Usando usuário: ${user.email}`);
        
        // 1. CRIAR CLIENTES
        console.log('\n📝 Criando clientes...');
        const clients = [
            { name: 'João Silva', email: 'joao@techinova.com.br', phone: '+55 11 98765-4321', company: 'TechInova Solutions' },
            { name: 'Maria Santos', email: 'maria@bellacosmeticos.com.br', phone: '+55 11 97654-3210', company: 'Bella Cosméticos' },
            { name: 'Carlos Oliveira', email: 'carlos@fastfood.com.br', phone: '+55 11 96543-2109', company: 'FastFood Express' },
            { name: 'Ana Costa', email: 'ana@modafashion.com.br', phone: '+55 11 95432-1098', company: 'Moda Fashion Store' },
            { name: 'Roberto Lima', email: 'roberto@construtora.com.br', phone: '+55 11 94321-0987', company: 'Lima Construções' }
        ];
        
        const insertedClients = [];
        for (const client of clients) {
            const { data, error } = await supabase
                .from('contacts')
                .upsert({
                    id: generateUUID(),
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    company: client.company,
                    role: 'client',
                    status: 'active',
                    agency_id: agency.id,
                    created_by: user.id
                })
                .select()
                .single();
                
            if (error) {
                console.log(`⚠️  Erro ao criar cliente ${client.name}:`, error.message);
            } else {
                insertedClients.push(data);
                console.log(`✅ Cliente criado: ${client.name} - ${client.company}`);
            }
        }
        
        // 2. CRIAR PROJETOS
        console.log('\n📝 Criando projetos...');
        const projects = [
            {
                name: 'Website Corporativo TechInova',
                description: 'Desenvolvimento de website institucional com blog e área de clientes',
                client_company: 'TechInova Solutions',
                status: 'in_progress',
                priority: 'high',
                budget_total: 25000.00,
                budget_spent: 12500.00,
                start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                name: 'E-commerce Bella',
                description: 'Desenvolvimento de loja virtual com integração de pagamento',
                client_company: 'Bella Cosméticos',
                status: 'in_progress',
                priority: 'urgent',
                budget_total: 35000.00,
                budget_spent: 21000.00,
                start_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                name: 'Estratégia Redes Sociais',
                description: 'Gestão completa de redes sociais e criação de conteúdo',
                client_company: 'Bella Cosméticos',
                status: 'active',
                priority: 'high',
                budget_total: 8000.00,
                budget_spent: 3200.00,
                start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                name: 'App Delivery FastFood',
                description: 'Aplicativo de delivery com sistema de pedidos',
                client_company: 'FastFood Express',
                status: 'completed',
                priority: 'high',
                budget_total: 28000.00,
                budget_spent: 28000.00,
                start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
                name: 'Rebranding Moda Fashion',
                description: 'Criação de nova identidade visual e materiais gráficos',
                client_company: 'Moda Fashion Store',
                status: 'review',
                priority: 'medium',
                budget_total: 15000.00,
                budget_spent: 13500.00,
                start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ];
        
        const insertedProjects = [];
        for (const project of projects) {
            // Encontrar o cliente
            const client = insertedClients.find(c => c.company === project.client_company);
            if (!client) {
                console.log(`⚠️  Cliente não encontrado para projeto: ${project.name}`);
                continue;
            }
            
            const { data, error } = await supabase
                .from('projects')
                .upsert({
                    id: generateUUID(),
                    name: project.name,
                    description: project.description,
                    client_id: client.id,
                    status: project.status,
                    priority: project.priority,
                    budget_total: project.budget_total,
                    budget_spent: project.budget_spent,
                    start_date: project.start_date,
                    end_date: project.end_date,
                    agency_id: agency.id,
                    created_by: user.id
                })
                .select()
                .single();
                
            if (error) {
                console.log(`⚠️  Erro ao criar projeto ${project.name}:`, error.message);
            } else {
                insertedProjects.push(data);
                console.log(`✅ Projeto criado: ${project.name} para ${client.company}`);
            }
        }
        
        // 3. CRIAR TAREFAS
        console.log('\n📝 Criando tarefas...');
        const tasks = [
            // Website TechInova
            { title: 'Análise de Requisitos', description: 'Levantamento completo dos requisitos', project_name: 'Website Corporativo TechInova', status: 'completed', priority: 'high', days_offset: -10 },
            { title: 'Design Homepage', description: 'Criação do layout da página inicial', project_name: 'Website Corporativo TechInova', status: 'completed', priority: 'high', days_offset: -5 },
            { title: 'Desenvolvimento Frontend', description: 'Codificação das páginas em HTML/CSS/JS', project_name: 'Website Corporativo TechInova', status: 'in_progress', priority: 'high', days_offset: 10 },
            { title: 'Integração Backend', description: 'Desenvolvimento da API e banco de dados', project_name: 'Website Corporativo TechInova', status: 'todo', priority: 'medium', days_offset: 20 },
            
            // E-commerce Bella
            { title: 'Setup WooCommerce', description: 'Instalação e configuração da plataforma', project_name: 'E-commerce Bella', status: 'completed', priority: 'urgent', days_offset: -15 },
            { title: 'Cadastro de Produtos', description: 'Inserção de todos os produtos no sistema', project_name: 'E-commerce Bella', status: 'completed', priority: 'high', days_offset: -8 },
            { title: 'Integração Pagamento', description: 'Configuração dos gateways de pagamento', project_name: 'E-commerce Bella', status: 'in_progress', priority: 'urgent', days_offset: 3 },
            { title: 'Testes de Compra', description: 'Validação do fluxo completo de compra', project_name: 'E-commerce Bella', status: 'todo', priority: 'urgent', days_offset: 10 },
            
            // Redes Sociais Bella
            { title: 'Planejamento Editorial', description: 'Criação do calendário de conteúdo mensal', project_name: 'Estratégia Redes Sociais', status: 'completed', priority: 'high', days_offset: -5 },
            { title: 'Criação de Posts', description: 'Desenvolvimento de 30 posts para Instagram', project_name: 'Estratégia Redes Sociais', status: 'in_progress', priority: 'medium', days_offset: 7 },
            { title: 'Stories Diários', description: 'Criação de stories para engajamento', project_name: 'Estratégia Redes Sociais', status: 'todo', priority: 'medium', days_offset: 1 }
        ];
        
        for (const task of tasks) {
            const project = insertedProjects.find(p => p.name === task.project_name);
            if (!project) {
                console.log(`⚠️  Projeto não encontrado para tarefa: ${task.title}`);
                continue;
            }
            
            const dueDate = new Date(Date.now() + task.days_offset * 24 * 60 * 60 * 1000).toISOString();
            
            const { data, error } = await supabase
                .from('tasks')
                .upsert({
                    id: generateUUID(),
                    title: task.title,
                    description: task.description,
                    project_id: project.id,
                    status: task.status,
                    priority: task.priority,
                    due_date: dueDate,
                    assigned_to: user.id,
                    agency_id: agency.id,
                    created_by: user.id
                })
                .select()
                .single();
                
            if (error) {
                console.log(`⚠️  Erro ao criar tarefa ${task.title}:`, error.message);
            } else {
                console.log(`✅ Tarefa criada: ${task.title} (${task.status})`);
            }
        }
        
        // 4. VERIFICAR RESULTADOS
        console.log('\n📊 Verificando dados criados...');
        
        const { data: finalClients } = await supabase
            .from('contacts')
            .select('*')
            .eq('agency_id', agency.id);
            
        const { data: finalProjects } = await supabase
            .from('projects')
            .select('*')
            .eq('agency_id', agency.id);
            
        const { data: finalTasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('agency_id', agency.id);
        
        console.log(`✅ Clientes criados: ${finalClients?.length || 0}`);
        console.log(`✅ Projetos criados: ${finalProjects?.length || 0}`);
        console.log(`✅ Tarefas criadas: ${finalTasks?.length || 0}`);
        
        console.log('\n🎉 DADOS DE TESTE INTEGRADOS CRIADOS COM SUCESSO!');
        console.log('\n📋 AGORA VOCÊ PODE:');
        console.log('1. Acessar a aba CONTAS e ver todos os clientes');
        console.log('2. Acessar PROJETOS e ver projetos organizados por cliente');
        console.log('3. Acessar TAREFAS e ver todas as tarefas dos projetos');
        console.log('4. Acessar WORKSTATION e ver o dashboard completo');
        console.log('5. Todas as abas estão integradas com os mesmos dados! 🚀');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao criar dados de teste:', error);
        return false;
    }
}

createTestData();