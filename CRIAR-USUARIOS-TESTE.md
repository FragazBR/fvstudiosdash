# 🎯 Guia Passo-a-Passo: Criar Usuários de Teste

## 1️⃣ **Executar Trigger no SQL Editor**

1. **Abra o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Cole e execute:** `supabase/setup-auto-roles.sql`
4. **Verifique se apareceu:** ✅ Success

## 2️⃣ **Criar Usuários via Signup**

Agora vá para: **http://localhost:3000/signup**

### **👑 Admin User**
```
Nome: Admin User
Email: admin@test.com
Senha: test123456
```
**Role será:** `admin` ✅

### **🏢 Agency User**
```
Nome: Agency User
Email: agency@test.com
Senha: test123456
```
**Role será:** `agency` ✅

### **👤 User User**
```
Nome: User User
Email: user@test.com
Senha: test123456
```
**Role será:** `user` ✅

### **🤝 Client User**
```
Nome: Client User
Email: client@test.com
Senha: test123456
```
**Role será:** `client` ✅

### **🏠 Personal User**
```
Nome: Personal User
Email: personal@test.com
Senha: test123456
```
**Role será:** `personal` ✅

## 3️⃣ **Testar Login**

Vá para: **http://localhost:3000/login**

Teste com qualquer usuário criado:
- **Email:** admin@test.com
- **Senha:** test123456

**Redirecionamento esperado:**
- `admin@test.com` → `/admin`
- `agency@test.com` → `/dashboard`
- `user@test.com` → `/user/dashboard`
- `client@test.com` → `/client/[id]`
- `personal@test.com` → `/personal/dashboard`

## 4️⃣ **Verificar se Funcionou**

No SQL Editor, execute:
```sql
SELECT email, role, name FROM profiles 
WHERE email LIKE '%@test.com' 
ORDER BY email;
```

**Resultado esperado:**
```
admin@test.com    | admin    | Admin User
agency@test.com   | agency   | Agency User
client@test.com   | client   | Client User
personal@test.com | personal | Personal User
user@test.com     | user     | User User
```

## 🆘 **Se der Problema**

### **Erro no signup:**
- Limpe cookies do navegador
- Use aba anônima
- Verifique se o Supabase está configurado

### **Role não foi aplicado:**
- Execute novamente o trigger SQL
- Verifique se a função foi criada no Supabase

### **Redirecionamento errado:**
- Verifique se o middleware foi atualizado
- Teste em `/debug` para ver informações

## 🎉 **Sucesso!**

Quando tudo funcionar, você terá:
- ✅ 5 usuários de teste criados
- ✅ Roles automaticamente atribuídos
- ✅ Login funcionando
- ✅ Redirecionamento correto por role
- ✅ Sistema pronto para uso!

---

**💡 Dica:** Salve essas credenciais para testes futuros!
