# 🧹 Limpeza Manual do Sistema - Passos Detalhados

Como a service role key não está configurada, precisamos fazer a limpeza em etapas manuais.

## 📋 PASSO 1: Limpeza do Banco de Dados (Via API)

Execute no console do browser (F12) após login como franco@fvstudios.com.br:

```javascript
async function cleanDatabase() {
  console.log('🧹 Limpando banco de dados...');
  
  try {
    const response = await fetch('/api/admin/system/cleanup-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirm: 'DELETE_ALL_USERS_EXCEPT_ADMIN' })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Banco de dados limpo!');
      console.log('📊 Resultado:', data);
    } else {
      console.error('❌ Erro:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

// Executar
cleanDatabase();
```

## 📋 PASSO 2: Remover Usuários do Supabase Auth (Manual)

1. **Acesse o Dashboard do Supabase**:
   - https://supabase.com/dashboard
   - Faça login
   - Selecione seu projeto

2. **Vá para Authentication > Users**:
   - No menu lateral: Authentication > Users
   - Você verá todos os usuários cadastrados

3. **Delete usuários manualmente**:
   - **MANTENHA APENAS**: franco@fvstudios.com.br
   - **DELETE TODOS OS OUTROS**:
     - Clique no usuário
     - Clique em "Delete user"
     - Confirme a exclusão
     - Repita para todos exceto o Franco

## 📋 PASSO 3: Executar Scripts SQL

No Dashboard do Supabase, vá em **SQL Editor** e execute:

### 3.1. Criar tabela de notificações:
```sql
-- Cole o conteúdo completo de: database/create_notifications_table.sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  category VARCHAR(50) DEFAULT 'general',
  related_id UUID,
  related_type VARCHAR(50),
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "Admins can view all notifications" ON notifications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = auth.uid() 
    AND uap.role = 'admin'
  )
);

-- Trigger
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2. Atualizar user_invitations:
```sql
-- Adicionar campo plan_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_invitations' 
    AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE user_invitations 
    ADD COLUMN plan_id UUID REFERENCES plan_limits(id) ON DELETE SET NULL;
  END IF;
END $$;
```

### 3.3. Garantir permissão admin para Franco:
```sql
-- Garantir que Franco tenha permissão de admin
INSERT INTO user_agency_permissions (user_id, role, permissions, granted_by)
SELECT 
    u.id,
    'admin',
    json_build_object(
        'manage_users', 'true',
        'manage_agencies', 'true', 
        'manage_payments', 'true',
        'view_analytics', 'true',
        'manage_settings', 'true',
        'super_admin', 'true'
    ),
    u.id
FROM auth.users u
WHERE u.email = 'franco@fvstudios.com.br'
AND NOT EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = u.id AND uap.role = 'admin'
)
ON CONFLICT (user_id, agency_id) DO UPDATE SET
    role = 'admin',
    permissions = json_build_object(
        'manage_users', 'true',
        'manage_agencies', 'true',
        'manage_payments', 'true', 
        'view_analytics', 'true',
        'manage_settings', 'true',
        'super_admin', 'true'
    ),
    updated_at = NOW();
```

## 📋 PASSO 4: Verificação Final

Execute no SQL Editor:

```sql
-- Verificar usuários restantes
SELECT email, created_at FROM auth.users ORDER BY created_at;

-- Verificar agências
SELECT name, created_at, created_by FROM agencies ORDER BY created_at;

-- Verificar permissões do admin
SELECT role, permissions FROM user_agency_permissions 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'franco@fvstudios.com.br');

-- Verificar planos disponíveis
SELECT plan_name, monthly_price FROM plan_limits ORDER BY monthly_price;
```

## ✅ Resultado Esperado

Após completar todos os passos:

- ✅ **1 usuário**: franco@fvstudios.com.br
- ✅ **0 agências** de outros usuários
- ✅ **0 assinaturas** ativas de outros usuários
- ✅ **0 convites** pendentes de outros usuários
- ✅ **Tabela notifications** criada e funcionando
- ✅ **Permissões admin** configuradas para Franco

## 🎯 Teste Final

1. Acesse: https://fvstudiosdash.vercel.app/admin
2. Verifique se não há mais erros no console
3. Teste criar um usuário via `/admin/users`
4. Teste criar uma agência via `/admin/agencies/manage`

**Sistema limpo e pronto para usuários reais!** 🎉