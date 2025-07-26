# 📖 Guia de Instalação Completo - FVStudios Dashboard

Este guia irá te ajudar a instalar o FVStudios Dashboard do zero, seja para desenvolvimento ou produção.

---

## 🎯 Visão Geral

O FVStudios Dashboard é uma plataforma SaaS completa que requer:
- **Backend**: Next.js 15 com API Routes
- **Banco de Dados**: PostgreSQL com Supabase
- **Autenticação**: Supabase Auth
- **Pagamentos**: Stripe
- **APIs Externas**: Meta, Google, TikTok, LinkedIn, etc.

---

## 🛠️ Pré-requisitos

### **Software Necessário**
- **Node.js** 18.0 ou superior
- **npm** ou **yarn**
- **Git**
- **PostgreSQL** 14+ (ou conta Supabase)

### **Contas de Serviços Externos**
- [**Supabase**](https://supabase.com) - Banco de dados e autenticação
- [**Stripe**](https://stripe.com) - Processamento de pagamentos
- [**Meta Developers**](https://developers.facebook.com) - Integração Facebook/Instagram
- [**Google Cloud**](https://console.cloud.google.com) - Google Ads API
- [**TikTok Developers**](https://developers.tiktok.com) - TikTok Business API
- [**LinkedIn Developers**](https://www.linkedin.com/developers) - LinkedIn Marketing API

---

## 🚀 Instalação Passo a Passo

### **1. Clone o Repositório**

```bash
# Clone o projeto
git clone https://github.com/yourusername/fvstudiosdash.git
cd fvstudiosdash

# Instale as dependências
npm install
```

### **2. Configuração do Banco de Dados**

#### **Opção A: Usando Supabase (Recomendado)**

1. **Crie um projeto no Supabase**:
   - Acesse [supabase.com](https://supabase.com)
   - Clique em "New Project"
   - Escolha sua organização
   - Dê um nome ao projeto e defina uma senha forte
   - Selecione a região mais próxima

2. **Execute a migração completa**:
```bash
# Usando Supabase CLI
npx supabase db reset

# OU executando o script diretamente
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres" -f database/COMPLETE_MIGRATION.sql
```

#### **Opção B: PostgreSQL Local**

1. **Instale o PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Baixe e instale do site oficial: https://www.postgresql.org/download/
```

2. **Crie o banco de dados**:
```bash
# Acesse o PostgreSQL
sudo -u postgres psql

# Crie o banco
CREATE DATABASE fvstudios_dashboard;
CREATE USER fvstudios WITH ENCRYPTED PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE fvstudios_dashboard TO fvstudios;
\q
```

3. **Execute a migração**:
```bash
psql -h localhost -U fvstudios -d fvstudios_dashboard -f database/COMPLETE_MIGRATION.sql
```

### **3. Configuração das Variáveis de Ambiente**

1. **Copie o arquivo de exemplo**:
```bash
cp .env.example .env.local
```

2. **Configure as variáveis obrigatórias**:

```env
# ==================================================
# BANCO DE DADOS E AUTENTICAÇÃO
# ==================================================
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_privada_supabase

# ==================================================
# STRIPE (PAGAMENTOS)
# ==================================================
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_stripe
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_webhook_stripe

# ==================================================
# CRIPTOGRAFIA (GERE UMA CHAVE DE 64 CARACTERES)
# ==================================================
ENCRYPTION_MASTER_KEY=sua_chave_hex_de_64_caracteres

# ==================================================
# APIS EXTERNAS - META ADS
# ==================================================
META_CLIENT_ID=seu_app_id_meta
META_CLIENT_SECRET=seu_app_secret_meta
META_APP_SECRET=seu_app_secret_webhook_meta
META_WEBHOOK_VERIFY_TOKEN=seu_token_verificacao_meta

# ==================================================
# APIS EXTERNAS - GOOGLE ADS
# ==================================================
GOOGLE_CLIENT_ID=seu_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_google
GOOGLE_ADS_DEVELOPER_TOKEN=seu_developer_token_google_ads

# ==================================================
# APIS EXTERNAS - TIKTOK BUSINESS
# ==================================================
TIKTOK_CLIENT_KEY=seu_client_key_tiktok
TIKTOK_CLIENT_SECRET=seu_client_secret_tiktok

# ==================================================
# APIS EXTERNAS - LINKEDIN MARKETING
# ==================================================
LINKEDIN_CLIENT_ID=seu_client_id_linkedin
LINKEDIN_CLIENT_SECRET=seu_client_secret_linkedin

# ==================================================
# CONFIGURAÇÕES DO SISTEMA
# ==================================================
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_nextauth

# JOB SCHEDULER (true para habilitar jobs automáticos)
ENABLE_JOB_SCHEDULER=false

# AMBIENTE
NODE_ENV=development
```

### **4. Geração da Chave de Criptografia**

A chave de criptografia é crucial para proteger os tokens das APIs. Gere uma chave segura:

```bash
# Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Usando OpenSSL
openssl rand -hex 32

# Exemplo de saída (USE SUA PRÓPRIA CHAVE!):
# a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### **5. Configuração das APIs Externas**

#### **5.1 Meta Ads (Facebook/Instagram)**

1. **Acesse o Meta Developers**: https://developers.facebook.com
2. **Crie um novo app**:
   - Escolha "Business" como tipo
   - Preencha as informações básicas
3. **Configure o produto Facebook Login**:
   - Adicione as URLs de redirect: `http://localhost:3000/api/oauth/meta/callback`
4. **Obtenha as credenciais**:
   - App ID → `META_CLIENT_ID`
   - App Secret → `META_CLIENT_SECRET`

#### **5.2 Google Ads**

1. **Acesse o Google Cloud Console**: https://console.cloud.google.com
2. **Crie um novo projeto** ou use um existente
3. **Habilite as APIs**:
   - Google Ads API
   - Google OAuth2 API
4. **Configure OAuth 2.0**:
   - Tela de consentimento OAuth
   - Credenciais → Criar credenciais → ID do cliente OAuth 2.0
   - Adicione: `http://localhost:3000/api/oauth/google/callback`
5. **Obtenha as credenciais**:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`
6. **Solicite um Developer Token** para Google Ads API

#### **5.3 TikTok Business**

1. **Acesse TikTok Developers**: https://developers.tiktok.com
2. **Crie um app** na seção TikTok for Business
3. **Configure as permissões** necessárias
4. **Adicione a URL de callback**: `http://localhost:3000/api/oauth/tiktok/callback`
5. **Obtenha as credenciais**:
   - Client Key → `TIKTOK_CLIENT_KEY`
   - Client Secret → `TIKTOK_CLIENT_SECRET`

#### **5.4 LinkedIn Marketing**

1. **Acesse LinkedIn Developers**: https://www.linkedin.com/developers
2. **Crie um novo app**
3. **Solicite acesso à Marketing API**
4. **Configure OAuth 2.0**:
   - Adicione: `http://localhost:3000/api/oauth/linkedin/callback`
5. **Obtenha as credenciais**:
   - Client ID → `LINKEDIN_CLIENT_ID`
   - Client Secret → `LINKEDIN_CLIENT_SECRET`

#### **5.5 Stripe**

1. **Crie uma conta no Stripe**: https://stripe.com
2. **Acesse o Dashboard**
3. **Vá em Developers → API keys**
4. **Copie as chaves**:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
5. **Configure os webhooks**:
   - Endpoint: `http://localhost:3000/api/webhooks/stripe`
   - Eventos: `invoice.payment_succeeded`, `customer.subscription.updated`, etc.

### **6. Executar o Projeto**

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O projeto estará disponível em: **http://localhost:3000**

### **7. Configuração Inicial**

1. **Acesse o sistema**: http://localhost:3000
2. **Faça login como admin**:
   - Email: `admin@fvstudios.com.br`
   - Senha: (Será configurada no primeiro acesso)
3. **Configure sua primeira agência**
4. **Teste as integrações de API**

---

## 🔧 Scripts Úteis

```bash
# Verificar estrutura do banco
npm run db:check

# Reset completo (desenvolvimento)
npm run db:reset

# Executar apenas sistema inteligente
npm run db:intelligent

# Backup do banco
npm run db:backup

# Verificar build
npm run build

# Executar testes
npm test

# Linting
npm run lint

# Formatação de código
npm run format
```

---

## 🐳 Instalação com Docker

### **1. Usando Docker Compose (Recomendado)**

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/fvstudios
    depends_on:
      - db
    env_file:
      - .env.local

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: fvstudios
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/COMPLETE_MIGRATION.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

```bash
# Executar com Docker
docker-compose up -d
```

### **2. Docker Standalone**

```bash
# Build da imagem
docker build -t fvstudios-dashboard .

# Executar container
docker run -p 3000:3000 \
  -e DATABASE_URL="sua_database_url" \
  -e NEXT_PUBLIC_SUPABASE_URL="sua_supabase_url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_supabase_key" \
  fvstudios-dashboard
```

---

## 🚀 Deploy em Produção

### **Vercel (Recomendado)**

1. **Push para GitHub**:
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

2. **Conecte no Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Importe seu repositório
   - Configure as variáveis de ambiente
   - Deploy automático

3. **Configure o domínio personalizado**

### **VPS/Servidor Próprio**

```bash
# No servidor
git clone https://github.com/yourusername/fvstudiosdash.git
cd fvstudiosdash
npm install
npm run build

# Configure PM2 para processo contínuo
npm install -g pm2
pm2 start npm --name "fvstudios" -- start
pm2 startup
pm2 save

# Configure Nginx como proxy reverso
# /etc/nginx/sites-available/fvstudios
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔍 Verificação da Instalação

### **1. Teste as Funcionalidades Principais**

```bash
# Execute o script de diagnóstico
psql $DATABASE_URL -f scripts/DIAGNOSTIC.sql
```

### **2. Checklist de Verificação**

- [ ] ✅ Banco de dados criado e migrado
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Login de admin funcionando
- [ ] ✅ Criação de agência funcional
- [ ] ✅ Sistema de convites funcionando
- [ ] ✅ Integrações de API configuradas
- [ ] ✅ Stripe configurado (modo teste)
- [ ] ✅ Sistema inteligente ativo
- [ ] ✅ Notificações funcionando

### **3. Testes de Integração**

```bash
# Teste Meta Ads
curl -X GET "http://localhost:3000/api/oauth/meta?integration_id=test"

# Teste Google Ads
curl -X GET "http://localhost:3000/api/oauth/google?integration_id=test"

# Teste validação de token
curl -X POST "http://localhost:3000/api/api-integrations/validate" \
  -H "Content-Type: application/json" \
  -d '{"integration_id": "seu-id-teste"}'
```

---

## 🆘 Troubleshooting

### **Problemas Comuns**

#### **1. Erro de conexão com banco de dados**
```bash
# Verifique a string de conexão
echo $DATABASE_URL

# Teste a conexão
psql $DATABASE_URL -c "SELECT version();"
```

#### **2. Erro nas migrações**
```bash
# Reset completo
npm run db:reset

# Execute manualmente
psql $DATABASE_URL -f database/COMPLETE_MIGRATION.sql
```

#### **3. Problemas com criptografia**
```bash
# Regenere a chave de criptografia
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **4. APIs externas não funcionando**
- Verifique se as URLs de callback estão corretas
- Confirme se as credenciais estão válidas
- Teste as APIs individualmente

#### **5. Erro de build**
```bash
# Limpe o cache
npm run clean
rm -rf .next node_modules
npm install
npm run build
```

### **Logs e Debug**

```bash
# Logs do sistema
tail -f logs/app.log

# Debug do banco
tail -f logs/db.log

# Logs do Vercel
npx vercel logs

# Debug local
DEBUG=* npm run dev
```

---

## 📞 Suporte

Se você encontrar problemas durante a instalação:

1. **Verifique a documentação**: Todos os passos estão detalhados aqui
2. **Consulte os logs**: Eles geralmente indicam o problema
3. **Execute o diagnóstico**: `scripts/DIAGNOSTIC.sql`
4. **Abra uma issue**: [GitHub Issues](https://github.com/yourusername/fvstudiosdash/issues)

### **Informações para Issues**

Sempre inclua:
- Sistema operacional
- Versão do Node.js
- Logs de erro completos
- Passos para reproduzir o problema
- Configurações utilizadas (sem credenciais sensíveis)

---

**🎉 Parabéns! Seu FVStudios Dashboard está pronto para uso!**

*Próximo passo: [Guia de Segurança](SECURITY.md) para configurações avançadas*