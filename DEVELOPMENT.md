# 🔧 Guia de Configuração para Desenvolvimento

## Status Atual do Projeto

✅ **Concluído:**
- Estrutura base do Next.js 14
- Sistema de autenticação Supabase
- Schema completo do banco de dados
- Middleware de proteção de rotas
- Sistema de roles (admin, agency, user, client, personal)
- Componentes base do dashboard
- Internacionalização (i18n)
- Páginas de login e signup

⚠️ **Pendente:**
- Configuração das variáveis de ambiente
- Aplicação da migração do banco
- Teste das funcionalidades
- Ajustes finais de UI/UX

## 🚀 Próximos Passos

### 1. Configurar Supabase

1. **Criar projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Escolha uma senha forte para o banco

2. **Obter credenciais:**
   - Project URL: `https://xxx.supabase.co`
   - Anon key: Encontre em Settings > API
   - Service role key: Encontre em Settings > API

3. **Configurar arquivo .env.local:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
   ```

### 2. Aplicar Schema do Banco

1. **No Dashboard do Supabase:**
   - Vá para SQL Editor
   - Cole o conteúdo de `supabase/migrations/001_complete_schema.sql`
   - Execute o script

2. **Aplicar dados de exemplo:**
   - Cole o conteúdo de `supabase/seed.sql`
   - Execute para criar dados de teste

### 3. Testar Autenticação

1. **Acesse:** `http://localhost:3000/signup`
2. **Crie uma conta de teste**
3. **Verifique se o perfil foi criado na tabela `profiles`**
4. **Teste login em:** `http://localhost:3000/login`

## 🔍 Validação das Funcionalidades

### Dashboard
- [ ] Acesso com role `admin` → `/admin`
- [ ] Acesso com role `agency` → `/dashboard`
- [ ] Acesso com role `client` → `/client/[id]`
- [ ] Acesso com role `personal` → `/personal`

### Autenticação
- [ ] Signup funcionando
- [ ] Login funcionando
- [ ] Logout funcionando
- [ ] Redirecionamento por role
- [ ] Proteção de rotas

### Banco de Dados
- [ ] Tabelas criadas corretamente
- [ ] RLS policies funcionando
- [ ] Relacionamentos corretos
- [ ] Triggers funcionando

## 🐛 Resolução de Problemas

### Erro: "Failed to parse cookie string"
**Solução:** Limpar cookies do navegador ou usar aba anônima

### Erro: "Invalid API key"
**Solução:** Verificar se as variáveis de ambiente estão corretas

### Erro: "Table doesn't exist"
**Solução:** Aplicar o schema do banco (001_complete_schema.sql)

### Erro: "Unauthorized"
**Solução:** Verificar se o usuário tem o role correto na tabela profiles

## 📋 Checklist de Desenvolvimento

### Configuração Inicial
- [ ] Clonar repositório
- [ ] Instalar dependências (`pnpm install`)
- [ ] Criar projeto no Supabase
- [ ] Configurar variáveis de ambiente
- [ ] Aplicar schema do banco
- [ ] Iniciar servidor (`pnpm dev`)

### Funcionalidades Core
- [ ] Sistema de autenticação
- [ ] Middleware de proteção
- [ ] Dashboard por role
- [ ] CRUD de projetos
- [ ] CRUD de tarefas
- [ ] Sistema de mensagens
- [ ] Calendário
- [ ] Notificações

### UI/UX
- [ ] Responsividade mobile
- [ ] Tema dark/light
- [ ] Componentes consistentes
- [ ] Loading states
- [ ] Error handling
- [ ] Feedback visual

### Performance
- [ ] Otimização de imagens
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Caching strategy
- [ ] Bundle analysis

## 🔄 Fluxo de Trabalho

### Para Novas Features

1. **Análise:**
   - Definir requisitos
   - Verificar impacto no schema
   - Planejar componentes necessários

2. **Desenvolvimento:**
   - Criar/atualizar tipos TypeScript
   - Implementar componentes
   - Adicionar testes
   - Documentar mudanças

3. **Deploy:**
   - Testar localmente
   - Aplicar migrações (se necessário)
   - Deploy em staging
   - Deploy em produção

### Para Bugs

1. **Identificação:**
   - Reproduzir o bug
   - Identificar causa raiz
   - Verificar logs

2. **Correção:**
   - Implementar fix
   - Testar cenários relacionados
   - Verificar não regressão

3. **Validação:**
   - Teste manual
   - Teste automatizado
   - Review de código

## 📊 Métricas e Monitoramento

### KPIs do Sistema
- Tempo de resposta das páginas
- Taxa de conversão de signup
- Uso por role de usuário
- Projetos criados/concluídos
- Atividade de usuários

### Logs Importantes
- Erros de autenticação
- Falhas de consulta ao banco
- Tempo de carregamento
- Uso de recursos

## 🔧 Ferramentas de Desenvolvimento

### Recomendadas
- **VS Code** com extensões:
  - TypeScript
  - Tailwind CSS IntelliSense
  - ES7+ React snippets
  - Prettier
  - ESLint

### Browser Extensions
- React Developer Tools
- Redux DevTools (se usar)
- Lighthouse para performance

## 🎯 Metas de Performance

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Métricas Customizadas
- Tempo de login: < 2s
- Carregamento do dashboard: < 3s
- Resposta de ações: < 1s

## 📚 Recursos de Aprendizado

### Documentação
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

### Tutoriais
- [Next.js + Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

💡 **Dica:** Mantenha este arquivo atualizado conforme o projeto evolui!
