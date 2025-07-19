# 🚀 FVStudios Dashboard - Database Setup

Sistema completo de autenticação multi-role com integrações de APIs para agências, produtores independentes, influencers e clientes.

## 📋 **Ordem de Execução**

Execute os scripts SQL **exatamente nesta ordem** no SQL Editor do Supabase:

### 1️⃣ **01_create_database_structure.sql**
- Cria toda a estrutura do banco de dados
- 9 tipos de usuário com hierarquia completa
- 5 tabelas principais + relacionamentos
- Índices otimizados

### 2️⃣ **02_insert_integrations.sql** 
- Adiciona 23 integrações ao catálogo
- Redes sociais, IA, pagamentos, design, analytics, storage
- Configurações de disponibilidade por plano

### 3️⃣ **03_create_triggers.sql**
- Triggers automáticos para criação de perfis
- Validação de limites por plano
- Logs automáticos de uso de integrações
- Controle de hierarquia agência/produtor

### 4️⃣ **04_enable_rls_policies.sql**
- Ativa Row Level Security (RLS)
- Políticas de segurança por tipo de usuário
- Controle de acesso hierárquico
- Proteção de dados sensíveis

### 5️⃣ **05_verify_system.sql** *(Opcional)*
- Verificação completa do sistema
- Status de usuários, integrações e políticas
- Relatório final de implementação

---

## 👥 **Tipos de Usuário Implementados**

### 🔧 **Admin**
- Controle total do sistema
- Acesso a todas as funcionalidades
- Gerenciamento de usuários e integrações

### 🏢 **Agência (3 níveis)**
- **Owner**: Dono da agência, cria funcionários e clientes
- **Manager**: Gerente, administra projetos e equipe
- **Employee**: Funcionário, executa tarefas atribuídas

### 👤 **Produtor Independente**
- Trabalha sozinho, sem funcionários
- Pode criar e gerenciar seus próprios clientes
- Dashboard personalizado

### 👑 **Cliente**
- Cliente de agência ou produtor independente
- Conecta suas próprias APIs
- Visualiza apenas seus projetos

### 💼 **Outros Tipos**
- **Freelancer**: Freelancer independente
- **Influencer**: Métricas e campanhas
- **Free**: Usuário gratuito limitado

---

## 🔑 **Sistema de Integrações**

### 📱 **Redes Sociais** (6)
- Instagram Business, Facebook Pages, TikTok Business
- YouTube, Twitter/X, LinkedIn

### 📊 **Analytics** (3) 
- Google Analytics, Meta Pixel, Google Tag Manager

### 📧 **Marketing** (3)
- Mailchimp, RD Station, HubSpot

### 🎨 **Design** (2)
- Canva, Adobe Creative Cloud

### 🤖 **Inteligência Artificial** (3)
- OpenAI, Claude, Google Gemini

### 💾 **Storage** (3)
- Google Drive, Dropbox, AWS S3

### 💳 **Pagamentos** (3)
- Stripe, PayPal, Mercado Pago

---

## 🔒 **Sistema de Segurança**

### **Row Level Security (RLS)**
- Cada usuário vê apenas seus próprios dados
- Hierarquia respeitada (agência → funcionários → clientes)
- Proteção automática contra vazamentos

### **Limites por Plano**
- **Free**: 3 integrações, 5 clientes, 10 projetos
- **Agency**: 20 integrações, 50 clientes, 100 projetos
- **Producer**: 15 integrações, 20 clientes, 50 projetos
- **Admin**: Ilimitado

### **Credenciais Criptografadas**
- API keys e tokens OAuth seguros
- Logs de uso sem dados sensíveis
- Compartilhamento controlado com provedores

---

## 🛠️ **Primeiro Uso**

### **1. Executar Scripts**
```sql
-- Execute na ordem no Supabase SQL Editor
01_create_database_structure.sql
02_insert_integrations.sql  
03_create_triggers.sql
04_enable_rls_policies.sql
05_verify_system.sql
```

### **2. Criar Usuário Admin**
- Vá em **Authentication > Users** no Supabase
- **Add user**: admin@fvstudios.com
- **Password**: admin123
- ✅ **Auto Confirm User**

### **3. Fazer Login**
- Acesse `localhost:3001/login`
- Use as credenciais admin criadas
- Sistema deve redirecionar para dashboard admin

---

## 📁 **Estrutura de Arquivos**

```
supabase/
├── 01_create_database_structure.sql  # Estrutura principal
├── 02_insert_integrations.sql        # Catálogo de integrações  
├── 03_create_triggers.sql             # Triggers automáticos
├── 04_enable_rls_policies.sql         # Políticas de segurança
├── 05_verify_system.sql               # Verificação do sistema
├── SETUP_DATABASE.md                  # Documentação detalhada
└── README.md                          # Este arquivo
```

---

## 🎯 **Sistema Pronto!**

✅ **9 tipos de usuário** com hierarquia completa  
✅ **23 integrações** de APIs principais  
✅ **Segurança RLS** robusta e escalável  
✅ **Triggers automáticos** para validação  
✅ **Logs detalhados** de uso e auditoria  

**O FVStudios Dashboard está pronto para receber usuários reais!** 🚀
