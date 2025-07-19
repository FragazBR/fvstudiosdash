# 🧹 Guia de Limpeza e Implementação - Sistema de Permissões v2

Este guia vai te levar através do processo completo de limpeza do banco e implementação do novo sistema.

## ⚠️ IMPORTANTE - BACKUP
**Antes de começar, faça backup dos dados importantes se houver algum dado que você queira manter!**

## 📋 Passo a Passo

### 🗑️ PASSO 1: Limpeza Completa do Banco

#### 1.1 Acesse o Supabase Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto `fvstudiosdash`
3. Vá em **SQL Editor** no menu lateral

#### 1.2 Execute o Script de Limpeza
1. Abra o arquivo `supabase/migrations/000_cleanup_database.sql`
2. Copie todo o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** para executar

> ⚠️ **Este script vai:**
> - Remover todas as tabelas existentes (profiles, agencies, projects, etc.)
> - Remover todas as políticas RLS
> - Remover triggers e funções
> - Deletar usuários de teste (emails com @exemplo.com, @test.com, admin@fvstudios.com)

#### 1.3 Verificar Limpeza
Após executar, você deve ver mensagens como:
```
SUCCESS: Todas as tabelas foram removidas com sucesso
Usuários restantes na tabela auth.users: X
```

### 🏗️ PASSO 2: Criar Nova Estrutura

#### 2.1 Execute a Migração Principal
1. No mesmo SQL Editor
2. Abra o arquivo `supabase/migrations/001_permission_system_v2.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **RUN**

> ✅ **Este script vai criar:**
> - 11 tabelas novas com estrutura completa
> - Políticas RLS de segurança
> - Triggers automáticos
> - Tipos enum para roles
> - Funções auxiliares

#### 2.2 Inserir Dados de Teste
1. Abra o arquivo `supabase/migrations/002_test_data.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor
4. Clique em **RUN**

> 🎯 **Este script vai criar:**
> - 8 usuários de teste com diferentes roles
> - 1 agência com hierarquia (owner, manager, employee)
> - 3 clientes para a agência
> - 5 projetos com colaboradores
> - Dados realistas de uso e notificações

### 👥 PASSO 3: Verificar Usuários Criados

Execute no SQL Editor para verificar:

```sql
-- Ver usuários criados
SELECT email, role, status, email_verified FROM profiles ORDER BY role, email;

-- Ver estrutura da agência
SELECT 
  a.name as agency_name,
  p.email as owner_email,
  (SELECT COUNT(*) FROM agency_members WHERE agency_id = a.id) as member_count
FROM agencies a 
JOIN profiles p ON a.owner_id = p.id;
```

### 🧪 PASSO 4: Testar Login

Agora você pode testar com os usuários criados:

| Email | Senha | Role | Acesso |
|-------|-------|------|--------|
| admin@fvstudios.com | admin123 | admin | `/admin` |
| agency@exemplo.com | agency123 | agency | `/agency/dashboard` |
| manager@exemplo.com | manager123 | independent | `/dashboard` (gerente) |
| employee@exemplo.com | employee123 | independent | `/dashboard` (funcionário) |
| independent@exemplo.com | independent123 | independent | `/dashboard` |
| influencer@exemplo.com | influencer123 | influencer | `/dashboard` |
| free@exemplo.com | free123 | free | `/dashboard` |
| client@exemplo.com | client123 | client | `/client` |

### 🔧 PASSO 5: Atualizar Frontend

#### 5.1 Verificar Imports
Certifique-se de que o sistema está usando os novos arquivos:

```typescript
// Use o hook v2
import { usePermissionsV2 as usePermissions } from '@/hooks/usePermissionsV2'

// Use os novos tipos
import type { UserRole, UserPermissions } from '@/types/database'

// Use o cliente atualizado
import { supabase, supabaseHelpers } from '@/lib/supabase-client'
```

#### 5.2 Testar Funcionalidades
1. **Login** - Teste com cada usuário
2. **Dashboards** - Verifique se cada role vai para dashboard correto
3. **Permissões** - Teste se menus aparecem conforme role
4. **Quotas** - Verifique limites por plano

## 🔍 Verificações Finais

### Estrutura do Banco
```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar policies RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar usuários e roles
SELECT 
  email, 
  role, 
  status, 
  agency_role,
  current_projects,
  current_clients
FROM profiles 
ORDER BY role, email;
```

### Teste de Segurança
1. Login com diferentes usuários
2. Tente acessar dados de outros usuários
3. Verifique se RLS está bloqueando acesso indevido

## ❓ Resolução de Problemas

### Erro: "relation does not exist"
- Execute novamente o script de limpeza
- Verifique se todas as tabelas foram removidas
- Execute novamente a migração principal

### Erro: "user already exists"
- No script de limpeza, descomente as linhas de DELETE FROM auth.users
- Execute novamente a limpeza

### Erro de permissão
- Verifique se você tem privilégios de admin no Supabase
- Certifique-se de estar executando no projeto correto

### Frontend não reconhece novos tipos
- Reinicie o servidor de desenvolvimento (pnpm dev)
- Verifique imports nos componentes
- Limpe cache do TypeScript (Ctrl+Shift+P -> TypeScript: Reload Project)

## ✅ Checklist Final

- [ ] Script de limpeza executado com sucesso
- [ ] Migração principal criou 11 tabelas
- [ ] Dados de teste inseridos (8 usuários)
- [ ] Verificação de usuários funcionando
- [ ] Login testado com pelo menos 3 roles diferentes
- [ ] Dashboards redirecionando corretamente
- [ ] Permissões funcionando por role
- [ ] RLS bloqueando acesso não autorizado

---

## 🎉 Pronto!

Após seguir todos esses passos, você terá:
- ✅ Banco de dados limpo e reestruturado
- ✅ Sistema de permissões v2 funcionando
- ✅ 8 usuários de teste para validação
- ✅ Segurança implementada via RLS
- ✅ Hierarquia de agência completa

**Próximo passo**: Testar todas as funcionalidades e ajustar conforme necessário!
