# 🧹 Instruções para Limpeza do Sistema

## ⚠️ IMPORTANTE: Esta operação é IRREVERSÍVEL!

Esta limpeza irá remover **TODOS** os dados de teste, mantendo apenas o usuário admin principal.

## 📋 Pré-requisitos

1. ✅ Estar logado como `franco@fvstudios.com.br`
2. ✅ Sistema em produção (Vercel)
3. ✅ Backup dos dados importantes (se necessário)

## 🚀 Opção 1: Via Interface Web (Recomendado)

1. Acesse: https://fvstudiosdash.vercel.app/admin/system/cleanup
2. Leia todos os avisos com atenção
3. Digite exatamente: `DELETE_ALL_USERS_EXCEPT_ADMIN`
4. Confirme as múltiplas verificações de segurança
5. Aguarde o relatório de conclusão

## 🔧 Opção 2: Via Console do Browser

Se a página web não funcionar, use este método:

1. Acesse: https://fvstudiosdash.vercel.app/admin
2. Faça login como `franco@fvstudios.com.br`
3. Abra o Console do Desenvolvedor (F12)
4. Cole e execute este código:

```javascript
async function executeSystemCleanup() {
  console.log('🧹 Iniciando limpeza do sistema...');
  
  try {
    const response = await fetch('/api/admin/system/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirm: 'DELETE_ALL_USERS_EXCEPT_ADMIN' })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Limpeza executada com sucesso!');
      console.log('📊 Resumo:', data.summary);
    } else {
      console.error('❌ Erro:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('💥 Erro de rede:', error);
  }
}

// Executar
executeSystemCleanup();
```

## 🗄️ Passo 3: Executar Scripts SQL no Supabase

Após a limpeza, execute estes scripts no Dashboard do Supabase:

### 3.1. Criar tabela de notificações
```sql
-- Cole o conteúdo de: database/create_notifications_table.sql
```

### 3.2. Atualizar políticas RLS
```sql
-- Cole o conteúdo de: database/production_rls_policies.sql
```

### 3.3. Atualizar tabela de convites
```sql
-- Cole o conteúdo de: database/update_user_invitations_add_plan.sql
```

## ✅ Verificação Final

Execute no console SQL do Supabase:

```sql
-- Verificar integridade do sistema
SELECT * FROM check_system_integrity();

-- Verificar usuários restantes
SELECT email, created_at FROM auth.users ORDER BY created_at;

-- Verificar agências
SELECT name, created_at FROM agencies ORDER BY created_at;

-- Verificar planos disponíveis
SELECT plan_name, monthly_price FROM plan_limits ORDER BY monthly_price;
```

## 🎯 Resultado Esperado

Após a limpeza bem-sucedida:

- ✅ Apenas 1 usuário: `franco@fvstudios.com.br`
- ✅ 0 agências criadas por outros usuários
- ✅ 5 planos padrão disponíveis (free, basic, professional, premium, enterprise)
- ✅ Políticas RLS ativas e funcionando
- ✅ Sistema pronto para usuários reais

## 🚨 Em caso de problemas

1. **Erro 401/403**: Verifique se está logado como admin
2. **Erro 500**: Verifique logs no Vercel Dashboard
3. **Página não carrega**: Use a Opção 2 (Console)
4. **API não responde**: Aguarde alguns minutos e tente novamente

## 📞 Próximos Passos

Após a limpeza:

1. ✅ Testar criação de usuários via `/admin/users`
2. ✅ Testar criação de agências via `/admin/agencies/manage`
3. ✅ Verificar se os planos estão sendo aplicados corretamente
4. ✅ Começar os testes com usuários reais

---

**⚠️ Lembre-se: Esta operação é IRREVERSÍVEL. Todos os dados de teste serão permanentemente removidos!**