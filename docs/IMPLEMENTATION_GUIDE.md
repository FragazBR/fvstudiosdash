# 🛠️ Guia de Implementação - Expansão FVStudios com n8n e AI

Guia técnico completo para implementar todas as novas funcionalidades da plataforma FVStudios.

---

## 📋 **Resumo do Que Foi Implementado**

### ✅ **Componentes Criados**
1. **`docs/PLATFORM_EXPANSION.md`** - Análise completa e roadmap de expansão
2. **`lib/n8n-integration.ts`** - Sistema completo de integração n8n + AI
3. **`components/canva-workstation.tsx`** - Interface Canva integrada
4. **`database/N8N_INTEGRATION_SCHEMA.sql`** - Schema completo para novas funcionalidades
5. **`app/api/n8n/execute/route.ts`** - API para execução de workflows
6. **`app/api/n8n/status/[executionId]/route.ts`** - API para status de execuções
7. **`app/api/webhooks/whatsapp/route.ts`** - Webhook WhatsApp Business

### 🎯 **Funcionalidades Implementadas**
- **Orquestração n8n** com workflows inteligentes
- **Agentes de IA** (OpenAI, Claude, Cohere)
- **WhatsApp Business API** para briefing automatizado
- **Canva API** integrada na Workstation
- **Sistema de versionamento** para designs
- **Métricas avançadas** de performance
- **Multi-tenant security** para todas as integrações

---

## 🚀 **Implementação Passo a Passo**

### **1️⃣ Preparação do Ambiente**

#### **1.1 Executar Nova Migração**
```bash
# Execute o novo schema SQL
psql $DATABASE_URL -f database/N8N_INTEGRATION_SCHEMA.sql
```

#### **1.2 Variáveis de Ambiente**
Adicione ao seu `.env.local`:

```env
# ==================================================
# N8N INTEGRATION
# ==================================================
N8N_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
N8N_PASSWORD=secure_password
N8N_DB_PASSWORD=db_password

# ==================================================
# WHATSAPP BUSINESS API
# ==================================================
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_VERIFY_TOKEN=your_verify_token

# ==================================================
# CANVA API
# ==================================================
CANVA_CLIENT_ID=your_canva_client_id
CANVA_CLIENT_SECRET=your_canva_client_secret
CANVA_ACCESS_TOKEN=your_canva_access_token

# ==================================================
# AI PROVIDERS
# ==================================================
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
COHERE_API_KEY=your_cohere_key

# ==================================================
# EXTENDED INTEGRATIONS
# ==================================================
HUBSPOT_ACCESS_TOKEN=your_hubspot_token
PIPEDRIVE_API_TOKEN=your_pipedrive_token
CALENDLY_ACCESS_TOKEN=your_calendly_token
NOTION_INTEGRATION_TOKEN=your_notion_token
CLICKUP_API_TOKEN=your_clickup_token
SLACK_BOT_TOKEN=your_slack_token
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
MIXPANEL_PROJECT_TOKEN=your_mixpanel_token
```

### **2️⃣ Configuração do n8n**

#### **2.1 Docker Setup**
```bash
# Criar diretório do n8n
mkdir n8n-data

# Executar n8n com Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e WEBHOOK_URL=http://localhost:5678/ \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=$N8N_PASSWORD \
  -v $(pwd)/n8n-data:/home/node/.n8n \
  n8nio/n8n
```

#### **2.2 Configuração Inicial**
1. Acesse `http://localhost:5678`
2. Configure credenciais para:
   - OpenAI API
   - WhatsApp Business API
   - Canva API
   - Supabase Database

#### **2.3 Importar Workflows**
```bash
# Copiar workflows para n8n
cp workflows/*.json n8n-data/workflows/
```

### **3️⃣ Configuração WhatsApp Business**

#### **3.1 Meta Developers Setup**
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie app "Business"
3. Adicione produto "WhatsApp Business API"
4. Configure webhook: `https://yourdomain.com/api/webhooks/whatsapp`

#### **3.2 Verificação do Webhook**
```bash
# Teste local com ngrok
ngrok http 3000

# Configure o webhook URL no Meta:
# https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp
```

### **4️⃣ Configuração Canva**

#### **4.1 Canva Partners Program**
1. Inscreva-se no [Canva Partners](https://www.canva.com/partners/)
2. Solicite acesso à API
3. Configure OAuth App

#### **4.2 Teste de Integração**
```javascript
// Teste básico da API
const canva = new CanvaAPIManager(process.env.CANVA_ACCESS_TOKEN)
const templates = await canva.getTemplates('social-media')
console.log('Templates disponíveis:', templates.length)
```

### **5️⃣ Integração na Interface**

#### **5.1 Adicionar Canva Workstation**
```typescript
// Em app/workstation/page.tsx
import { CanvaWorkstation } from '@/components/canva-workstation'

// Adicionar nova aba
<TabsTrigger value="canva" className="flex items-center gap-2">
  <Palette className="h-4 w-4" />
  Canva Studio
</TabsTrigger>

<TabsContent value="canva" className="space-y-6">
  <CanvaWorkstation />
</TabsContent>
```

#### **5.2 Hook para n8n**
```typescript
// hooks/useN8nWorkflows.ts
import { useN8nWorkflows } from '@/hooks/useN8nWorkflows'

const { executeWorkflow, getWorkflowStatus } = useN8nWorkflows()

// Executar briefing workflow
const execution = await executeWorkflow('briefing_workflow', {
  phone_number: '+5511999999999',
  initial_message: 'Olá, preciso de uma campanha'
})
```

---

## 🔧 **Configuração das Integrações**

### **OpenAI Integration**

```typescript
// lib/openai-client.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateBriefingResponse(message: string, context: any) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "Você é um especialista em briefing de marketing digital..."
      },
      {
        role: "user", 
        content: message
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
  
  return completion.choices[0].message.content
}
```

### **Claude Integration**

```typescript
// lib/claude-client.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
})

export async function analyzeProject(briefing: any) {
  const message = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 2000,
    temperature: 0.3,
    messages: [{
      role: "user",
      content: `Analise este briefing e crie uma estratégia completa: ${JSON.stringify(briefing)}`
    }]
  })
  
  return message.content[0].text
}
```

### **WhatsApp Business**

```typescript
// lib/whatsapp-client.ts
export class WhatsAppClient {
  private baseUrl = 'https://graph.facebook.com/v18.0'
  
  async sendMessage(to: string, message: string) {
    const response = await fetch(`${this.baseUrl}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      })
    })
    
    return response.json()
  }
}
```

---

## 🧪 **Testes e Validação**

### **1. Teste do Workflow Completo**

```bash
# 1. Enviar mensagem via WhatsApp para número configurado
# Mensagem: "Olá, preciso de uma campanha para minha loja"

# 2. Verificar no banco se conversa foi criada
psql $DATABASE_URL -c "SELECT * FROM whatsapp_conversations ORDER BY created_at DESC LIMIT 1;"

# 3. Verificar execução do workflow
psql $DATABASE_URL -c "SELECT * FROM workflow_executions ORDER BY started_at DESC LIMIT 1;"

# 4. Verificar resposta da IA no WhatsApp
```

### **2. Teste da Criação com IA**

```javascript
// No componente Canva Workstation
const testAIGeneration = async () => {
  const prompt = "Crie um post para Instagram promovendo Black Friday com 50% off"
  const design = await generateWithAI(prompt, {
    colors: ['#000000', '#FFD700'],
    fonts: ['Roboto'],
    style: 'modern'
  })
  console.log('Design criado:', design)
}
```

### **3. Teste das Métricas**

```sql
-- Verificar estatísticas de workflows
SELECT * FROM get_workflow_stats('your-agency-id');

-- Verificar métricas de integrações
SELECT 
  ai.name,
  ai.provider,
  aim.total_requests,
  aim.successful_requests,
  aim.avg_response_time_ms
FROM api_integrations ai
LEFT JOIN api_integration_metrics aim ON ai.id = aim.integration_id
WHERE aim.date = CURRENT_DATE;
```

---

## 📊 **Monitoramento e Métricas**

### **Dashboard de Monitoramento**

```typescript
// components/n8n-dashboard.tsx
export function N8nDashboard() {
  const [stats, setStats] = useState({
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0,
    avgExecutionTime: 0
  })
  
  useEffect(() => {
    const loadStats = async () => {
      const response = await fetch('/api/n8n/stats')
      const data = await response.json()
      setStats(data)
    }
    
    loadStats()
    const interval = setInterval(loadStats, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard 
        title="Workflows Ativos"
        value={stats.activeWorkflows}
        icon={<Workflow />}
      />
      <MetricCard 
        title="Execuções Hoje"
        value={stats.totalExecutions}
        icon={<Play />}
      />
      <MetricCard 
        title="Taxa de Sucesso"
        value={`${stats.successRate}%`}
        icon={<CheckCircle />}
      />
      <MetricCard 
        title="Tempo Médio"
        value={`${stats.avgExecutionTime}s`}
        icon={<Clock />}
      />
    </div>
  )
}
```

### **Alertas e Notificações**

```typescript
// lib/monitoring.ts
export class WorkflowMonitoring {
  static async checkWorkflowHealth() {
    const failingWorkflows = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('status', 'error')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    
    if (failingWorkflows.data && failingWorkflows.data.length > 5) {
      await this.sendAlert('High failure rate detected in workflows')
    }
  }
  
  static async sendAlert(message: string) {
    // Enviar para Slack, email, etc.
    await fetch('/api/alerts/send', {
      method: 'POST',
      body: JSON.stringify({ message, type: 'workflow_failure' })
    })
  }
}
```

---

## 🔒 **Segurança e Compliance**

### **1. Validação de Webhooks**

```typescript
// lib/webhook-security.ts
import crypto from 'crypto'

export function verifyWhatsAppSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  )
}
```

### **2. Rate Limiting**

```typescript
// lib/rate-limiter.ts
export class APIRateLimiter {
  private static limits = new Map<string, { count: number, resetTime: number }>()
  
  static isAllowed(clientId: string, endpoint: string, maxRequests: number = 100): boolean {
    const key = `${clientId}:${endpoint}`
    const now = Date.now()
    const hour = 60 * 60 * 1000
    
    const current = this.limits.get(key)
    
    if (!current || now > current.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + hour })
      return true
    }
    
    if (current.count >= maxRequests) {
      return false
    }
    
    current.count++
    return true
  }
}
```

### **3. Auditoria**

```sql
-- Trigger para auditoria de execuções sensíveis
CREATE OR REPLACE FUNCTION audit_sensitive_executions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workflow_id IN (
        SELECT id FROM n8n_workflows 
        WHERE workflow_type IN ('briefing', 'campaign')
    ) THEN
        INSERT INTO audit_logs (
            entity_type,
            entity_id,
            action,
            user_id,
            details,
            created_at
        ) VALUES (
            'workflow_execution',
            NEW.id,
            'execute',
            NEW.user_id,
            jsonb_build_object(
                'workflow_type', (SELECT workflow_type FROM n8n_workflows WHERE id = NEW.workflow_id),
                'execution_id', NEW.execution_id,
                'status', NEW.status
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_workflow_executions
    AFTER INSERT ON workflow_executions
    FOR EACH ROW EXECUTE FUNCTION audit_sensitive_executions();
```

---

## 🎯 **Próximos Passos**

### **Imediatos (1-2 semanas)**
1. ✅ Executar migração SQL
2. ✅ Configurar n8n local
3. ✅ Testar integração WhatsApp
4. ✅ Implementar primeiro workflow de briefing

### **Médio Prazo (1 mês)**
1. 🔄 Deploy em produção
2. 🔄 Configurar monitoramento
3. 🔄 Treinar equipe
4. 🔄 Testes com clientes beta

### **Longo Prazo (3 meses)**
1. 📈 Otimizações baseadas em uso
2. 📈 Novos workflows customizados
3. 📈 Integrações adicionais
4. 📈 Mobile app com funcionalidades

---

## 📞 **Suporte e Troubleshooting**

### **Problemas Comuns**

#### **n8n não conecta com Supabase**
```bash
# Verificar conectividade
docker exec -it n8n curl -v postgres://user:password@host:5432/database
```

#### **WhatsApp webhook não recebe mensagens**
```bash
# Verificar webhook no Meta
curl -X GET "https://graph.facebook.com/v18.0/me/subscribed_apps?access_token=YOUR_TOKEN"
```

#### **Canva API retorna 401**
```bash
# Testar token
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.canva.com/rest/v1/users/me
```

### **Logs e Debug**

```bash
# Logs do n8n
docker logs n8n

# Logs da aplicação Next.js
tail -f .next/standalone/logs/app.log

# Logs do banco
tail -f /var/log/postgresql/postgresql.log
```

---

**🎉 A implementação está completa e pronta para transformar o FVStudios na plataforma de marketing digital mais avançada do Brasil!**