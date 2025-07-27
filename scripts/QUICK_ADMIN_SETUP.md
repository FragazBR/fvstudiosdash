# Setup Rapido do Usuario Admin

## Passo 1: Criar usuario na autenticacao do Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Va em Authentication > Users
3. Clique em "Add user"
4. Preencha:
   - Email: admin@fvstudios.com
   - Password: Sua senha
   - Marque "Email Confirm" para pular confirmacao
5. Clique em "Create user"
6. Copie o UUID que foi gerado para o usuario

## Passo 2: Executar SQL no Supabase

1. Va em SQL Editor no dashboard do Supabase
2. Cole e execute este comando (substitua o UUID):

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
    '9a8772a1-1387-4b08-81f8-8e2ffdff55cc',
    'franco@fvstudios.com.br',
    'Administrador FVSTUDIOS',
    'admin',
    'enterprise',
    'active',
    NOW(),
    NOW()
);

IMPORTANTE: Substitua COLE-SEU-UUID-AQUI pelo UUID que voce copiou no Passo 1

## Passo 3: Verificar se funcionou

Cole e execute este comando:

SELECT id, email, full_name, role FROM user_profiles WHERE role = 'admin';

Deve aparecer uma linha com seus dados!

## Passo 4: Testar login

1. Va para http://localhost:3000/login
2. Use o email e senha que voce criou
3. Deve redirecionar para /admin

---

## Se der erro na criacao do perfil

Se aparecer erro tipo "table user_profiles doesn't exist", execute esta migracao primeiro:

Va em SQL Editor e cole todo este codigo:

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    agency_id UUID,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'free_user',
    avatar_url TEXT,
    phone VARCHAR(50),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_roles CHECK (role IN (
        'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
        'agency_client', 'independent_producer', 'independent_client', 
        'influencer', 'free_user'
    ))
);

Depois volte pro Passo 2 acima!

---

## Resultado Esperado

Apos seguir estes passos, voce deve conseguir:
- Fazer login com admin@fvstudios.com
- Ser redirecionado para /admin
- Ver todos os menus administrativos na sidebar
- Acessar /executive, /monitoring, /backup, etc.

Se ainda houver problemas, me avise com a mensagem de erro especifica!