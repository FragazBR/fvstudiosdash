# FVSTUDIOS Dashboard

Sistema de gerenciamento completo para agências criativas, clientes e projetos pessoais.

## 🚀 Tecnologias

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: Shadcn/ui components, Lucide icons
- **Internacionalização**: i18next (pt, en, es)
- **Estado**: React Context + Hooks
- **Autenticação**: Supabase Auth

## 📁 Estrutura do Projeto

```
├── app/                    # App Router do Next.js
│   ├── admin/             # Painel administrativo
│   ├── dashboard/         # Dashboard principal (agency/user)
│   ├── client/           # Área do cliente
│   ├── personal/         # Área pessoal
│   ├── projects/         # Gerenciamento de projetos
│   ├── tasks/            # Gerenciamento de tarefas
│   ├── calendar/         # Calendário de eventos
│   ├── messages/         # Sistema de mensagens
│   ├── contacts/         # Gerenciamento de contatos
│   ├── notifications/    # Central de notificações
│   ├── login/            # Página de login
│   └── signup/           # Página de registro
├── components/            # Componentes React reutilizáveis
├── hooks/                # React Hooks customizados
├── lib/                  # Utilitários e configurações
├── supabase/             # Migrações e seeds do banco
├── locales/              # Arquivos de tradução
└── public/               # Assets estáticos
```

## 🏗️ Arquitetura do Sistema

### Roles de Usuário

1. **Admin**: Acesso total ao sistema
2. **Agency**: Gerencia projetos, clientes e equipe
3. **User**: Membro da agência, acesso a projetos atribuídos
4. **Client**: Visualiza seus projetos e interage com a agência
5. **Personal**: Usuário pessoal, gerencia suas próprias tarefas

### Fluxo de Autenticação

1. Login via Supabase Auth
2. Criação automática de perfil na tabela `profiles`
3. Middleware verifica role e redireciona para área apropriada
4. Context Provider gerencia estado global do usuário

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

- **profiles**: Perfis de usuário e roles
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

- **profiles**: Usuários só acessam seu próprio perfil
- **projects**: Acesso baseado em agency_id ou client_id
- **tasks**: Acesso para assignees e membros do projeto
- **messages**: Apenas sender e receiver

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
