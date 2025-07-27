# 🔧 Setup Rápido do Usuário Admin

## Passo 1: Criar usuário na autenticação do Supabase

1. **Acesse o Dashboard do Supabase**: https://supabase.com/dashboard
2. **Vá em Authentication > Users**
3. **Clique em "Add user"**
4. **Preencha:**
   - Email: `admin@fvstudios.com` (ou outro email de sua escolha)
   - Password: Sua senha
   - **Marque "Email Confirm"** para pular confirmação
5. **Clique em "Create user"**
6. **Copie o UUID** que foi gerado para o usuário

## Passo 2: Executar SQL no Supabase

1. **Vá em SQL Editor** no dashboard do Supabase
2. **Execute este comando** (substitua o UUID):

```sql
-- SUBSTITUA O UUID ABAIXO PELO UUID DO USUÁRIO CRIADO NO PASSO 1
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status,
    created_at,
    updated_at
) VALUES (
    'COLE-O-UUID-AQUI', -- ← SUBSTITUA PELO UUID DO PASSO 1
    'admin@fvstudios.com', -- ← SUBSTITUA PELO EMAIL USADO
    'Administrador FVStudios',
    'admin',
    'enterprise',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    subscription_plan = 'enterprise',
    subscription_status = 'active',
    updated_at = NOW();
```

## Passo 3: Verificar se funcionou

Execute este SQL para verificar:

```sql
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.subscription_plan,
    au.email_confirmed_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role = 'admin';
```

## Passo 4: Testar login

1. **Vá para** `http://localhost:3000/login`
2. **Use o email e senha** que você criou
3. **Deve redirecionar** para `/admin`

---

## ⚠️ Troubleshooting

### Se der erro "Bad Request" no login:

1. **Verifique se o usuário existe** na tabela `auth.users`
2. **Verifique se o perfil foi criado** na tabela `user_profiles` 
3. **Confirme que o email está confirmado** (email_confirmed_at não é null)

### Comando para debugar problemas:

```sql
-- Verificar usuário na auth.users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@fvstudios.com';

-- Verificar perfil criado
SELECT id, email, full_name, role, created_at
FROM user_profiles
WHERE email = 'admin@fvstudios.com';

-- Se não aparecer nada, o usuário não foi criado corretamente
```

### Se precisar recriar tudo:

```sql
-- Deletar da user_profiles primeiro
DELETE FROM user_profiles WHERE email = 'admin@fvstudios.com';

-- Depois deletar da auth.users (via dashboard do Supabase)
-- E começar novamente do Passo 1
```

---

## 🎯 Resultado Esperado

Após seguir estes passos, você deve conseguir:
- ✅ Fazer login com `admin@fvstudios.com`
- ✅ Ser redirecionado para `/admin`
- ✅ Ver todos os menus administrativos na sidebar
- ✅ Acessar `/executive`, `/monitoring`, `/backup`, etc.

Se ainda houver problemas, verifique o console do navegador para erros específicos!