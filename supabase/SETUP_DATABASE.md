# 🗃️ FVStudios Dashboard - Database Architecture

## 📋 **Quick Setup Guide**

Para implementar o sistema completo, execute os scripts na ordem:

1. **01_create_database_structure.sql** - Base structure
2. **02_insert_integrations.sql** - Integration catalog  
3. **03_create_triggers.sql** - Automation triggers
4. **04_enable_rls_policies.sql** - Security policies
5. **05_verify_system.sql** - System verification

---

## 🏗️ **Database Schema**

### **Core Tables**
- `profiles` - User profiles with role hierarchy
- `agencies` - Agency information and limits  
- `agency_members` - User-agency relationships
- `available_integrations` - Integration catalog
- `user_integrations` - Active user integrations
- `integration_usage` - Usage logs and analytics

### **User Role Hierarchy**
```
admin
├── agency_owner
│   ├── agency_manager
│   └── agency_employee
├── independent_producer
├── client
├── freelancer  
├── influencer
└── free
```

### **Integration Categories**
- **social_media**: Instagram, Facebook, TikTok, YouTube, Twitter, LinkedIn
- **analytics**: Google Analytics, Meta Pixel, GTM
- **marketing**: Mailchimp, RD Station, HubSpot  
- **ai**: OpenAI, Claude, Gemini
- **design**: Canva, Adobe CC
- **storage**: Google Drive, Dropbox, AWS S3
- **payment**: Stripe, PayPal, Mercado Pago

---

## 🔒 **Security Model**

### **Row Level Security (RLS)**
Each user type has specific access patterns:

- **Admin**: Full system access
- **Agency Owner**: Own agency + employees + clients
- **Agency Manager/Employee**: Same agency users only
- **Independent Producer**: Own clients only  
- **Client**: Own data only
- **Others**: Personal data only

### **Plan Limits**
| Plan | Max Integrations | Max Clients | Max Projects |
|------|-----------------|-------------|--------------|
| Free | 3 | 5 | 10 |
| Basic | 10 | 15 | 25 |
| Premium | 15 | 30 | 50 |
| Agency | 20 | 50 | 100 |
| Producer | 15 | 20 | 50 |
| Enterprise | Unlimited | Unlimited | Unlimited |

---

## 🔧 **Key Features**

### **Automatic Profile Creation**
- Triggers create profiles automatically on user signup
- Role assignment based on email patterns or metadata
- Automatic limit setting based on plan type

### **Integration Management**  
- Encrypted credential storage
- Usage tracking and analytics
- Permission-based sharing with agencies/producers

### **Audit Trail**
- All integration usage logged
- Response times and success rates tracked
- Error logging for debugging

---

## 🚀 **First Time Setup**

### **Create Admin User**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Email: `admin@fvstudios.com`
4. Password: `admin123`
5. Check "Auto Confirm User"
6. Click "Create user"

### **Test Login**
1. Go to `localhost:3001/login`
2. Use admin credentials
3. Should redirect to admin dashboard

---

## 📈 **Scaling Considerations**

### **Performance**
- All tables have optimized indexes
- Foreign keys with appropriate cascade rules
- Efficient RLS policies using EXISTS clauses

### **Security**
- Sensitive data encrypted (API keys, tokens)
- RLS prevents data leakage between users
- Input validation via triggers

### **Maintainability**  
- Clear naming conventions
- Comprehensive documentation
- Modular structure for easy updates

---

*Sistema implementado com sucesso! 🎉*
- `agencies` - Informações das agências
- `agency_members` - Hierarquia dentro das agências
- `clients` - Clientes gerenciados
- `client_users` - Usuários que são clientes
- `projects` - Projetos com ownership
- `project_collaborators` - Colaboração em projetos
- `usage_tracking` - Tracking de quotas
- `ai_usage_logs` - Logs de uso de IA
- `notifications` - Sistema de notificações
- `system_settings` - Configurações globais

### **🛡️ Segurança Implementada**
- **Row Level Security (RLS)** ativado em todas as tabelas
- **Políticas específicas** para cada tipo de usuário
- **Hierarquia de agências** respeitada
- **Isolamento de dados** entre usuários

### **⚡ Performance**
- **Índices otimizados** para queries comuns
- **Triggers automáticos** para sincronização
- **Constraints de integridade** referencial

---

## 👥 USUÁRIOS DE TESTE CRIADOS

| Tipo | Email | Senha | Descrição |
|------|-------|-------|-----------|
| **admin** | admin@fvstudios.com | admin123 | FVStudios Admin - Controle total |
| **agency** | agency@exemplo.com | agency123 | Proprietário de agência |
| **agency** | manager@exemplo.com | manager123 | Gerente da agência |
| **agency** | employee@exemplo.com | employee123 | Funcionário da agência |
| **independent** | independent@exemplo.com | independent123 | Produtor independente |
| **influencer** | influencer@exemplo.com | influencer123 | Criador de conteúdo |
| **free** | free@exemplo.com | free123 | Usuário plano gratuito |
| **client** | client@exemplo.com | client123 | Cliente final |

---

## 🧪 DADOS DE TESTE INCLUÍDOS

### **🏢 Agência Exemplo**
- **Nome**: Agência Exemplo
- **Proprietário**: agency@exemplo.com
- **Gerente**: manager@exemplo.com  
- **Funcionário**: employee@exemplo.com

### **👥 Clientes**
- **Empresa ABC** (Cliente da agência)
- **Startup XYZ** (Cliente do produtor independente)

### **📁 Projetos**
- **Campanha de Verão 2025** (Agência → Cliente ABC)
- **Identidade Visual Startup XYZ** (Independent → Startup XYZ)  
- **Canal YouTube - Série Receitas** (Influencer pessoal)
- **Meu Primeiro Projeto** (Free user)

### **📊 Dados Realistas**
- **Logs de IA** para usuários premium
- **Tracking de uso** mensal
- **Notificações** de exemplo
- **Colaboradores** em projetos

---

## 🔧 CONFIGURAÇÃO DO AMBIENTE

### **1. Atualizar Types do TypeScript**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### **2. Variáveis de Ambiente**
Atualize seu `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **3. Testar Conexão**
```typescript
// Teste no console do navegador
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Testar login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@fvstudios.com',
  password: 'admin123'
})

console.log('Login:', data, error)
```

---

## 🎯 PRÓXIMOS PASSOS

### **1. Testar Sistema**
1. Execute as migrations
2. Faça login com cada tipo de usuário
3. Acesse `/test-permissions` para validar
4. Verifique os dashboards específicos

### **2. Integrar com Frontend**
1. Atualizar tipos TypeScript
2. Testar hooks de permissão
3. Validar componentes protegidos
4. Testar navegação por roles

### **3. Configurar Autenticação**
1. Configurar providers (Google, etc.)
2. Testar fluxo de signup
3. Configurar emails transacionais
4. Implementar verificação por email

### **4. Deploy e Monitoramento**
1. Testar em ambiente de produção
2. Configurar backup automático
3. Implementar logs de auditoria
4. Monitorar performance das queries

---

## ⚠️ IMPORTANTE

### **🔒 Segurança**
- As senhas de teste são simples para facilitar testes
- **SEMPRE altere** as senhas em produção
- **Configure 2FA** para usuários admin
- **Monitore** logs de acesso

### **🗃️ Backup**
- **Sempre faça backup** antes de executar migrations
- **Teste primeiro** em ambiente de desenvolvimento
- **Documente** todas as alterações

### **📊 Performance**
- **Monitore** uso de recursos no Supabase
- **Otimize** queries conforme necessário
- **Configure** caching quando apropriado

---

## 🚀 EXECUÇÃO RÁPIDA

```bash
# 1. Fazer backup (se necessário)
# 2. Executar no SQL Editor do Supabase:

-- Primeiro: 001_permission_system_v2.sql
-- Segundo: 002_test_data.sql

# 3. Testar login:
# Email: admin@fvstudios.com
# Senha: admin123

# 4. Acessar: /test-permissions
```

---

**🎉 Após executar esses scripts, você terá um sistema completo de permissões com 5 tipos de usuário, hierarquia de agências, e dados realistas para testar todas as funcionalidades!**
