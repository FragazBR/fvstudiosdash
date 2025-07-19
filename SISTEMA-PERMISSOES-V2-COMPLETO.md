# Guia Completo - Sistema de Permissões v2

Este documento consolida todas as instruções para implementar e testar o novo sistema de permissões com 6 tipos de usuários.

## 📋 Resumo do Sistema

### Tipos de Usuário
1. **admin (FVSTUDIOS)** - Acesso total ao sistema
2. **agency** - Proprietários de agência com equipe
3. **independent** - Produtores independentes 
4. **influencer** - Produtores de conteúdo/Influencers
5. **free** - Plano gratuito
6. **client** - Clientes das agências

### Hierarquia de Agência
- **owner** - Dono da agência (role: agency)
- **manager** - Gerente com permissões elevadas
- **employee** - Funcionário com permissões limitadas

## 🚀 Passo 1: Executar as Migrações do Banco

### 1.1 Acesse o Supabase Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto `fvstudiosdash`
3. Vá em **SQL Editor** no menu lateral

### 1.2 Execute a Migração Principal
1. Abra o arquivo `supabase/migrations/001_permission_system_v2.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** para executar

> ⚠️ **Importante**: Esta migração vai recriar todas as tabelas. Certifique-se de fazer backup dos dados existentes se necessário.

### 1.3 Execute os Dados de Teste
1. Abra o arquivo `supabase/migrations/002_test_data.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** para executar

## 🔧 Passo 2: Configurar o Frontend

### 2.1 Atualizar Imports
Substitua as importações antigas pelos novos arquivos:

```typescript
// ANTIGO
import { usePermissions } from '@/hooks/usePermissions'

// NOVO
import { usePermissionsV2 as usePermissions } from '@/hooks/usePermissionsV2'
```

### 2.2 Atualizar Tipos
Certifique-se de que o arquivo `types/database.ts` está sendo usado nos componentes:

```typescript
import type { UserRole, UserPermissions } from '@/types/database'
```

### 2.3 Configurar Cliente Supabase
Use o novo cliente configurado:

```typescript
import { supabase, supabaseHelpers } from '@/lib/supabase-client'
```

## 👥 Passo 3: Testar os Usuários

### 3.1 Usuários de Teste Criados

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| admin@fvstudios.com | admin123 | admin | Administrador do sistema |
| agency@exemplo.com | agency123 | agency | Dono de agência |
| manager@exemplo.com | manager123 | independent | Gerente da agência |
| employee@exemplo.com | employee123 | independent | Funcionário da agência |
| independent@exemplo.com | independent123 | independent | Produtor independente |
| influencer@exemplo.com | influencer123 | influencer | Influencer/Criador |
| free@exemplo.com | free123 | free | Usuário gratuito |
| client@exemplo.com | client123 | client | Cliente da agência |

### 3.2 Estrutura da Agência de Teste

- **Agência**: "Exemplo Agência"
- **Owner**: agency@exemplo.com 
- **Manager**: manager@exemplo.com (pode gerenciar equipe e projetos)
- **Employee**: employee@exemplo.com (pode criar conteúdo)
- **Cliente**: client@exemplo.com (acesso limitado aos seus projetos)

### 3.3 Dados de Teste Incluídos

- **3 Clientes** para a agência
- **5 Projetos** com diferentes status e colaboradores
- **Histórico de uso** realista para demonstrar quotas
- **Notificações** para cada tipo de usuário

## 🧪 Passo 4: Validar Funcionalidades

### 4.1 Teste de Login
1. Faça login com cada usuário teste
2. Verifique se o redirecionamento está correto:
   - admin → `/admin`
   - agency → `/agency/dashboard` 
   - independent/influencer/free → `/dashboard`
   - client → `/client`

### 4.2 Teste de Permissões
1. **Admin**: Deve ver todas as opções de menu
2. **Agency**: Dashboard de agência com métricas de equipe
3. **Independent**: Dashboard pessoal com projetos próprios
4. **Client**: Acesso apenas aos projetos atribuídos

### 4.3 Teste de Quotas
1. Verifique os limites em cada plano:
   - **Free**: 1 projeto, 2 clientes, 100 IA, 1GB
   - **Influencer**: 5 projetos, 10 clientes, 500 IA, 5GB
   - **Independent**: 10 projetos, 25 clientes, 1000 IA, 10GB
   - **Agency**: 100 projetos, 500 clientes, 5000 IA, 100GB
   - **Admin**: Ilimitado

### 4.4 Teste de Hierarquia
1. Login como agency@exemplo.com
2. Deve ver todos os membros da equipe
3. Login como manager@exemplo.com 
4. Deve poder gerenciar funcionários mas não alterar configurações da agência
5. Login como employee@exemplo.com
6. Deve ter acesso limitado apenas aos seus projetos

## 🔍 Passo 5: Verificações no Banco

### 5.1 Validar Estrutura
Execute no SQL Editor do Supabase:

```sql
-- Verificar usuários criados
SELECT email, role, status FROM profiles ORDER BY role, email;

-- Verificar estrutura da agência  
SELECT 
  a.name as agency_name,
  p.email as owner_email,
  (SELECT COUNT(*) FROM agency_members WHERE agency_id = a.id) as member_count
FROM agencies a 
JOIN profiles p ON a.owner_id = p.id;

-- Verificar membros da agência
SELECT 
  p.email,
  am.role as agency_role,
  am.status
FROM agency_members am
JOIN profiles p ON am.user_id = p.id
JOIN agencies a ON am.agency_id = a.id
WHERE a.name = 'Exemplo Agência'
ORDER BY am.role, p.email;

-- Verificar projetos e colaboradores
SELECT 
  proj.name as project_name,
  owner.email as owner_email,
  COUNT(pc.user_id) as collaborator_count
FROM projects proj
LEFT JOIN profiles owner ON proj.owner_id = owner.id
LEFT JOIN project_collaborators pc ON proj.id = pc.project_id
GROUP BY proj.id, proj.name, owner.email
ORDER BY proj.name;
```

### 5.2 Testar RLS (Row Level Security)
1. Login com diferentes usuários
2. Tente acessar dados de outros usuários
3. Verifique se as políticas RLS estão funcionando

## 🐛 Passo 6: Solução de Problemas

### 6.1 Problemas Comuns

**Erro de permissão no banco:**
- Verifique se as políticas RLS estão ativas
- Confirme que o usuário tem a role correta

**Usuário não consegue logar:**
- Verifique se `email_confirmed_at` não é null na tabela `auth.users`
- Execute: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;`

**Dashboard não carrega:**
- Verifique os tipos TypeScript
- Confirme se o `usePermissionsV2` está sendo usado

### 6.2 Logs Úteis
```sql
-- Ver usuários auth
SELECT * FROM auth.users ORDER BY created_at DESC;

-- Ver profiles 
SELECT * FROM profiles ORDER BY created_at DESC;

-- Ver políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 📚 Passo 7: Próximos Passos

### 7.1 Personalizações
1. Ajustar quotas conforme necessidade do negócio
2. Personalizar dashboards para cada tipo de usuário
3. Implementar sistema de cobrança/assinatura

### 7.2 Funcionalidades Adicionais
1. Sistema de convites para agências
2. Métricas e relatórios detalhados
3. Integrações com APIs externas
4. Sistema de notificações em tempo real

### 7.3 Otimizações
1. Implementar cache para permissões
2. Otimizar queries do Supabase
3. Adicionar indexação nas tabelas mais usadas

---

## 🎯 Checklist Final

- [ ] Migrações executadas no Supabase
- [ ] Dados de teste criados
- [ ] Frontend atualizado com novos tipos
- [ ] Login testado com todos os usuários
- [ ] Permissões validadas por role
- [ ] Quotas funcionando corretamente
- [ ] Hierarquia de agência testada
- [ ] RLS policies ativas e funcionando
- [ ] Dashboards personalizados por role

---

**🎉 Sistema Pronto para Uso!**

Com este guia, você tem um sistema completo de permissões com 6 tipos de usuários, hierarquia de agências, quotas por plano e segurança implementada via RLS no Supabase.
