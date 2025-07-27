# 🏢 Sistemas Empresariais - FVStudios Dashboard

Documentação completa dos sistemas empresariais implementados para monitoramento, análise e otimização da plataforma.

---

## 📊 Analytics Executivo

### Visão Geral
Dashboard estratégico com KPIs de alto nível para tomada de decisão executiva.

**URL:** `/executive`  
**Acesso:** Apenas administradores  

### Métricas Disponíveis

#### 🔍 **Overview**
- **Receita do mês** com crescimento percentual
- **Total de projetos** ativos
- **Usuários ativos** (últimos 30 dias)
- **Score de saúde do sistema** (0-100%)
- **Uptime da plataforma**

#### ⚡ **Performance**
- **Tempo de resposta médio** das APIs
- **Taxa de erro** percentual
- **Cache hit rate** do Redis
- **Uso de memória e CPU**
- **Conexões ativas do banco**

#### 💼 **Negócio**
- **Novos clientes** do mês
- **Taxa de churn** percentual
- **Satisfação do cliente** (1-5)
- **Valor médio por projeto**
- **Taxa de conversão**
- **MRR** (Monthly Recurring Revenue)

#### 🔐 **Segurança**
- **Alertas ativos** críticos
- **Score de compliance** GDPR/LGPD
- **Tentativas de login falhadas**
- **Saúde dos backups**
- **Incidentes de segurança**

### APIs Disponíveis
```typescript
GET /api/executive/metrics?scope=agency|global
GET /api/executive/trends?metric=projects&days=30
GET /api/executive/alerts?limit=10
```

---

## 🚨 Sistema de Alertas Inteligentes

### Visão Geral
Sistema configurável de alertas com múltiplos canais e regras inteligentes.

### Recursos Principais

#### 📋 **Regras de Alerta**
- **Tipos:** performance, security, system, business, compliance
- **Severidades:** info, warning, error, critical
- **Condições:** gt, lt, eq, gte, lte, contains
- **Cooldown:** Tempo entre alertas da mesma regra

#### 📢 **Canais de Notificação**
- **Dashboard:** Notificações em tempo real
- **Email:** Templates personalizados
- **WhatsApp:** Integração Business API
- **Slack:** Webhooks configuráveis
- **SMS:** Para alertas críticos
- **Webhook:** APIs customizadas

#### 🎯 **Exemplos de Regras**
```json
{
  "name": "High Error Rate",
  "conditions": [
    {
      "metric": "error_rate",
      "operator": "gt", 
      "value": 5,
      "timeframe_minutes": 15
    }
  ],
  "notification_channels": ["dashboard", "email"],
  "cooldown_minutes": 30
}
```

### APIs Disponíveis
```typescript
GET /api/alerts/rules
POST /api/alerts/rules
GET /api/alerts/list
POST /api/alerts/acknowledge
```

---

## 💾 Backup & Recovery

### Visão Geral
Sistema completo de backup automático com criptografia e recovery seletivo.

**URL:** `/backup`

### Tipos de Backup

#### 📦 **Completo**
- Todas as tabelas e dados
- Executado semanalmente
- Tempo estimado: 15-30 minutos

#### 🔄 **Incremental** 
- Apenas dados modificados
- Executado diariamente
- Tempo estimado: 2-5 minutos

#### ⚡ **Crítico**
- Apenas tabelas essenciais
- Executado a cada 6 horas
- Tempo estimado: 1-2 minutos

### Recursos de Segurança

#### 🔐 **Criptografia**
- **AES-256-GCM** para dados
- **PBKDF2** para derivação de chaves
- **Salt** único por backup
- **Checksum** para validação de integridade

#### 🗂️ **Compressão**
- **Gzip** automático
- Redução média de 60-80%
- Otimização por tipo de dados

### Recovery Seletivo
```typescript
// Recuperar tabelas específicas
POST /api/backup/recover
{
  "backup_id": "uuid",
  "tables": ["projects", "clients"],
  "recovery_type": "partial_restore"
}
```

---

## 📋 Compliance & Auditoria

### Visão Geral
Sistema automatizado de compliance GDPR/LGPD com trilha de auditoria completa.

**URL:** `/compliance`

### Recursos de Compliance

#### 🇪🇺 **GDPR (Europa)**
- **Consentimento** rastreado
- **Right to be forgotten** automatizado
- **Data portability** export
- **Breach notification** automática

#### 🇧🇷 **LGPD (Brasil)**
- **Bases legais** documentadas
- **Relatórios mensais** automáticos
- **DPO toolkit** integrado
- **Compartilhamento** controlado

### Trilha de Auditoria

#### 📝 **Eventos Auditados**
- Login/logout de usuários
- Modificações de dados sensíveis
- Acessos a arquivos críticos
- Mudanças de permissões
- Execução de backups
- Alterações de configuração

#### 🔍 **Busca Avançada**
```typescript
GET /api/audit/search?
  user_id=123&
  action=data_access&
  start_date=2024-01-01&
  end_date=2024-01-31&
  resource_type=client_data
```

### Score de Compliance
- **Cálculo automático** (0-100%)
- **Fatores avaliados:** consentimentos, políticas, acessos
- **Relatórios mensais** para DPO
- **Alertas** para não conformidades

---

## 🖥️ Monitoramento de Sistema

### Visão Geral
Dashboard unificado de infraestrutura com métricas em tempo real.

**URL:** `/monitoring`

### Métricas Coletadas

#### 🖥️ **Sistema**
- **CPU:** Uso por core e médio
- **Memória:** Uso, disponível, swap
- **Disco:** Espaço, I/O, latência
- **Rede:** Throughput, latência, erros

#### 🌐 **Aplicação**
- **Response time** por endpoint
- **Throughput** de requisições
- **Error rate** por status code
- **Database connections** ativas

#### 📊 **Business**
- **Usuários ativos** em tempo real
- **Operações por minuto**
- **Revenue per minute**
- **Conversion rate** atual

### Health Checks Automáticos
```typescript
// Verificações executadas a cada 30 segundos
const healthChecks = {
  database: "SELECT 1",
  redis: "PING",
  apis: ["GET /api/health"],
  integrations: ["meta", "google", "whatsapp"]
}
```

### Alertas Proativos
- **CPU > 80%** por 5 minutos
- **Memória > 90%** por 2 minutos
- **Response time > 2s** por 10 minutos  
- **Error rate > 5%** por 15 minutos

---

## ⚡ Cache Redis Distribuído

### Visão Geral
Sistema de cache inteligente com invalidação por tags e otimização automática.

**URL:** `/cache/performance`

### Estratégias de Cache

#### 🎯 **Cache Patterns**
- **Read-through:** Busca automática em miss
- **Write-behind:** Escrita assíncrona
- **Refresh-ahead:** Renovação proativa
- **Circuit breaker:** Fallback em falhas

#### 🏷️ **Tag-based Invalidation**
```typescript
// Cache com tags para invalidação seletiva
cache.set('user:123', userData, {
  ttl: 3600,
  tags: ['user:123', 'agency:456', 'profile']
})

// Invalidar todos os caches do usuário
cache.invalidateByTags(['user:123'])
```

### Otimizações Inteligentes

#### 📈 **TTL Dinâmico**
- **Dados frequentes:** TTL estendido
- **Dados raros:** TTL reduzido
- **Padrões de acesso:** Machine learning aplicado

#### 🗜️ **Compressão Automática**
- **Dados > 1KB:** Gzip automático
- **JSON grandes:** Compressão específica
- **Strings repetitivas:** Dictionary compression

### Rate Limiting Integrado
```typescript
// Rate limiting por usuário/IP
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests
  keyGenerator: (req) => req.user?.id || req.ip
}
```

---

## 💬 WhatsApp Business Integrado

### Visão Geral
Integração completa com WhatsApp Business API para comunicação automatizada.

### Recursos Principais

#### 📱 **API Oficial**
- **Cloud API** do Meta
- **Webhooks** em tempo real
- **Status de entrega** rastreado
- **Templates aprovados** pelo WhatsApp

#### 🎭 **Templates Dinâmicos**
```typescript
// Template com variáveis
const template = {
  name: "project_update",
  language: "pt_BR",
  components: [
    {
      type: "body",
      parameters: [
        { type: "text", text: "{{client_name}}" },
        { type: "text", text: "{{project_name}}" },
        { type: "text", text: "{{status}}" }
      ]
    }
  ]
}
```

#### 🤖 **Triggers Automáticos**
- **Projeto criado:** Mensagem de boas-vindas
- **Status alterado:** Notificação de progresso
- **Prazo próximo:** Alerta de deadline
- **Projeto concluído:** Mensagem de encerramento

### Analytics Integrado
- **Taxa de entrega** por template
- **Tempo de leitura** médio
- **Taxa de resposta** dos clientes
- **Conversões** por campanha

---

## 🛠️ Configuração e Deploy

### Variáveis de Ambiente
```env
# Redis
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# OpenAI
OPENAI_API_KEY=sk-your_api_key
OPENAI_ORGANIZATION=org-your_org

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Backup
BACKUP_ENCRYPTION_KEY=your_backup_key
BACKUP_RETENTION_DAYS=90

# Webhooks
WEBHOOK_SIGNATURE_SECRET=your_webhook_secret
ENABLE_WEBHOOK_LOGGING=true

# Global Settings
ENABLE_GLOBAL_SETTINGS=true
SETTINGS_ENCRYPTION_KEY=your_settings_key
```

### Scripts de Migração
```bash
# Executar todas as migrações dos sistemas
psql $DATABASE_URL -f database/alert_system.sql
psql $DATABASE_URL -f database/backup_system.sql
psql $DATABASE_URL -f database/compliance_system.sql
psql $DATABASE_URL -f database/logging_system.sql
psql $DATABASE_URL -f database/client_notifications.sql
psql $DATABASE_URL -f database/global_settings_system.sql
psql $DATABASE_URL -f database/webhook_system.sql
```

### Monitoramento de Deploy
```bash
# Health check completo
curl -f http://localhost:3000/api/system/health

# Verificar cache Redis
curl -f http://localhost:3000/api/cache/metrics

# Testar WhatsApp
curl -f http://localhost:3000/api/whatsapp/health

# Verificar webhooks
curl -f http://localhost:3000/api/webhooks/stats

# Testar configurações globais
curl -f http://localhost:3000/api/settings/global
```

---

## 🔗 Sistema de Webhooks

### Visão Geral
Sistema completo de webhooks para integrações externas com 15+ tipos de eventos predefinidos.

**URL:** `/settings/webhooks`
**Acesso:** Administradores

### Recursos Principais

#### 📋 **Configuração de Webhooks**
- **CRUD completo** de webhooks
- **Múltiplos métodos HTTP** (GET, POST, PUT, PATCH, DELETE)
- **Headers personalizáveis** por webhook
- **Timeout configurável** (1-300 segundos)
- **Retry automático** com delay configurável

#### 🔐 **Segurança**
```typescript
// Assinatura HMAC SHA-256
const signature = crypto
  .createHmac('sha256', secret_token)
  .update(payload)
  .digest('hex')
  
headers['X-FVStudios-Signature'] = signature
```

#### 🎯 **Tipos de Eventos**
- **Projeto:** created, updated, completed, deleted
- **Tarefa:** created, updated, completed
- **Cliente:** created, updated
- **Usuário:** created, login
- **Pagamento:** received, failed
- **Sistema:** backup_completed, alert_triggered

#### 📊 **Monitoramento**
- **Dashboard em tempo real** com estatísticas
- **Taxa de sucesso** por webhook
- **Histórico completo** de execuções
- **Logs detalhados** de requests/responses
- **Métricas de performance** (duração, status codes)

### APIs Disponíveis
```typescript
GET /api/webhooks                    // Listar webhooks
POST /api/webhooks                   // Criar webhook
GET /api/webhooks/[id]              // Buscar webhook específico
PUT /api/webhooks/[id]              // Atualizar webhook
DELETE /api/webhooks/[id]           // Deletar webhook
POST /api/webhooks/[id]/test        // Testar webhook
GET /api/webhooks/events            // Histórico de eventos
POST /api/webhooks/events           // Disparar evento manual
POST /api/webhooks/events/[id]/retry // Repetir evento
GET /api/webhooks/event-types       // Tipos de eventos
GET /api/webhooks/stats             // Estatísticas
```

---

## ⚙️ Configurações Globais

### Visão Geral
Sistema centralizado de configurações com hierarquia agência/global e interface administrativa.

**URL:** `/settings/global`
**Acesso:** Administradores

### Recursos Principais

#### 🏗️ **Hierarquia de Configurações**
```typescript
// Sistema de precedência
const finalValue = getAgencySetting(key) || getGlobalSetting(key) || defaultValue
```

#### 📝 **Categorias de Settings**
- **Sistema:** Configurações técnicas (timeouts, limits)
- **Integração:** APIs, webhooks, tokens
- **Notificação:** Templates, canais, frequência  
- **Backup:** Retenção, frequência, criptografia
- **Compliance:** GDPR/LGPD, auditoria, logs

#### 🔄 **Templates Reutilizáveis**
```json
{
  "template_name": "Standard Agency Setup",
  "category": "agency_defaults",
  "settings": {
    "max_projects": 50,
    "notification_channels": ["email", "whatsapp"],
    "backup_frequency": "daily"
  }
}
```

#### 📊 **Auditoria Completa**
- **Histórico de alterações** com timestamps
- **Usuário responsável** por cada mudança
- **Valores anteriores** para rollback
- **Justificativa** opcional para alterações

### APIs Disponíveis
```typescript
GET /api/settings/global             // Configurações globais
POST /api/settings/global            // Criar/atualizar global
GET /api/settings/agency/[id]        // Configurações da agência
POST /api/settings/agency/[id]       // Atualizar agência
GET /api/settings/templates          // Templates disponíveis
POST /api/settings/templates/apply   // Aplicar template
GET /api/settings/history            // Histórico de alterações
```

---

## 📈 Próximos Passos

### Sistemas Pendentes
1. **Integração com Slack** - Notificações em canais específicos
2. **Sistema de Templates Avançados** - Builder visual de workflows
3. **Analytics Preditivo** - Machine Learning para previsões

### Melhorias Planejadas
1. **Machine Learning** para predição de alertas
2. **Auto-scaling** baseado em métricas
3. **Multi-region** backup com replicação
4. **Advanced Analytics** com BigQuery

---

**📞 Suporte:** Para dúvidas sobre implementação, consulte a [documentação principal](../README.md) ou abra uma [issue no GitHub](https://github.com/yourusername/fvstudiosdash/issues).