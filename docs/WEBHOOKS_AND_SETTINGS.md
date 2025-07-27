# 🔗 Sistema de Webhooks e Configurações Globais

Documentação completa dos sistemas de webhooks e configurações globais implementados no FVStudios Dashboard.

---

## 🎯 Visão Geral

Este documento detalha os dois sistemas mais recentes implementados na plataforma:

1. **Sistema de Webhooks** - Para integrações externas com eventos em tempo real
2. **Configurações Globais** - Para gerenciamento centralizado de settings

---

## 🔗 Sistema de Webhooks

### 📋 Características Principais

#### ✨ **Recursos Avançados**
- **15+ tipos de eventos** predefinidos
- **CRUD completo** via interface web
- **Retry automático** com configuração personalizada
- **Assinatura HMAC SHA-256** para segurança
- **Filtros de payload** configuráveis
- **Monitoramento em tempo real**
- **Teste integrado** de webhooks
- **Dashboard com estatísticas**

#### 🗄️ **Estrutura do Banco**

```sql
-- Tabela principal de webhooks
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'POST',
    headers JSONB DEFAULT '{}',
    secret_token VARCHAR(255),
    events TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    retry_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    filters JSONB DEFAULT '{}'
);

-- Histórico de execuções
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    http_status_code INTEGER,
    response_body TEXT,
    duration_ms INTEGER,
    attempt_number INTEGER DEFAULT 1
);
```

#### 🎭 **Tipos de Eventos Suportados**

| Categoria | Eventos | Descrição |
|-----------|---------|-----------|
| **Projeto** | `project.created`, `project.updated`, `project.completed`, `project.deleted` | Eventos do ciclo de vida de projetos |
| **Tarefa** | `task.created`, `task.updated`, `task.completed` | Mudanças em tarefas |
| **Cliente** | `client.created`, `client.updated` | Gestão de clientes |
| **Usuário** | `user.created`, `user.login` | Eventos de usuários |
| **Pagamento** | `payment.received`, `payment.failed` | Transações financeiras |
| **Sistema** | `system.backup_completed`, `system.alert_triggered` | Eventos do sistema |
| **Notificação** | `notification.sent` | Envio de notificações |

#### 🔐 **Segurança e Validação**

```typescript
// Geração de assinatura HMAC
const signature = crypto
  .createHmac('sha256', webhook.secret_token)
  .update(JSON.stringify(payload))
  .digest('hex')

// Header enviado com a requisição
headers['X-FVStudios-Signature'] = signature
```

#### 📊 **Payload de Exemplo**

```json
{
  "event_type": "project.created",
  "data": {
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Novo Site Institucional",
      "status": "active",
      "client_id": "client-uuid"
    },
    "agency": {
      "id": "agency-uuid",
      "name": "FVStudios Digital"
    },
    "created_by": {
      "id": "user-uuid",
      "name": "João Silva"
    }
  },
  "timestamp": "2024-01-27T10:30:00Z",
  "webhook": {
    "id": "webhook-uuid",
    "name": "Sistema CRM Externo"
  }
}
```

#### 🌐 **APIs Disponíveis**

```typescript
// Gerenciamento de webhooks
GET    /api/webhooks                    // Listar todos os webhooks
POST   /api/webhooks                    // Criar novo webhook
GET    /api/webhooks/[id]              // Buscar webhook específico
PUT    /api/webhooks/[id]              // Atualizar webhook
DELETE /api/webhooks/[id]              // Deletar webhook
POST   /api/webhooks/[id]/test         // Testar webhook

// Eventos e histórico
GET    /api/webhooks/events            // Histórico de eventos
POST   /api/webhooks/events            // Disparar evento manualmente
POST   /api/webhooks/events/[id]/retry // Repetir evento falhado

// Configuração
GET    /api/webhooks/event-types       // Tipos de eventos disponíveis
GET    /api/webhooks/stats             // Estatísticas gerais
```

#### 📱 **Interface de Usuário**

A interface completa está disponível em `/settings/webhooks` e inclui:

- **Lista de webhooks** com status e estatísticas
- **Formulário de criação/edição** com validação
- **Dashboard de monitoramento** em tempo real
- **Histórico detalhado** de execuções
- **Teste integrado** com feedback visual
- **Filtros avançados** por status e tipo

---

## ⚙️ Sistema de Configurações Globais

### 🏗️ **Arquitetura Hierárquica**

O sistema utiliza uma arquitetura de 3 camadas:

```
Default Values → Global Settings → Agency Settings
```

#### 📊 **Estrutura do Banco**

```sql
-- Configurações globais
CREATE TABLE global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    value_type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    validation_rules JSONB,
    created_by UUID REFERENCES user_profiles(id)
);

-- Configurações por agência (override)
CREATE TABLE agency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id),
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    overrides_global BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id),
    UNIQUE(agency_id, key)
);

-- Histórico de alterações
CREATE TABLE settings_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type VARCHAR(50) NOT NULL, -- 'global' ou 'agency'
    setting_id UUID NOT NULL,
    key VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES user_profiles(id),
    change_reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 📋 **Categorias de Configurações**

| Categoria | Exemplos | Descrição |
|-----------|----------|-----------|
| **sistema** | `max_projects_per_user`, `api_timeout` | Limites e configurações técnicas |
| **integracao** | `whatsapp_enabled`, `meta_ads_default_budget` | Configurações de APIs externas |
| **notificacao** | `email_templates`, `notification_frequency` | Templates e canais de notificação |
| **backup** | `backup_retention_days`, `encryption_enabled` | Políticas de backup |
| **compliance** | `gdpr_enabled`, `data_retention_policy` | Configurações de conformidade |

#### 🔧 **API Principal**

```typescript
// Classe principal de gerenciamento
export class GlobalSettingsManager {
  // Buscar configuração com hierarquia automática
  async getAgencySetting(agencyId: string, key: string): Promise<any> {
    // 1. Tenta buscar configuração da agência
    const agencySetting = await this.getAgencySpecificSetting(agencyId, key)
    if (agencySetting !== null) return agencySetting
    
    // 2. Fallback para configuração global
    return await this.getGlobalSetting(key)
  }
  
  // Definir configuração global
  async setGlobalSetting(key: string, value: any, options: {
    category: string
    description?: string
    is_sensitive?: boolean
    validation_rules?: any
    changed_by?: string
    change_reason?: string
  }): Promise<boolean>
  
  // Aplicar template de configuração
  async applyTemplate(templateId: string, agencyId?: string): Promise<boolean>
}
```

#### 🎨 **Templates Predefinidos**

```json
{
  "template_name": "Agência Padrão",
  "category": "agency_setup",
  "description": "Configurações padrão para novas agências",
  "settings": {
    "max_projects": 50,
    "max_users": 10,
    "notification_channels": ["email", "whatsapp"],
    "backup_frequency": "daily",
    "compliance.gdpr_enabled": true,
    "integracao.whatsapp_enabled": true,
    "integracao.meta_ads_budget_limit": 5000
  }
}
```

#### 🌐 **APIs Disponíveis**

```typescript
// Configurações globais
GET    /api/settings/global             // Listar todas as configurações globais
POST   /api/settings/global             // Criar/atualizar configuração global
DELETE /api/settings/global/[key]       // Remover configuração global

// Configurações por agência
GET    /api/settings/agency/[id]        // Configurações da agência
POST   /api/settings/agency/[id]        // Definir configuração da agência
DELETE /api/settings/agency/[id]/[key]  // Remover configuração da agência

// Templates
GET    /api/settings/templates          // Listar templates disponíveis
POST   /api/settings/templates          // Criar novo template
POST   /api/settings/templates/apply    // Aplicar template

// Auditoria
GET    /api/settings/history            // Histórico de alterações
```

#### 🎯 **Interface de Administração**

Disponível em `/settings/global` com:

- **Abas organizadas** por categoria
- **Formulários dinâmicos** baseados no tipo de dados
- **Validação em tempo real** 
- **Histórico de alterações** com diff visual
- **Aplicação de templates** com preview
- **Busca avançada** e filtros

---

## 🚀 Implementação e Deploy

### 📦 **Instalação**

```bash
# 1. Executar migrações SQL
psql $DATABASE_URL -f database/webhook_system.sql
psql $DATABASE_URL -f database/global_settings_system.sql

# 2. Configurar variáveis de ambiente
WEBHOOK_SIGNATURE_SECRET=your_webhook_secret
ENABLE_WEBHOOK_LOGGING=true
ENABLE_GLOBAL_SETTINGS=true
SETTINGS_ENCRYPTION_KEY=your_settings_key
```

### 🧪 **Testes**

```bash
# Testar sistema de webhooks
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Webhook",
    "url": "https://httpbin.org/post",
    "events": ["project.created"]
  }'

# Testar configurações globais
curl -X POST http://localhost:3000/api/settings/global \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test_setting",
    "value": "test_value",
    "category": "sistema"
  }'
```

### 📊 **Monitoramento**

```bash
# Estatísticas de webhooks
curl http://localhost:3000/api/webhooks/stats

# Verificar configurações
curl http://localhost:3000/api/settings/global

# Health check geral
curl http://localhost:3000/api/system/health
```

---

## 🔒 Segurança e Compliance

### 🛡️ **Medidas de Segurança**

#### **Webhooks**
- **Assinatura HMAC SHA-256** obrigatória
- **Validação de URLs** https obrigatório
- **Rate limiting** por webhook
- **Timeout configurável** (máx 300s)
- **Logs detalhados** de todas as execuções

#### **Configurações Globais**
- **Criptografia AES-256** para valores sensíveis
- **Row Level Security** (RLS) no banco
- **Auditoria completa** com histórico
- **Validação de entrada** baseada em schemas
- **Backup automático** de configurações críticas

### 📋 **Compliance**

- **GDPR/LGPD:** Dados sensíveis são criptografados
- **Auditoria:** Todas as alterações são logadas
- **Retenção:** Configurável por categoria
- **Anonização:** Dados podem ser anonizados automaticamente

---

## 📈 Casos de Uso

### 🔗 **Webhooks - Exemplos Práticos**

#### **Integração com CRM**
```json
{
  "name": "Pipedrive Integration",
  "url": "https://api.pipedrive.com/webhook",
  "events": ["client.created", "project.completed"],
  "headers": {
    "Authorization": "Bearer pipedrive-token"
  }
}
```

#### **Notificações Slack**
```json
{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/...",
  "events": ["system.alert_triggered"],
  "filters": {
    "severity": "critical"
  }
}
```

### ⚙️ **Configurações - Exemplos Práticos**

#### **Configurar Limites por Agência**
```typescript
// Definir limite específico para agência premium
await settingsManager.setAgencySetting(
  'premium-agency-id',
  'max_projects',
  100,
  { 
    overrides_global: true,
    reason: 'Cliente premium - limite aumentado'
  }
)
```

#### **Template para Startups**
```json
{
  "template_name": "Startup Package",
  "settings": {
    "max_projects": 25,
    "max_users": 5,
    "notification_channels": ["email"],
    "backup_frequency": "weekly",
    "integracao.whatsapp_enabled": false
  }
}
```

---

## 🚀 Próximos Passos

### 📋 **Melhorias Planejadas**

#### **Webhooks**
- [ ] **Retry exponencial** com jitter
- [ ] **Circuit breaker** para URLs problemáticas
- [ ] **Batching** de eventos similares
- [ ] **Dashboard analytics** avançado

#### **Configurações Globais**
- [ ] **Validação visual** de schemas
- [ ] **Importação/exportação** de configurações
- [ ] **Versionamento** de templates
- [ ] **A/B testing** de configurações

### 🔧 **Integrações Futuras**
- [ ] **Slack SDK** nativo
- [ ] **Discord webhooks**
- [ ] **Microsoft Teams** integration
- [ ] **Zapier** connectivity

---

## 📞 Suporte

Para dúvidas sobre implementação ou configuração:

- 📧 **Email**: dev@fvstudios.com.br
- 📖 **Docs**: [Documentação Principal](../README.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/fvstudiosdash/issues)

---

**⭐ Sistemas implementados com sucesso!**

*Documentação atualizada em {{ date }} - v2.0*