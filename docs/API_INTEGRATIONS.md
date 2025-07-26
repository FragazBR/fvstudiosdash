# 🔗 Guia de Integrações de API - FVStudios Dashboard

Este guia completo explica como configurar, usar e gerenciar todas as integrações de API disponíveis no FVStudios Dashboard.

---

## 🎯 Visão Geral

O sistema de integrações permite que cada **cliente individual** conecte suas próprias contas de marketing digital, garantindo **isolamento total** de dados e máxima segurança.

### **Recursos Principais**
- 🔐 **Criptografia AES-256** para todos os tokens
- 🔄 **Renovação automática** de tokens expirados
- 📊 **Sincronização em tempo real** de dados
- 📈 **Métricas detalhadas** de performance
- 🛡️ **Isolamento completo** por cliente
- 📝 **Logs detalhados** de todas as operações

---

## 🔵 Meta Ads (Facebook/Instagram)

### **Configuração Inicial**

#### **1. Criar App no Meta Developers**
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Clique em "Meus Apps" → "Criar App"
3. Escolha "Empresa" como tipo de app
4. Preencha as informações básicas

#### **2. Configurar Produtos**
```javascript
// Produtos necessários:
- Facebook Login
- Marketing API
- Webhooks (opcional)

// Permissões necessárias:
- ads_management
- ads_read
- business_management
- pages_show_list
- pages_read_engagement
- instagram_basic
- instagram_content_publish
```

#### **3. Configurar OAuth**
```bash
# URLs de redirecionamento autorizadas:
https://seudominio.com/api/oauth/meta/callback
http://localhost:3000/api/oauth/meta/callback  # Para desenvolvimento
```

#### **4. Variáveis de Ambiente**
```env
META_CLIENT_ID=seu_app_id_aqui
META_CLIENT_SECRET=seu_app_secret_aqui
META_APP_SECRET=seu_app_secret_webhook
META_WEBPACK_VERIFY_TOKEN=seu_token_verificacao
```

### **Recursos Disponíveis**

#### **Campanhas**
- ✅ Listagem de campanhas ativas/pausadas
- ✅ Métricas de performance (Impressões, Cliques, CTR, CPC)
- ✅ Orçamento e gastos em tempo real
- ✅ Status de aprovação de anúncios

#### **Audiences**
- ✅ Público personalizado
- ✅ Lookalike audiences
- ✅ Interesses e demographics

#### **Criativos**
- ✅ Imagens e vídeos de anúncios
- ✅ Performance por criativo
- ✅ Testes A/B automáticos

#### **Insights**
```javascript
// Métricas disponíveis:
{
  impressions: number,
  clicks: number,
  spend: number,
  cpm: number,
  cpc: number,
  ctr: number,
  conversions: number,
  conversion_rate: number,
  roas: number
}
```

### **Exemplo de Uso**

```typescript
// Conectar conta Meta
const integration = await createAPIIntegration({
  client_id: user.id,
  provider: 'meta',
  name: 'Minha Conta Meta Ads',
  description: 'Conta principal para campanhas FB/IG'
})

// Iniciar OAuth
window.location.href = `/api/oauth/meta?integration_id=${integration.id}`

// Após autorização, dados são sincronizados automaticamente
```

---

## 🔴 Google Ads

### **Configuração Inicial**

#### **1. Google Cloud Console**
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto ou use existente
3. Habilite as APIs necessárias:
   - Google Ads API
   - Google OAuth2 API

#### **2. Credenciais OAuth 2.0**
1. Vá em "Credenciais" → "Criar credenciais"
2. Escolha "ID do cliente OAuth 2.0"  
3. Configure as URLs de redirecionamento:

```bash
https://seudominio.com/api/oauth/google/callback
http://localhost:3000/api/oauth/google/callback
```

#### **3. Developer Token**
1. Acesse [ads.google.com](https://ads.google.com)
2. Vá em "Ferramentas e configurações" → "Configuração" → "Central da API"
3. Solicite um Developer Token (processo de aprovação necessário)

#### **4. Variáveis de Ambiente**
```env
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=seu_developer_token
```

### **Recursos Disponíveis**

#### **Campanhas**
```typescript
interface GoogleCampaign {
  id: string
  name: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  type: 'SEARCH' | 'DISPLAY' | 'SHOPPING' | 'VIDEO'
  budget: {
    amount: number
    currency: string
  }
  metrics: {
    impressions: number
    clicks: number
    cost: number
    conversions: number
  }
}
```

#### **Palavras-chave**
- ✅ Keywords com métricas de performance
- ✅ Termos de pesquisa
- ✅ Sugestões de palavras-chave
- ✅ Lances automáticos

#### **Extensões de Anúncios**
- ✅ Sitelinks
- ✅ Chamadas
- ✅ Localização
- ✅ Preços

### **Limitações e Cotas**

| Recurso | Limite | Período |
|---------|--------|---------|
| Requests básicas | 15,000 | Por dia |
| Reports | 5,000 | Por dia |
| Mutações | 5,000 | Por dia |

---

## ⚫ TikTok Ads

### **Configuração Inicial**

#### **1. TikTok for Business**
1. Acesse [ads.tiktok.com](https://ads.tiktok.com)
2. Crie uma conta business
3. Vá em [developers.tiktok.com](https://developers.tiktok.com)
4. Crie um novo app

#### **2. Configurar Permissões**
```javascript
// Escopos necessários:
- user.info.basic
- advertiser.read
- advertiser.write
- campaign.read
- campaign.write
- adgroup.read
- adgroup.write
- ad.read
- ad.write
- report.read
```

#### **3. Variáveis de Ambiente**
```env
TIKTOK_CLIENT_KEY=seu_client_key
TIKTOK_CLIENT_SECRET=seu_client_secret
```

### **Recursos Disponíveis**

#### **Campanhas**
```typescript
interface TikTokCampaign {
  campaign_id: string
  campaign_name: string
  objective: 'REACH' | 'CONVERSION' | 'TRAFFIC'
  status: 'ENABLE' | 'PAUSE' | 'DELETE'
  budget: number
  metrics: {
    impressions: number
    clicks: number
    spend: number
    conversions: number
    video_play_actions: number
    video_watched_2s: number
    video_watched_6s: number
  }
}
```

#### **Criativos**
- ✅ Vídeos nativos
- ✅ Imagens com texto
- ✅ Coleções de produtos
- ✅ Spark Ads (posts orgânicos)

#### **Audiences**
- ✅ Custom audiences
- ✅ Lookalike audiences
- ✅ Interesse e comportamento

---

## 🔵 LinkedIn Ads

### **Configuração Inicial**

#### **1. LinkedIn Developer**
1. Acesse [developer.linkedin.com](https://developer.linkedin.com)
2. Crie um novo app
3. Solicite acesso à Marketing API

#### **2. Produtos Necessários**
```javascript
// Produtos:
- Sign In with LinkedIn
- Marketing API
- Advertising API

// Escopos:
- r_liteprofile
- r_emailaddress  
- r_ads
- rw_ads
- r_ads_reporting
```

#### **3. Variáveis de Ambiente**
```env
LINKEDIN_CLIENT_ID=seu_client_id
LINKEDIN_CLIENT_SECRET=seu_client_secret
```

### **Recursos Disponíveis**

#### **Campanhas B2B**
```typescript
interface LinkedInCampaign {
  id: string
  name: string
  type: 'SPONSORED_CONTENT' | 'SPONSORED_MESSAGING' | 'TEXT_ADS'
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  targeting: {
    locations: string[]
    industries: string[]
    job_functions: string[]
    seniority: string[]
    company_sizes: string[]
  }
  metrics: {
    impressions: number
    clicks: number
    spend: number
    leads: number
    conversions: number
  }
}
```

#### **Lead Generation**
- ✅ LinkedIn Lead Gen Forms
- ✅ Integração direta com CRM
- ✅ Qualificação automática
- ✅ Follow-up personalizado

---

## 🟠 RD Station (CRM/Email Marketing)

### **Configuração Inicial**

#### **1. RD Station Marketing**
1. Acesse [app.rdstation.com.br](https://app.rdstation.com.br)
2. Vá em "Integrações" → "API"
3. Gere um token de acesso

#### **2. Configuração OAuth**
```env
RD_STATION_CLIENT_ID=seu_client_id
RD_STATION_CLIENT_SECRET=seu_client_secret
```

### **Recursos Disponíveis**

#### **Contatos/Leads**
```typescript
interface RDContact {
  uuid: string
  email: string
  name: string
  job_title: string
  company: string
  lifecycle_stage: 'Lead' | 'Marketing Qualified Lead' | 'Sales Qualified Lead'
  tags: string[]
  custom_fields: Record<string, any>
  events: RDEvent[]
}
```

#### **Automação**
- ✅ Email marketing
- ✅ Fluxos de nutrição
- ✅ Segmentação avançada
- ✅ Lead scoring

#### **Relatórios**
- ✅ Funil de conversão
- ✅ ROI de campanhas
- ✅ Engajamento de emails
- ✅ Performance de landing pages

---

## 🟡 Buffer (Social Media Management)

### **Configuração Inicial**

#### **1. Buffer Developers**
1. Acesse [buffer.com/developers](https://buffer.com/developers)
2. Crie um novo app
3. Configure as URLs de callback

#### **2. Variáveis de Ambiente**
```env
BUFFER_CLIENT_ID=seu_client_id
BUFFER_CLIENT_SECRET=seu_client_secret
```

### **Recursos Disponíveis**

#### **Agendamento de Posts**
```typescript
interface BufferPost {
  id: string
  text: string
  media: {
    link: string
    description: string
    picture: string
  }
  scheduled_at: string
  status: 'pending' | 'sent' | 'failed'
  profiles: BufferProfile[]
  statistics: {
    reach: number
    clicks: number
    likes: number
    comments: number
    shares: number
  }
}
```

#### **Perfis Sociais**
- ✅ Facebook Pages
- ✅ Instagram Business
- ✅ Twitter
- ✅ LinkedIn Company Pages
- ✅ Pinterest Business

---

## 🔧 Gerenciamento de Integrações

### **Interface Principal**

A interface principal está disponível em `/social-media/api-integrations` e oferece:

#### **1. Dashboard de Integrações**
```typescript
// Componente principal
<APIIntegrations clientId={user.id} />

// Abas disponíveis:
- Integrações Ativas
- Providers Disponíveis  
- Logs de Sincronização
- Configurações
```

#### **2. Ações Disponíveis**
- ✅ **Conectar** nova integração
- ✅ **Validar** tokens existentes
- ✅ **Sincronizar** dados manualmente
- ✅ **Configurar** frequência de sync
- ✅ **Visualizar** logs detalhados
- ✅ **Desconectar** integração

#### **3. Monitoramento**
```typescript
interface IntegrationStatus {
  id: string
  provider: string
  status: 'active' | 'error' | 'expired'
  last_sync: Date
  next_sync: Date
  error_message?: string
  metrics: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    avg_response_time: number
  }
}
```

### **Sincronização Automática**

#### **Job Scheduler**
```typescript
// Tipos de jobs disponíveis:
enum JobType {
  FULL_SYNC = 'full_sync',           // Sincronização completa
  INCREMENTAL_SYNC = 'incremental_sync', // Apenas dados novos
  VALIDATE_TOKEN = 'validate_token',    // Validar tokens
  SYNC_METRICS = 'sync_metrics'        // Atualizar métricas
}

// Frequências disponíveis:
enum SyncFrequency {
  HOURLY = 'hourly',    // A cada hora
  DAILY = 'daily',      // Diariamente
  WEEKLY = 'weekly',    // Semanalmente  
  MANUAL = 'manual'     // Apenas manual
}
```

#### **Webhooks**
```typescript
// Configuração de webhooks para updates em tempo real
interface WebhookConfig {
  integration_id: string
  event_types: string[]        // campaign_updated, post_published, etc.
  webhook_url: string         // URL do nosso sistema
  secret_key: string         // Para verificação de assinatura
}
```

---

## 📊 Métricas e Relatórios

### **Métricas Unificadas**

Todas as integrações seguem um padrão unificado de métricas:

```typescript
interface UnifiedMetrics {
  // Métricas básicas
  impressions: number
  clicks: number
  spend_cents: number        // Valor em centavos
  conversions: number
  
  // Métricas calculadas
  ctr: number               // Click-through rate
  cpc_cents: number         // Cost per click (centavos)
  cpm_cents: number         // Cost per mille (centavos)
  conversion_rate: number   // Taxa de conversão
  roas: number             // Return on ad spend
  
  // Período
  start_date: Date
  end_date: Date
  
  // Metadados
  currency: string
  timezone: string
}
```

### **Relatórios Disponíveis**

#### **1. Performance Dashboard**
- 📈 Gráficos de performance por período
- 📊 Comparação entre providers
- 🎯 ROI por campanha
- 📱 Performance por device/plataforma

#### **2. Relatórios Customizados**
```typescript
// Filtros disponíveis:
interface ReportFilters {
  providers: string[]          // meta, google, tiktok, etc.
  date_range: {
    start: Date
    end: Date
  }
  campaigns: string[]         // IDs específicas
  metrics: string[]           // Métricas a incluir
  group_by: 'day' | 'week' | 'month' | 'campaign'
}
```

#### **3. Exportação**
- 📑 Excel/CSV
- 📊 Google Sheets
- 📈 PDF com gráficos
- 🔗 API endpoints para integração

---

## 🔒 Segurança das Integrações

### **Criptografia de Tokens**

```typescript
// Todos os tokens são criptografados com AES-256-GCM
const encryptedToken = TokenEncryption.encryptOAuthToken({
  access_token: 'token_do_provider',
  refresh_token: 'refresh_token_do_provider', 
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'Bearer',
  scope: 'ads_read ads_management'
})

// Armazenado no banco como string base64
api_integrations.access_token_encrypted = encryptedToken
```

### **Isolamento por Cliente**

```sql
-- Cada cliente vê apenas suas próprias integrações
SELECT * FROM api_integrations 
WHERE client_id = current_user_id()
AND status = 'active';

-- RLS garante isolamento automático
CREATE POLICY "client_integrations_isolation" ON api_integrations
FOR ALL USING (client_id = auth.uid());
```

### **Validação Contínua**

```typescript
// Sistema valida tokens automaticamente
class TokenValidationManager {
  // Valida token e renova se necessário
  static async validateAndRefresh(integration: APIIntegration) {
    const result = await this.validateToken(integration)
    
    if (!result.isValid && integration.refresh_token) {
      // Tenta renovar automaticamente
      const newToken = await this.refreshToken(integration)
      if (newToken) {
        // Salva novo token criptografado
        await this.updateIntegrationToken(integration.id, newToken)
      }
    }
    
    return result
  }
}
```

---

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. Token Expirado**
```typescript
// Sintomas:
- Status da integração: 'error'
- Mensagem: 'Token inválido ou expirado'
- Última sincronização há mais de 24h

// Solução:
1. Reconectar a integração
2. Ou aguardar renovação automática (se refresh_token disponível)
3. Verificar se app ainda está ativo no provider
```

#### **2. Rate Limit Excedido**
```typescript
// Sintomas:
- Muitas requisições com status 429
- Sincronização lenta ou falhando
- Logs com erro 'Rate limit exceeded'

// Solução:
1. Reduzir frequência de sincronização
2. Implementar backoff exponencial
3. Verificar se outros apps também usam a mesma conta
```

#### **3. Permissões Insuficientes**
```typescript
// Sintomas:
- Erro 403 Forbidden
- Algumas métricas não aparecem
- Campanhas não são listadas

// Solução:
1. Verificar escopos/permissões do app
2. Reconectar com permissões corretas
3. Verificar se conta tem acesso aos dados
```

### **Logs de Debug**

```typescript
// Habilitar logs detalhados
DEBUG=api-integrations npm run dev

// Verificar logs no banco
SELECT * FROM integration_logs 
WHERE integration_id = 'sua_integration_id'
ORDER BY created_at DESC 
LIMIT 50;

// Logs de sistema
tail -f logs/api-integrations.log
```

### **Endpoints de Diagnóstico**

```bash
# Testar conectividade
curl -X GET "http://localhost:3000/api/health-check"

# Validar integração específica
curl -X POST "http://localhost:3000/api/api-integrations/validate" \
  -H "Content-Type: application/json" \
  -d '{"integration_id": "sua_integration_id"}'

# Verificar status geral
curl -X GET "http://localhost:3000/api/api-integrations?client_id=seu_client_id"
```

---

## 📞 Suporte

### **Canais de Suporte**

- 📧 **Email**: api-support@fvstudios.com.br
- 💬 **Chat**: Disponível no dashboard
- 📖 **Documentação**: Sempre atualizada
- 🐛 **Issues**: GitHub para bugs

### **Informações para Suporte**

Ao solicitar ajuda, inclua:

1. **ID da integração** afetada
2. **Provider** (Meta, Google, etc.)
3. **Logs de erro** recentes
4. **Passos** para reproduzir o problema
5. **Horário** aproximado do problema

### **SLA de Suporte**

| Severidade | Tempo de Resposta | Resolução |
|------------|-------------------|-----------|
| 🚨 Crítico | 2 horas | 8 horas |
| ⚠️ Alto | 4 horas | 24 horas |
| 📝 Médio | 8 horas | 72 horas |
| 📋 Baixo | 24 horas | 1 semana |

---

**🔗 Suas integrações são a ponte para o sucesso digital!**

*Documentação atualizada regularmente. Última revisão: 2024*