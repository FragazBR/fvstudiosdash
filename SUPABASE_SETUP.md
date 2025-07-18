# 🚀 Guia de Configuração do Supabase

## 📋 Passo a Passo para Configurar o Supabase

### 1. Criar Conta e Projeto

1. **Acesse:** https://supabase.com
2. **Faça login** ou crie uma conta
3. **Clique em "New Project"**
4. **Preencha os dados:**
   - **Name:** `FVSTUDIOS Dashboard`
   - **Database Password:** Escolha uma senha forte (anote!)
   - **Region:** Escolha a mais próxima (ex: South America)
   - **Pricing Plan:** Free (para começar)

### 2. Obter Credenciais

Após criar o projeto:

1. **Vá para Settings → API**
2. **Copie as seguintes informações:**
   ```
   Project URL: https://[seu-projeto].supabase.co
   Anon (public) key: eyJ...
   Service role key: eyJ... (mantenha seguro!)
   ```

### 3. Configurar Variáveis de Ambiente

1. **Crie o arquivo `.env.local`** na raiz do projeto:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[sua-anon-key]

   # Opcional: para operações administrativas
   SUPABASE_SERVICE_ROLE_KEY=eyJ[sua-service-role-key]
   ```

2. **⚠️ IMPORTANTE:** Substitua `[seu-projeto]` e as keys pelas suas credenciais reais

### 4. Aplicar Schema do Banco

1. **No Dashboard do Supabase:**
   - Vá para **SQL Editor**
   - Clique em **"New Query"**

2. **Copie e cole o conteúdo do arquivo:**
   `supabase/migrations/001_complete_schema.sql`

3. **Execute o script** (clique em "Run")

4. **Verifique se todas as tabelas foram criadas:**
   - Vá para **Table Editor**
   - Deve ver: agencies, profiles, clients, projects, tasks, etc.

### 5. Aplicar Dados de Exemplo (Opcional)

1. **No SQL Editor, crie uma nova query**
2. **Copie e cole o conteúdo do arquivo:**
   `supabase/seed.sql`
3. **Execute o script**

### 6. Configurar Autenticação

1. **Vá para Authentication → Settings**
2. **Configure:**
   - **Site URL:** `http://localhost:3000` (desenvolvimento)
   - **Redirect URLs:** `http://localhost:3000/auth/callback`
3. **Email Templates:** Personalize se desejar

### 7. Verificar RLS (Row Level Security)

1. **Vá para Authentication → Policies**
2. **Verifique se as políticas foram criadas para cada tabela**
3. **Se não existirem, execute novamente o schema**

## ✅ Checklist de Verificação

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas e salvas
- [ ] Arquivo `.env.local` criado
- [ ] Schema aplicado (12 tabelas criadas)
- [ ] Dados de exemplo inseridos (opcional)
- [ ] Configurações de auth definidas
- [ ] RLS policies ativas

## 🧪 Testar a Configuração

1. **Reinicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

2. **Acesse:** http://localhost:3000

3. **Teste o signup:**
   - Vá para `/signup`
   - Crie uma conta de teste
   - Verifique se o perfil foi criado na tabela `profiles`

4. **Teste o login:**
   - Vá para `/login`
   - Faça login com a conta criada
   - Verifique se é redirecionado corretamente

## 🔧 Troubleshooting

### Erro: "Invalid API key"
**Solução:** Verifique se as keys no `.env.local` estão corretas

### Erro: "table 'profiles' doesn't exist"
**Solução:** Execute novamente o schema SQL

### Erro: "Failed to parse cookie string"
**Solução:** Limpe cookies do navegador ou use aba anônima

### Servidor não carrega variáveis de ambiente
**Solução:** Reinicie o servidor (`Ctrl+C` e `pnpm dev` novamente)

## 📊 Próximos Passos

Após a configuração:

1. **Teste todas as funcionalidades**
2. **Ajuste dados de exemplo conforme necessário**
3. **Configure domínio de produção**
4. **Implemente backup automático**
5. **Configure monitoramento**

## 🚀 Deploy em Produção

Quando estiver pronto para produção:

1. **Configure domínio real nas settings do Supabase**
2. **Atualize as redirect URLs**
3. **Configure variáveis de ambiente no Vercel/Netlify**
4. **Aplique o schema no banco de produção**

---

💡 **Dica:** Mantenha as credenciais seguras e nunca as compartilhe publicamente!
