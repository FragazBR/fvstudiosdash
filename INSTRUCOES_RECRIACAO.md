# 🔄 INSTRUÇÕES PARA RECREAÇÃO COMPLETA DO SISTEMA

## ⚠️ PROBLEMA IDENTIFICADO

O sistema atual está **FUNDAMENTALMENTE QUEBRADO** com múltiplos problemas:

1. **RLS com Recursão Infinita** - Policies consultam user_profiles para validar acesso à própria user_profiles
2. **Schemas Incompatíveis** - Diferenças entre SQL e TypeScript 
3. **Triggers Conflitantes** - Múltiplas versões da função handle_new_user()

## 🎯 SOLUÇÃO: RECREAÇÃO TOTAL

### PASSO 1: Executar Setup Direto (SIMPLIFICADO)
```sql
-- No SQL Editor do Supabase, execute:
-- scripts/setup_direto.sql
```

### PASSO 2: ~~Dispensado~~ (o setup_direto.sql já faz tudo)

### PASSO 3: Criar Usuário Admin
```sql
-- No SQL Editor do Supabase, execute:
-- scripts/create_admin_user.sql
```

### PASSO 4: Testar Login
- Login: admin@fvstudios.com
- Senha: (a senha atual do usuário admin)
- Deve redirecionar para /admin sem erros

## 📋 VANTAGENS DA RECREAÇÃO

✅ **Schema Consistente** - Uma única fonte de verdade
✅ **RLS Sem Recursão** - Policies otimizadas e seguras  
✅ **8 Roles Corretos** - Sistema completo de permissões
✅ **Triggers Funcionais** - Auto-criação de perfis
✅ **Multi-tenant** - Agências + Produtores Independentes

## 🎨 NOVO SISTEMA DE ROLES

1. **admin** - Acesso total ao sistema
2. **agency_owner** - Proprietário de agência
3. **agency_staff** - Funcionário de agência  
4. **agency_client** - Cliente de agência
5. **independent_producer** - Produtor independente
6. **independent_client** - Cliente de produtor
7. **influencer** - Influenciador
8. **free_user** - Usuário gratuito

## 🚀 PRÓXIMOS PASSOS

Após recreação bem-sucedida:
1. Testar login admin
2. Criar usuários de teste para cada role
3. Testar funcionalidades por role
4. Deploy definitivo