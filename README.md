# 🎯 FVStudios Dashboard

**Plataforma SaaS completa para agências de marketing digital, produtores independentes e influenciadores**

Sistema multi-tenant com autenticação robusta, permissões granulares, gestão de equipes, integração com APIs externas e monetização integrada via Stripe.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-red)](https://redis.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-blueviolet)](https://openai.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Business-25D366)](https://business.whatsapp.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4)](https://tailwindcss.com/)

---

## 🚀 Recursos Principais

### 🏢 **Multi-Tenant Avançado**
- **9 tipos de usuários** com permissões granulares
- **Isolamento completo** de dados por cliente
- **Gestão de equipes** com convites e criação direta

### 🔗 **Integrações de API**
- **Meta Ads** (Facebook/Instagram)
- **Google Ads** 
- **TikTok Ads**
- **LinkedIn Ads**
- **RD Station** (CRM/Email Marketing)
- **Buffer** (Social Media)
- **WhatsApp Business API** (Mensagens automáticas)
- **Criptografia AES-256** para tokens
- **Validação automática** e renovação de tokens

### 🎛️ **Sistema Inteligente**
- **Recomendações IA** para tarefas
- **Análise preditiva** de prazos
- **Automação inteligente** de projetos
- **Templates com IA**
- **Assistente de otimização** de recursos
- **Sistema de créditos** com integração OpenAI

### 📊 **Analytics Executivo & Monitoramento**
- **Dashboard executivo** com KPIs estratégicos
- **Monitoramento em tempo real** do sistema
- **Sistema de alertas inteligentes** configuráveis
- **Backup automático** com recovery completo
- **Compliance GDPR/LGPD** e auditoria
- **Cache Redis** distribuído para performance
- **Logs estruturados** com análise avançada

### 💬 **Comunicação Inteligente**
- **WhatsApp Business** integrado
- **Templates de mensagens** personalizáveis
- **Notificações automáticas** por etapa de projeto
- **Sistema de triggers** baseado em eventos
- **Chatbot com IA** para atendimento

### 💰 **Monetização**
- **Integração Stripe** completa
- **Planos flexíveis** (Gratuito, Básico, Pro, Enterprise)
- **Cobrança automática**
- **Gestão de assinaturas**
- **Sistema de créditos** para IA

---

## 🎭 Hierarquia de Usuários

```mermaid
graph TD
    A[👑 Admin] --> B[🏢 Agency Owner]
    A --> E[🎯 Independent Producer] 
    A --> G[⭐ Influencer]
    A --> H[🆓 Free User]
    
    B --> C[👨‍💼 Agency Manager]
    B --> D[👨‍💻 Agency Staff]
    B --> F[🤝 Agency Client]
    
    E --> I[🤝 Independent Client]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style E fill:#45b7d1
    style G fill:#96ceb4
    style H fill:#ffeaa7
```

| Role | Descrição | Dashboard | Integrações API |
|------|-----------|-----------|-----------------|
| 👑 **admin** | Administrador global | `/admin` | ✅ Todas (visão global) |
| 🏢 **agency_owner** | Proprietário de agência | `/agency` | ✅ Clientes da agência |
| 👨‍💼 **agency_manager** | Gerente de agência | `/agency` | ✅ Clientes da agência |
| 👨‍💻 **agency_staff** | Funcionário de agência | `/agency` | 👁️ Visualização apenas |
| 🤝 **agency_client** | Cliente de agência | `/client` | ✅ Próprias integrações |
| 🎯 **independent_producer** | Produtor independente | `/independent` | ✅ Próprias integrações |
| 🤝 **independent_client** | Cliente de produtor | `/client` | ✅ Próprias integrações |
| ⭐ **influencer** | Influenciador digital | `/influencer` | ✅ Próprias integrações |
| 🆓 **free_user** | Usuário gratuito | `/dashboard` | ✅ Próprias integrações |

---

## 🛠️ Instalação Rápida

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL (ou Supabase)
- Conta Stripe (para pagamentos)

### **1. Clone o Repositório**
```bash
git clone https://github.com/yourusername/fvstudiosdash.git
cd fvstudiosdash
npm install
```

### **2. Configuração do Banco de Dados**
```bash
# Execute a migração completa
psql $DATABASE_URL -f database/COMPLETE_MIGRATION.sql

# Ou use o Supabase
npx supabase db reset
```

### **3. Variáveis de Ambiente**
```bash
cp .env.example .env.local
```

Configure as variáveis obrigatórias:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cache Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# IA e Automação
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION=org-...

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret

# APIs Externas
META_CLIENT_ID=your_meta_client_id
META_CLIENT_SECRET=your_meta_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Criptografia
ENCRYPTION_MASTER_KEY=your_64_char_hex_key

# Sistema de Logs e Monitoramento
LOG_LEVEL=info
ENABLE_STRUCTURED_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true

# Backup e Recovery
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key
BACKUP_RETENTION_DAYS=90
ENABLE_AUTO_BACKUP=true
```

### **4. Executar o Projeto**
```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## 📁 Estrutura do Projeto

```
fvstudiosdash/
├── 📱 app/                          # Next.js App Router
│   ├── 🔐 api/                      # API Routes
│   │   ├── alerts/                  # Sistema de alertas
│   │   ├── api-integrations/        # Gestão de integrações
│   │   ├── backup/                  # Backup e recovery
│   │   ├── cache/                   # Cache Redis
│   │   ├── compliance/              # Compliance GDPR/LGPD
│   │   ├── executive/               # Analytics executivo
│   │   ├── logs/                    # Sistema de logs
│   │   ├── oauth/                   # Fluxos OAuth
│   │   ├── realtime-notifications/  # Notificações tempo real
│   │   ├── system/                  # Health checks
│   │   ├── whatsapp/                # WhatsApp Business API
│   │   └── webhooks/                # Webhooks de terceiros
│   ├── 👑 admin/                    # Painel administrativo
│   ├── 🏢 agency/                   # Dashboard agências
│   ├── 💾 backup/                   # Interface backup & recovery
│   ├── 📊 cache/performance/        # Dashboard performance cache
│   ├── 📋 compliance/               # Dashboard compliance
│   ├── 📈 executive/                # Analytics executivo
│   ├── 🖥️ monitoring/               # Monitoramento sistema
│   ├── 📱 social-media/             # Integrações sociais
│   ├── 💬 whatsapp/                 # Config WhatsApp Business
│   └── 🎯 [outros dashboards]/
├── 🧩 components/                   # Componentes React
│   ├── ui/                          # Componentes base
│   ├── alerts-dashboard.tsx         # Dashboard de alertas
│   ├── api-integrations.tsx         # Interface de integrações
│   ├── backup-recovery-dashboard.tsx # Backup & recovery
│   ├── cache-performance-dashboard.tsx # Performance cache
│   ├── compliance-dashboard.tsx     # Compliance & auditoria
│   ├── credits-dashboard.tsx        # Sistema de créditos IA
│   ├── executive-dashboard.tsx      # Analytics executivo
│   ├── project-notification-demo.tsx # Demo notificações
│   ├── sidebar.tsx                  # Navegação principal
│   ├── system-monitoring-dashboard.tsx # Monitoramento
│   └── whatsapp-template-manager.tsx # Templates WhatsApp
├── 🗄️ database/                     # Scripts de banco
│   ├── alert_system.sql             # Sistema de alertas
│   ├── backup_system.sql            # Backup & recovery
│   ├── client_notifications.sql     # Notificações cliente
│   ├── compliance_system.sql        # Compliance & auditoria
│   ├── COMPLETE_MIGRATION.sql       # Migração completa
│   ├── logging_system.sql           # Sistema de logs
│   └── schemas/                     # Schemas organizados
├── 📚 lib/                          # Utilitários
│   ├── advanced-logger.ts           # Sistema de logs avançado
│   ├── alert-system.ts              # Sistema de alertas
│   ├── audit-system.ts              # Sistema de auditoria
│   ├── backup-recovery-system.ts    # Backup & recovery
│   ├── encryption.ts                # Criptografia de tokens
│   ├── executive-analytics.ts       # Analytics executivo
│   ├── job-scheduler.ts             # Jobs automáticos
│   ├── project-notification-triggers.ts # Triggers notificações
│   ├── redis-cache.ts               # Cache Redis
│   ├── whatsapp-notifications.ts    # Notificações WhatsApp
│   └── whatsapp-template-engine.ts  # Engine templates
├── 📖 docs/                         # Documentação
└── 🔧 scripts/                      # Scripts de manutenção
```

---

## 🏢 Sistemas Empresariais

### 📊 **Analytics Executivo** (`/executive`)
- **KPIs estratégicos** em tempo real (receita, projetos, usuários)
- **Performance do sistema** (response time, error rate, cache)
- **Métricas de negócio** (novos clientes, churn, satisfação)
- **Segurança & compliance** (alertas, backup health, score)
- **Gráficos de tendência** interativos (30 dias)
- **Toggle agência/global** para diferentes escopos

### 🚨 **Sistema de Alertas Inteligentes**
- **Regras configuráveis** por tipo e severidade
- **Múltiplos canais** (email, SMS, WhatsApp, Slack, dashboard)
- **Cooldown automático** para evitar spam
- **Condições complexas** com operadores lógicos
- **Escalação automática** para alertas críticos
- **Templates personalizáveis** por canal

### 💾 **Backup & Recovery** (`/backup`)
- **Backups automáticos** com agendamento
- **Múltiplos tipos** (completo, incremental, crítico)
- **Criptografia AES-256** dos dados
- **Compressão inteligente** para economia de espaço
- **Recovery seletivo** por tabelas ou períodos
- **Validação de integridade** automática
- **Dashboard de monitoramento** com alertas

### 📋 **Compliance & Auditoria** (`/compliance`)
- **Conformidade GDPR/LGPD** automatizada
- **Trilha de auditoria** completa
- **Relatórios de compliance** automatizados
- **Monitoramento de consentimento** do usuário
- **Logs de acesso** detalhados
- **Classificação de dados** sensíveis
- **Score de compliance** em tempo real

### 🖥️ **Monitoramento de Sistema** (`/monitoring`)
- **Métricas em tempo real** (CPU, memória, disco)
- **Health checks** automáticos
- **Logs estruturados** com busca avançada
- **Performance de APIs** com análise de latência
- **Alertas proativos** baseados em thresholds
- **Dashboard unificado** de infraestrutura

### ⚡ **Cache Redis Distribuído** (`/cache/performance`)
- **Hit rate otimizado** com análise inteligente
- **Invalidação por tags** para controle granular
- **Compressão automática** de dados grandes
- **TTL dinâmico** baseado em padrões de uso
- **Rate limiting** integrado nas APIs
- **Métricas detalhadas** de performance

### 💬 **WhatsApp Business Integrado**
- **API oficial** do WhatsApp Business
- **Templates dinâmicos** com variáveis
- **Triggers automáticos** por evento de projeto
- **Conversas organizadas** por cliente
- **Analytics de entrega** e engajamento
- **Chatbot com IA** para atendimento básico

---

## 🔗 Integrações de API

### **Configuração de Integrações**

O sistema permite que cada **cliente individual** configure suas próprias integrações com total **isolamento de dados**.

#### **Providers Suportados:**

| Provider | Tipo | OAuth 2.0 | Recursos |
|----------|------|-----------|----------|
| 🔵 **Meta Ads** | Ads | ✅ | Campanhas FB/IG, Insights, Gestão de Anúncios |
| 🔴 **Google Ads** | Ads | ✅ | Campanhas Search/Display, Relatórios, Keywords |
| ⚫ **TikTok Ads** | Ads | ✅ | Campanhas TikTok, Criativos, Métricas |
| 🔵 **LinkedIn Ads** | Ads | ✅ | Campanhas B2B, Lead Gen, Targeting |
| 🟠 **RD Station** | CRM | ✅ | Leads, Email Marketing, Automação |
| 🟡 **Buffer** | Social | ✅ | Agendamento Posts, Analytics |

#### **Segurança das Integrações:**
- 🔐 **Criptografia AES-256-GCM** para todos os tokens
- 🔄 **Renovação automática** de tokens expirados
- 📊 **Logs detalhados** de todas as requisições
- 🛡️ **Row Level Security** no banco de dados

### **Como Configurar:**

1. **Acesse**: `/social-media/api-integrations`
2. **Clique** em "Conectar" no provider desejado
3. **Autorize** o acesso via OAuth
4. **Configure** as preferências de sincronização

---

## 🎛️ Sistema Inteligente

### **IA e Automação**

O FVStudios possui um sistema inteligente integrado que oferece:

#### **1. Recomendações Inteligentes**
- Sugestão de tarefas baseada no histórico
- Identificação de gargalos de produção
- Otimização de prazos automaticamente

#### **2. Análise Preditiva**
- Previsão de atrasos em projetos
- Estimativa de conclusão baseada em dados históricos
- Alertas proativos de riscos

#### **3. Assistente IA**
- Otimização de alocação de recursos
- Sugestões de melhoria de processos
- Análise de performance da equipe

#### **4. Automação Inteligente**
- Templates dinâmicos que se adaptam
- Criação automática de projetos recorrentes
- Workflows inteligentes

#### **5. Central de Templates IA**
- Templates que aprendem com o uso
- Sugestões personalizadas por tipo de projeto
- Otimização contínua de processos

---

## 🔐 Segurança e Permissões

### **Sistema de Autenticação**
- **Supabase Auth** com email/senha
- **Row Level Security (RLS)** em todas as tabelas
- **Policies** granulares por role
- **JWT tokens** seguros

### **Isolamento de Dados**
- **Multi-tenancy** com isolamento total
- **Client-specific data** - cada cliente vê apenas seus dados
- **Agency-level isolation** - agências não veem dados umas das outras
- **Admin oversight** - admins têm visão global quando necessário

### **Criptografia**
- **AES-256-GCM** para dados sensíveis
- **PBKDF2** para derivação de chaves
- **Salt** únicos por registro
- **Master key** gerenciada via variáveis de ambiente

---

## 💰 Sistema de Monetização

### **Integração Stripe**
- **Assinaturas recorrentes**
- **Múltiplos planos** (Free, Basic, Pro, Enterprise)
- **Upgrade/downgrade** automático
- **Webhooks** para sincronização de status

### **Planos Disponíveis**
| Plano | Preço | Usuários | Integrações | Recursos Especiais |
|-------|-------|----------|-------------|-------------------|
| 🆓 **Free** | R$ 0/mês | 1 | 2 | Recursos básicos |
| 📋 **Basic** | R$ 97/mês | 5 | 5 | Relatórios avançados |
| 🚀 **Pro** | R$ 197/mês | 15 | Ilimitadas | IA + Automação |
| 🏢 **Enterprise** | R$ 497/mês | Ilimitados | Ilimitadas | Tudo + Suporte prioritário |

---

## 📊 Analytics e Relatórios

### **Dashboard em Tempo Real**
- **KPIs principais** atualizados automaticamente
- **Gráficos interativos** com Chart.js/D3.js
- **Filtros avançados** por período, cliente, projeto

### **Relatórios Disponíveis**
- 📈 **Performance de Campanhas** (ROI, CPC, CTR)
- 👥 **Gestão de Equipe** (produtividade, tarefas)
- 💰 **Financeiro** (receitas, custos, margens)
- 📱 **Social Media** (engajamento, alcance)
- 🎯 **Conversões** (leads, vendas, funil)

---

## 🔧 Scripts de Manutenção

### **Comandos Úteis**
```bash
# Reset completo do banco (desenvolvimento)
npm run db:reset

# Migração completa
npm run db:migrate

# Executar apenas sistema inteligente
npm run db:intelligent

# Verificar integridade
npm run db:check

# Backup
npm run db:backup
```

### **Scripts SQL Disponíveis**
- `database/COMPLETE_MIGRATION.sql` - Migração completa do zero
- `database/INTELLIGENT_SYSTEM.sql` - Apenas sistema inteligente
- `database/API_INTEGRATIONS.sql` - Apenas integrações de API
- `scripts/DIAGNOSTIC.sql` - Verificação do sistema

---

## 🚀 Deploy e Produção

### **Vercel (Recomendado)**
```bash
npm run build
npx vercel --prod
```

### **Docker**
```bash
docker build -t fvstudios-dashboard .
docker run -p 3000:3000 fvstudios-dashboard
```

### **Variáveis de Produção**
```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_secret_key
DATABASE_URL=postgresql://...
ENABLE_JOB_SCHEDULER=true
```

---

## 📚 Documentação Adicional

- 📖 [**Índice Completo da Documentação**](docs/README.md)
- 🏢 [**Sistemas Empresariais Detalhados**](docs/ENTERPRISE_SYSTEMS.md)
- 🔐 [**Arquitetura de Segurança**](docs/SECURITY.md) _(em breve)_
- 🔗 [**Guia de Integrações API**](docs/API_INTEGRATIONS.md) _(em breve)_
- 🤖 [**Sistema Inteligente**](docs/INTELLIGENT_SYSTEM.md) _(em breve)_
- 🎭 [**Gestão de Usuários**](docs/USER_MANAGEMENT.md) _(em breve)_

## 🎯 Status Atual do Projeto

### ✅ **Sistemas Implementados e Funcionais**

#### 🏢 **Infraestrutura Empresarial**
- ✅ **Analytics Executivo** - Dashboard estratégico com KPIs
- ✅ **Sistema de Alertas** - Monitoramento inteligente configurável
- ✅ **Backup & Recovery** - Sistema completo com criptografia
- ✅ **Compliance GDPR/LGPD** - Auditoria e conformidade automatizada
- ✅ **Monitoramento de Sistema** - Métricas em tempo real
- ✅ **Cache Redis** - Performance otimizada com invalidação inteligente

#### 💬 **Comunicação Inteligente**  
- ✅ **WhatsApp Business API** - Integração completa
- ✅ **Templates Dinâmicos** - Mensagens personalizáveis
- ✅ **Notificações Automáticas** - Triggers por evento de projeto
- ✅ **Sistema de Créditos IA** - Integração OpenAI

#### 🔗 **Integrações Robustas**
- ✅ **Meta Ads** (Facebook/Instagram)
- ✅ **Google Ads** com keywords e campanhas
- ✅ **Multi-tenant** com isolamento completo
- ✅ **Criptografia AES-256** para tokens
- ✅ **Rate Limiting** e middleware de segurança

### 🚧 **Próximos Sistemas (Pendentes)**
- 🔄 **Sistema de Configuração Global** - Centralizar settings
- 🔄 **Sistema de Webhooks** - APIs customizadas para integrações
- 🔄 **Integração com Slack** - Notificações em canais específicos

### 📊 **Métricas do Projeto**
- **🗄️ Database Tables:** 50+ tabelas com RLS completo
- **🔧 API Endpoints:** 80+ rotas implementadas  
- **📱 UI Components:** 30+ dashboards e componentes
- **🏗️ Architecture:** Enterprise-grade com alta disponibilidade
- **📈 Performance:** Cache Redis + otimizações avançadas
- **🔒 Security:** Compliance GDPR/LGPD + auditoria completa

---

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

- 📧 **Email**: suporte@fvstudios.com.br
- 💬 **Discord**: [FVStudios Community](https://discord.gg/fvstudios)
- 📖 **Documentação**: [docs.fvstudios.com.br](https://docs.fvstudios.com.br)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/fvstudiosdash/issues)

---

**⭐ Se este projeto te ajudou, deixe uma star no GitHub!**

*Desenvolvido com ❤️ pela equipe FVStudios*