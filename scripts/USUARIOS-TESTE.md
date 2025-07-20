# 👥 Criação de Usuários de Teste - Supabase Authentication

## 🔐 Senhas dos Usuários
**Padrão:** `nomedousuario123`

## 📋 Lista Completa de Usuários

### 🎛️ Admin Global
- **Email:** admin@fvstudios.com
- **Senha:** admin123
- **Nome:** Admin FVStudios
- **Role:** admin

---

### 🏢 FV Studios Marketing Team

#### Agency Owner
- **Email:** owner@fvstudios.com
- **Senha:** joao123
- **Nome:** João Silva
- **Role:** agency_owner

#### Agency Staff
- **Email:** manager@fvstudios.com
- **Senha:** maria123
- **Nome:** Maria Santos
- **Role:** agency_staff

- **Email:** ana@fvstudios.com
- **Senha:** ana123
- **Nome:** Ana Costa
- **Role:** agency_staff

---

### 🚀 Digital Growth Agency Team

#### Agency Owner
- **Email:** owner@digitalgrowth.com
- **Senha:** carlos123
- **Nome:** Carlos Pereira
- **Role:** agency_owner

#### Agency Staff
- **Email:** staff@digitalgrowth.com
- **Senha:** julia123
- **Nome:** Julia Rodrigues
- **Role:** agency_staff

---

### 👤 Clientes FV Studios

#### Cliente Premium
- **Email:** contato@empresaabc.com
- **Senha:** roberto123
- **Nome:** Roberto Lima
- **Empresa:** Empresa ABC Ltda
- **Role:** client

#### Cliente Básico
- **Email:** marketing@lojaxyz.com
- **Senha:** fernanda123
- **Nome:** Fernanda Oliveira
- **Empresa:** Loja XYZ
- **Role:** client

#### Cliente Enterprise (Trial)
- **Email:** ceo@startupdef.com
- **Senha:** pedro123
- **Nome:** Pedro Souza
- **Empresa:** Startup DEF
- **Role:** client

---

### 👤 Clientes Digital Growth

#### Cliente Básico
- **Email:** admin@restauranteghi.com
- **Senha:** lucia123
- **Nome:** Lucia Ferreira
- **Empresa:** Restaurante GHI
- **Role:** client

#### Cliente Premium
- **Email:** owner@academijkl.com
- **Senha:** marcos123
- **Nome:** Marcos Almeida
- **Empresa:** Academia JKL
- **Role:** client

---

### 👤 Cliente Independente

#### Freelancer
- **Email:** freelancer@exemplo.com
- **Senha:** sandra123
- **Nome:** Sandra Ribeiro
- **Empresa:** Freelancer
- **Role:** client

---

## 🚀 Como Criar os Usuários

### Método Recomendado: Painel do Supabase

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione** seu projeto FVStudios Dashboard
3. **Vá para:** Authentication > Users
4. **Clique em:** "Add user"
5. **Para cada usuário acima:**
   - Email: [email do usuário]
   - Password: [senha do usuário]
   - Email confirm: ✅ (marcado)
   - Auto Confirm User: ✅ (marcado)

### Método Alternativo: SQL (Se permitido)

Se o Supabase permitir, execute `create_auth_users.sql` no SQL Editor.

---

## ✅ Verificação

Após criar todos os usuários, você pode:

1. **Testar Login** com qualquer um dos emails/senhas acima
2. **Verificar Perfis** executando: 
   ```sql
   SELECT email, name, role, company FROM public.user_profiles ORDER BY role, name;
   ```
3. **Testar Dashboard** fazendo login como diferentes roles

---

## 🎯 Usuários para Teste Rápido

### Para Admin
- **Login:** admin@fvstudios.com / admin123

### Para Agency Owner
- **Login:** owner@fvstudios.com / joao123

### Para Cliente
- **Login:** contato@empresaabc.com / roberto123

---

## 🔄 Automação (Trigger)

O trigger `on_auth_user_created` vai automaticamente:
- Criar o perfil em `user_profiles`
- Associar à agência correta (se aplicável)
- Configurar role padrão como 'client'
- Criar configuração de API para clientes
