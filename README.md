# 🎯 FVStudios Dashboard - Sistema Multi-Tenant Completo

Sistema de gerenciamento avançado para agências de marketing digital, seus clientes e campanhas. Arquitetura multi-tenant com isolamento completo de dados e configurações de API individualizadas.

## ✨ Características Principais

- 🏢 **Multi-tenant**: Isolamento completo entre agências e clientes
- 🔐 **Segurança Avançada**: Row Level Security (RLS) com políticas granulares
- 📊 **APIs Individuais**: Cada cliente possui suas próprias chaves de API
- 📈 **Métricas Automáticas**: Cálculo automático de CTR, CPC, CPA, ROAS
- 💰 **Sistema de Planos**: 6 planos com limites e recursos configuráveis
- 🌐 **Internacionalização**: Suporte a múltiplos idiomas
- 📱 **Responsivo**: Interface adaptada para desktop, tablet e mobile

## 🚀 Tecnologias

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **UI**: Shadcn/ui, Lucide icons, Recharts
- **Autenticação**: Supabase Auth com perfis automáticos
- **i18n**: next-intl (pt, en, es)
- **Estado**: React Context + Server Actions

## 🏗️ Arquitetura Multi-Tenant

## 🧱 Hierarquia de Usuários (Multi-Tenant)

O sistema adota uma arquitetura multi-tenant com **isolamento rígido** entre clientes, agências, produtores independentes e usuários individuais.

### 🧩 Fluxo Hierárquico

```
Admin Global
├── Agência A
│   ├── agency_owner
│   ├── agency_staff
│   ├── Cliente 1 (APIs próprias)
│   └── Cliente 2 (APIs próprias)
├── Agência B
│   ├── agency_owner
│   ├── agency_staff
│   └── Clientes
├── Produtor Independente
│   └── Clientes individuais
├── Produtor de Conteúdo / Influencer
└── Usuário do Plano Gratuito
```

### 4 Roles Principais
- **admin**: Acesso global ao sistema, configurações, planos e gerenciamento de todos os usuários.
- **agency_owner**: Gerencia colaboradores, clientes, contratos e estrutura de produção.
- **agency_staff**: Visualiza e interage com os projetos e clientes da sua própria agência.
- **agency_client**: Acesso somente aos seus próprios dados, APIs e visualização de projetos.
- **independent_producer**: Acesso completo à estrutura de agência, mas para uso individual e clientes próprios.
- **independent_client**: Acesso somente aos seus próprios dados, APIs e visualização de projetos.
- **influencer**: Ferramentas individuais, sem visibilidade ou interação com outros usuários.
- **free_user**: Acesso limitado a ferramentas e sem recursos premium (ex: IA, automações).

### 🔐 Segurança de Dados

- Cada cliente, agência ou produtor só acessa **suas próprias informações**.
- Toda tabela possui filtros por `agency_id`, `producer_id` ou `client_id`.
- Supabase RLS ativa para todas as entidades sensíveis.
- Nenhum cliente ou colaborador pode visualizar dados de outro cliente.
- Tokens de sessão carregam escopo autorizado (planos, IDs, permissões).

### 🔄 Acesso Controlado (exemplos)

| Módulo          | admin | agency_owner | agency_staff | client | independent | influencer | free_user |
|----------------|:-----:|:------------:|:------------:|:------:|:-----------:|:----------:|:---------:|
| Dashboard       | ✅    | ✅           | ✅           | ✅     | ✅          | ✅         | ✅        |
| Projetos        | ✅    | ✅           | ✅           | 🔍     | ✅          | ❌         | ❌        |
| Workstation     | ✅    | ✅           | ✅           | 🔍     | ✅          | ✅         | ❌        |
| Tarefas         | ✅    | ✅           | ✅           | 🔍     | ✅          | ✅         | ❌        |
| Calendário      | ✅    | ✅           | ✅           | 🔍     | ✅          | ✅         | ❌        |
| Mensagens       | ✅    | ✅           | ✅           | ✅     | ✅          | ❌         | ❌        |
| IA Agents       | ✅    | ✅           | ✅           | ✅     | ✅          | ✅         | ❌        |
| Gerenciar Usuários | ✅ | ✅           | ❌           | ❌     | ✅          | ❌         | ❌        |
| Agência         | ✅    | ✅           | ❌           | ❌     | ❌          | ❌         | ❌        |

> 🔍 = acesso somente leitura


## 💰 Planos de Assinatura

| Plano | Clientes | Projetos | Campanhas | APIs | Preço/Mês |
|-------|----------|----------|-----------|------|-----------|
| **Free** | 1 | 3 | 3 | Google Analytics | R$ 0 |
| **Basic** | 5 | 20 | 20 | GA, Google Ads, Facebook | R$ 99 |
| **Premium** | 25 | 100 | 100 | + LinkedIn, Automação | R$ 299 |
| **Enterprise** | ∞ | ∞ | ∞ | Todas + API Access | R$ 999 |
| **Agency Basic** | 50 | 200 | 200 | Multi-client Dashboard | R$ 499 |
| **Agency Pro** | 200 | 1000 | 1000 | + White Label + Automação | R$ 1299 |

## 📁 Estrutura do Projeto

```
├── app/                    # Next.js App Router
│   ├── admin/             # 🔧 Painel administrativo global
│   ├── agency/            # 🏢 Dashboard da agência
│   ├── dashboard/         # 📊 Dashboard contextual (admin/agency/client)
│   ├── client/            # 💼 Portal do cliente
│   ├── projects/          # 📋 Gerenciamento de projetos/campanhas
│   ├── calendar/          # 📅 Sistema de calendário
│   ├── messages/          # 💬 Comunicação interna
│   ├── contacts/          # 📞 CRM de contatos
│   ├── notifications/     # 🔔 Central de notificações
│   ├── settings/          # ⚙️ Configurações (APIs, perfil, agência)
│   ├── login/            # 🔐 Autenticação
│   └── signup/           # 📝 Registro
├── components/            # Componentes React reutilizáveis
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── dashboard/        # Componentes específicos do dashboard
│   ├── agency/           # Componentes da área de agência
│   └── charts/           # Gráficos e visualizações
├── hooks/                 # React Hooks customizados
├── lib/                   # 🛠️ Utilitários e configurações
│   ├── supabase/         # Cliente Supabase
│   ├── auth/             # Helpers de autenticação
│   └── utils/            # Funções auxiliares
├── scripts/               # 🗄️ Scripts de banco de dados
│   ├── final_setup.sql   # Setup completo multi-tenant
│   └── sample_data.sql   # Dados de exemplo
├── locales/               # 🌐 Arquivos de internacionalização
├── types/                 # 📝 Definições TypeScript
└── public/               # Assets estáticos
```

## 🔒 Segurança e Isolamento

### Row Level Security (RLS)
- ✅ **Isolamento por agência**: Agência A nunca vê dados da Agência B
- ✅ **Isolamento por cliente**: Cliente 1 nunca vê dados do Cliente 2
- ✅ **Hierarquia respeitada**: Staff da agência acessa clientes da agência
- ✅ **APIs isoladas**: Cada cliente tem suas próprias chaves de API

### Configurações de API por Cliente
```sql
-- Cada cliente tem configurações isoladas
client_api_configs:
├── Cliente A: Google Ads (chave_do_cliente_A)
├── Cliente B: Facebook + Google Analytics (chaves_do_cliente_B)
└── Cliente C: Todas as APIs configuradas (chaves_do_cliente_C)
```

## 🛠️ Instalação e Configuração

### 1. Clonar o Repositório
```bash
git clone https://github.com/FragazBR/fvstudiosdash.git
cd fvstudiosdash
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Configurar no `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 4. Configurar Banco de Dados
1. Acesse o **SQL Editor** no Supabase Dashboard
2. Cole e execute `scripts/final_setup.sql`
3. **Opcional**: Execute `scripts/sample_data.sql` para dados de teste

### 5. Executar o Projeto
```bash
pnpm dev
```

## 📊 Funcionalidades Principais

### Dashboard Contextual
- **Admin**: Estatísticas globais de todas as agências
- **Agência**: Métricas da agência + todos os clientes
- **Cliente**: Apenas seus projetos e métricas

### Métricas Automáticas
- **CTR**: (Clicks ÷ Impressions) × 100
- **CPC**: Cost ÷ Clicks
- **CPA**: Cost ÷ Conversions  
- **ROAS**: Revenue ÷ Cost

### Integrações de API
- 🔍 Google Analytics 4
- 🎯 Google Ads
- 📘 Facebook/Meta Ads
- 💼 LinkedIn Ads
- 🎵 TikTok Ads
- 🌐 Microsoft Ads (Bing)
- ⚙️ APIs customizadas por plano

### Sistema de Notificações
- 🚨 Alertas de performance das campanhas
- 📊 Relatórios automáticos
- 📅 Lembretes de reuniões
- 💰 Avisos de orçamento

## 🔧 Tecnologias Avançadas

### Banco de Dados
- **PostgreSQL** com extensões UUID e full-text search
- **Row Level Security (RLS)** para isolamento multi-tenant
- **Triggers automáticos** para auditoria e cálculos
- **Índices otimizados** para performance

### Frontend
- **Server Actions** do Next.js 14
- **Streaming** para carregamento otimizado
- **Suspense boundaries** para UX melhorada
- **Error boundaries** para tratamento de erros

### Monitoramento
- **Logs estruturados** para debug
- **Métricas de performance** do sistema
- **Alertas automáticos** para problemas

## 🎯 Casos de Uso

### Para Agências
- ✅ Gerenciar múltiplos clientes
- ✅ Dashboards white-label
- ✅ Relatórios automatizados
- ✅ Gestão de equipe
- ✅ Controle de acesso granular

### Para Clientes
- ✅ Portal próprio com métricas
- ✅ Configuração de APIs pessoais
- ✅ Comunicação com a agência
- ✅ Calendário de eventos
- ✅ Histórico de campanhas

### Para Freelancers
- ✅ Gestão pessoal de projetos
- ✅ Métricas centralizadas
- ✅ Controle de clientes
- ✅ Relatórios profissionais

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Conectar ao GitHub
# Configurar variáveis de ambiente
# Deploy automático
```

### Docker
```bash
docker build -t fvstudios-dashboard .
docker run -p 3000:3000 fvstudios-dashboard
```

## 📚 Documentação Adicional

- 📋 **[Guia de Scripts](scripts/README.md)** - Configuração do banco
- ⚙️ **[Configuração de APIs](docs/API_CONFIG.md)** - Setup das integrações
- 👥 **[Gerenciamento de Usuários](docs/USER_MANAGEMENT.md)** - Roles e permissões
- 📊 **[Sistema de Métricas](docs/METRICS.md)** - Cálculos e dashboards

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- 📧 Email: suporte@fvstudios.com
- 🐛 Issues: [GitHub Issues](https://github.com/FragazBR/fvstudiosdash/issues)
- 📖 Docs: [Documentação Completa](https://docs.fvstudios.com)

---

**FVStudios Dashboard** - Sistema profissional para agências de marketing digital 🚀

2. Criação automática de perfil na tabela `user_profiles`
3. Middleware verifica role e redireciona para área apropriada
4. Context Provider gerencia estado global do usuário
5. Tipagem automática do Supabase Client usando o tipo `Database` gerado

## 🗄️ Schema do Banco de Dados


### Tabelas Principais

- **user_profiles**: Perfis de usuário e roles
- **agencies**: Dados das agências
- **clients**: Informações dos clientes
- **projects**: Projetos e campanhas
- **tasks**: Tarefas do sistema
- **campaigns**: Campanhas de marketing
- **messages**: Sistema de mensagens
- **notifications**: Central de notificações
- **calendar_events**: Eventos do calendário

### Relacionamentos

- Agency → Users (1:N)
- Agency → Clients (1:N)
- Client → Projects (1:N)
- Project → Tasks (1:N)
- User → Tasks (N:N via assigned_to)

## 🛠️ Setup e Instalação

### Pré-requisitos

- Node.js 18+
- pnpm
- Conta no Supabase

### 1. Clone o repositório

```bash
git clone <repository-url>
cd fvstudiosdash
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure o Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Copie `.env.local.example` para `.env.local`
3. Adicione suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 4. Configure o banco de dados

1. No dashboard do Supabase, vá para SQL Editor
2. Execute o script `supabase/migrations/001_complete_schema.sql`
3. Execute o script `supabase/seed.sql` para dados de exemplo

### 5. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🔐 Autenticação e Segurança


### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS configuradas:

- **user_profiles**: Usuários só acessam seu próprio perfil
- **projects**: Acesso baseado em agency_id ou client_id
- **tasks**: Acesso para assignees e membros do projeto
- **messages**: Apenas sender e receiver
## 📝 Tipagem Automática do Supabase Client

Para garantir segurança de tipos e alinhamento com o schema real do Supabase, utilize o tipo `Database` gerado automaticamente:

1. Gere os tipos:
   ```bash
   npx supabase gen types typescript --project-id "SEU_PROJECT_ID" --schema public > types/supabase.ts
   ```
2. Importe e use no seu client:
   ```ts
   import { createClient } from '@supabase/supabase-js'
   import type { Database } from '@/types/supabase'

   export const supabase = createClient<Database>(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   ```

Assim, todas as queries e inserts terão tipagem automática baseada no seu schema real.

### Middleware de Proteção

O middleware (`middleware.ts`) protege rotas baseado em:

1. Status de autenticação
2. Role do usuário
3. Propriedade de recursos (ex: client só acessa seus projetos)

## 📋 Funcionalidades Principais

### Dashboard
- Métricas e estatísticas
- Gráficos de performance
- Atividades recentes
- Quick actions

### Projetos
- CRUD completo de projetos
- Timeline e milestones
- Arquivamento de projetos
- Status tracking

### Tarefas
- Kanban board interativo
- Atribuição de tarefas
- Filtros e ordenação
- Notificações automáticas

### Calendário
- Visualização de eventos
- Agendamento de reuniões
- Integração com projetos
- Lembretes automáticos

### Mensagens
- Chat em tempo real
- Anexos de arquivos
- Histórico de conversas
- Notificações push

### Clientes
- Gerenciamento de clientes
- Portal do cliente
- Histórico de projetos
- Comunicação direta

## 🌐 Internacionalização

O sistema suporta múltiplos idiomas:

- **Português** (pt)
- **Inglês** (en)
- **Espanhol** (es)

### Uso

```tsx
import { useTranslation } from 'react-i18next'

function Component() {
  const { t } = useTranslation()
  return <p>{t('welcome')}</p>
}
```

## 🎨 Temas e UI

### Sistema de Temas
- Light mode
- Dark mode
- Persistência via localStorage

### Componentes
- Design system consistente
- Componentes reutilizáveis
- Responsivo (mobile-first)
- Acessibilidade (a11y)

## 📱 Responsividade

O sistema é totalmente responsivo:

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Start (produção)
pnpm start

# Lint
pnpm lint

# Type check
pnpm type-check
```

## 📊 Monitoramento e Analytics

### Métricas Implementadas
- Projetos ativos/concluídos
- Performance de tarefas
- Atividade de usuários
- Revenue tracking

### Dashboards por Role
- **Admin**: Métricas globais
- **Agency**: Performance da agência
- **Client**: Status de projetos
- **Personal**: Produtividade pessoal

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório no Vercel
2. Adicione as variáveis de ambiente
3. Deploy automático

### Outras Plataformas

- Netlify
- Railway
- DigitalOcean App Platform

## 🔄 Atualizações e Migrações

### Versionamento do Schema

1. Crie nova migração em `supabase/migrations/`
2. Teste localmente
3. Aplique em produção via Supabase CLI

### Processo de Update

```bash
# Backup do banco
supabase db dump > backup.sql

# Aplicar migração
supabase db push

# Verificar integridade
supabase db lint
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de cookie**: Limpe cookies do navegador
2. **Erro de autenticação**: Verifique credenciais do Supabase
3. **Erro 404**: Verifique se as rotas existem no middleware

### Debug

```bash
# Logs do desenvolvimento
pnpm dev

# Build com debug
pnpm build --debug

# Verificar tipos
pnpm type-check
```

## 📚 Recursos Adicionais

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**FVSTUDIOS**
- Website: [fvstudios.com](https://fvstudios.com)
- Email: contato@fvstudios.com

---

🔥 **Sistema completo para gerenciamento de agências criativas e projetos pessoais**
