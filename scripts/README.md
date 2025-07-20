# 🗄️ Scripts de Banco de Dados - FVStudios Dashboard

Scripts para configuração completa do banco de dados PostgreSQL/Supabase do sistema multi-tenant FVStudios Dashboard.

## 📁 Arquivos

### 🧹 `clean_database.sql` (LIMPEZA)
**Script de limpeza completa do banco de dados**

⚠️ **ATENÇÃO**: Este script remove TUDO do banco de dados! Use apenas para reset completo.

Remove automaticamente:
- ✅ **Todas as políticas RLS** existentes
- ✅ **Todos os triggers** personalizados
- ✅ **Todas as funções** personalizadas
- ✅ **Todas as tabelas** do projeto e antigas
- ✅ **Tipos ENUM** personalizados
- ✅ **Sequências órfãs**
- ✅ **Índices personalizados**
- ✅ **Limpeza física** com VACUUM

### 🚀 `final_setup.sql` (PRINCIPAL)
**Script completo para configuração do sistema multi-tenant**

Este é o único script que você precisa executar para configurar todo o banco de dados. Inclui:

- ✅ **8 tabelas principais** (agencies, user_profiles, client_api_configs, projects, project_metrics, events, notifications, plan_limits)
- ✅ **Estrutura multi-tenant completa** com isolamento por agência
- ✅ **Row Level Security (RLS)** com 20+ políticas de segurança
- ✅ **6 planos de assinatura** predefinidos (free, basic, premium, enterprise, agency_basic, agency_pro)
- ✅ **Funções automáticas** (cálculo de métricas, criação de perfil, etc.)
- ✅ **Triggers** para updated_at e automações
- ✅ **Índices de performance**
- ✅ **Constraints e validações**

### 📊 `sample_data.sql` (OPCIONAL)
**Dados de exemplo para desenvolvimento e testes**

Popula o banco com dados realistas incluindo:
- 3 agências de exemplo
- 12 usuários com diferentes roles (admin, agency_owner, agency_staff, client)
- 7 projetos/campanhas
- Métricas de performance
- Eventos de calendário
- Notificações
- Configurações de API

## 🛠️ Como Instalar

### 0. Limpeza Completa (Se Necessário)
**⚠️ Execute apenas se quiser zerar TUDO no banco:**
1. Acesse o **SQL Editor** no Supabase Dashboard
2. Cole todo o conteúdo do arquivo `clean_database.sql`
3. Execute o script para remover tudo (tabelas, triggers, funções, RLS)
4. Aguarde a confirmação de limpeza completa

### 1. Executar Setup Principal
1. Acesse o **SQL Editor** no Supabase Dashboard
2. Cole todo o conteúdo do arquivo `final_setup.sql`
3. Execute o script
4. Aguarde a mensagem de sucesso

### 2. Dados de Exemplo (Opcional)
1. No mesmo SQL Editor
2. Cole o conteúdo do arquivo `sample_data.sql`
3. Execute para popular com dados de teste

## 🏗️ Arquitetura Multi-Tenant

### Hierarquia de Usuários
```
Admin Global
├── Agência A
│   ├── Owner/Staff da Agência A
│   ├── Cliente 1 da Agência A (APIs próprias)
│   └── Cliente 2 da Agência A (APIs próprias)
├── Agência B
│   ├── Owner/Staff da Agência B  
│   └── Clientes da Agência B
└── Cliente Independente (sem agência)
```

### Roles Disponíveis
- **`admin`**: Administrador global (vê e gerencia tudo)
- **`agency_owner`**: Dono da agência (gerencia agência e clientes)
- **`agency_staff`**: Funcionário da agência (acessa dados dos clientes)
- **`client`**: Cliente final (vê apenas seus próprios dados)

## 💰 Planos de Assinatura

| Plano | Clientes | Projetos | APIs | Preço/Mês |
|-------|----------|----------|------|-----------|
| **Free** | 1 | 3 | Google Analytics | R$ 0 |
| **Basic** | 5 | 20 | GA + Google Ads + Facebook | R$ 99 |
| **Premium** | 25 | 100 | + LinkedIn + Automação | R$ 299 |
| **Enterprise** | ∞ | ∞ | Todas + API Access | R$ 999 |
| **Agency Basic** | 50 | 200 | Multi-client Dashboard | R$ 499 |
| **Agency Pro** | 200 | 1000 | + White Label + Automação | R$ 1299 |

## 🔒 Segurança

### Row Level Security (RLS)
- ✅ **Isolamento completo** entre agências e clientes
- ✅ **Políticas granulares** por role e contexto
- ✅ **Configurações de API isoladas** por cliente
- ✅ **Audit trail** com created_at/updated_at

### Permissões por Role

#### Admin
- Vê e gerencia todas as agências, usuários, projetos
- Acesso a estatísticas globais do sistema
- Pode criar/editar planos e limites

#### Agency Owner/Staff  
- Vê e gerencia apenas clientes da sua agência
- Acesso a projetos e métricas dos seus clientes
- Pode criar eventos e relatórios para clientes
- **NÃO** pode editar configurações de API dos clientes

#### Client
- Vê apenas seus próprios dados (projetos, métricas, eventos)
- Gerencia suas próprias configurações de API
- Recebe notificações sobre seus projetos
- Pode agendar reuniões com sua agência

## 📊 Funcionalidades Automáticas

### Cálculo de Métricas
- **CTR**: (Clicks / Impressions) × 100
- **CPC**: Cost / Clicks  
- **CPA**: Cost / Conversions
- **ROAS**: Revenue / Cost

### Auto-criação
- **Perfil de usuário** quando se cadastra via Supabase Auth
- **Configurações de API** para novos clientes
- **Timestamps** updated_at automáticos

### Dashboard Contextual
- Função `get_dashboard_stats()` retorna dados baseados no role:
  - Admin: estatísticas globais
  - Agência: dados da agência + clientes
  - Cliente: apenas dados próprios

## 🔧 Tabelas Principais

1. **`agencies`** - Agências master tenant
2. **`user_profiles`** - Usuários com roles e hierarquia  
3. **`client_api_configs`** - Configurações de API por cliente (ISOLADAS)
4. **`projects`** - Projetos/campanhas associados a cliente + agência
5. **`project_metrics`** - Métricas de performance com cálculos automáticos
6. **`events`** - Sistema de calendário multi-tenant
7. **`notifications`** - Notificações contextuais
8. **`plan_limits`** - Definição de planos e limites

## 🎯 Pontos Importantes

### APIs por Cliente
- ✅ Cada cliente tem suas **próprias chaves de API**
- ✅ Agência pode **ver** as configurações (para suporte)
- ✅ Agência **NÃO pode editar** as chaves dos clientes
- ✅ Isolamento completo entre clientes

### Multi-tenancy
- ✅ **Isolamento por agência**: Agência A não vê dados da Agência B
- ✅ **Isolamento por cliente**: Cliente 1 não vê dados do Cliente 2
- ✅ **Hierarquia respeitada**: Agency staff vê clientes da agência
- ✅ **Admin global**: Vê tudo para administração do sistema

## 🚀 Próximos Passos

Após executar os scripts:

1. **Configure Supabase Auth** no projeto Next.js
2. **Teste o login** e criação automática de perfil
3. **Crie usuários admin** via SQL ou interface
4. **Configure as integrações de API** no código
5. **Implemente os dashboards** baseados nos roles
6. **Configure notificações** automáticas

## 📞 Suporte

Sistema desenvolvido para **isolamento total entre clientes** e **gestão eficiente por agências**. 

Cada componente foi projetado para escalar e manter a segurança em um ambiente multi-tenant real.
- **Fernanda Rocha**: `fernanda@fvstudios.com` / `fernanda123`

### Plano ENTERPRISE (2 usuários)
- **Ricardo Alves**: `ricardo@fvstudios.com` / `ricardo123`
- **Patricia Gomes**: `patricia@fvstudios.com` / `patricia123`

## 🚀 Como Executar

### Pré-requisitos
1. Node.js instalado
2. Arquivo `.env` configurado com:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```

### Opção 1: Executar via terminal
```bash
# Navegar para o diretório do projeto
cd /path/to/fvstudiosdash

# Instalar dependências se necessário
npm install @supabase/supabase-js dotenv

# Executar o script (apenas usuários)
node scripts/create_test_users.js

# Executar o script com dados completos (usuários + projetos + eventos)
node scripts/create_test_users.js --with-data

# Executar apenas dados adicionais (se usuários já existem)
node scripts/create_test_users.js --data-only
```

### Opção 2: Executar via SQL (alternativa)
1. Execute o script `scripts/create_test_users.js` primeiro para criar usuários no Auth
2. Depois execute o arquivo `scripts/populate_database.sql` no SQL Editor do Supabase

## 📊 Dados Criados

### Tabelas Populadas:
- **user_profiles**: Perfis completos de todos os usuários
- **projects**: Projetos de exemplo variando por plano:
  - Free: 1-2 projetos simples
  - Basic: 2-3 projetos básicos  
  - Premium: 3-4 projetos avançados
  - Agency: 4-5 projetos de clientes
  - Enterprise: 5-6 projetos corporativos

- **events**: Eventos distribuídos:
  - 5 eventos para hoje
  - 3 eventos para esta semana
  - 2 eventos para este mês

## 🔧 Estrutura das Tabelas

### user_profiles
```sql
- id (UUID, PK, referencia auth.users)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- company (VARCHAR)  
- phone (VARCHAR)
- role (VARCHAR) - free|basic|premium|agency|enterprise
- notes (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### projects
```sql
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- status (VARCHAR) - active|planning|review|completed
- user_id (UUID, FK para auth.users)
- created_at, updated_at (TIMESTAMPTZ)
```

### events
```sql
- id (UUID, PK)  
- title (VARCHAR)
- description (TEXT)
- date (DATE)
- time (TIME)
- user_id (UUID, FK para auth.users)
- created_at, updated_at (TIMESTAMPTZ)
```

## 🎯 Testes Recomendados

1. **Teste de Login**: Faça login com cada tipo de usuário
2. **Teste de Permissões**: Verifique se cada plano acessa as funcionalidades corretas
3. **Teste de Dashboard**: Veja se os dados aparecem corretamente para cada usuário
4. **Teste de Criação**: Teste criar novos projetos/eventos com diferentes usuários
5. **Teste Admin**: Use sua conta admin para ver todos os dados

## ⚠️ Importante

- Este script é apenas para desenvolvimento/teste
- Não execute em produção com dados reais
- Os usuários criados têm emails confirmados automaticamente
- Senhas são simples - altere em produção
- Backup do banco antes de executar

## 🔄 Limpeza (se necessário)

Para remover os usuários de teste:

```sql
-- Remover da auth (via Dashboard do Supabase)
-- Ou via SQL se tiver acesso:
DELETE FROM auth.users WHERE email LIKE '%@fvstudios.com';

-- Os dados das outras tabelas serão removidos automaticamente 
-- devido às foreign keys com ON DELETE CASCADE
```

## 📝 Logs

O script mostra:
- ✅ Usuários criados com sucesso
- ⚠️ Avisos (usuário já existe, etc.)
- ❌ Erros (problemas de configuração, etc.)
- 📊 Resumo final da operação
