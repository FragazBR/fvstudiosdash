# Sistema FVStudios - 5 Tipos de Usuários

## 🎯 **Visão Geral do Sistema**

O FVStudios Dashboard agora possui uma arquitetura robusta com **5 tipos distintos de usuários**, cada um com permissões e funcionalidades específicas para suas necessidades.

---

## 👥 **Tipos de Usuários Implementados**

### 1. 🔴 **ADMIN (FVStudios - Equipe Interna)**
- **Rota**: `/admin`
- **Acesso**: Controle total do sistema
- **Características**:
  - Acesso a todos os dashboards
  - Gerenciamento de todos os clientes
  - Configurações do sistema
  - Logs e monitoramento
  - Recursos ilimitados

**Funcionalidades Exclusivas**:
- Status do sistema em tempo real
- Gerenciamento de usuários e roles
- Configurações globais da plataforma
- Acesso a métricas de toda a plataforma

---

### 2. 🏢 **AGENCY (Agências Parceiras)**
- **Rota**: `/agency`
- **Acesso**: Gestão completa com foco em equipe
- **Características**:
  - Dashboard com métricas da agência
  - Gerenciamento de clientes próprios
  - Ferramentas de colaboração em equipe
  - IA avançada disponível
  - Pode convidar colaboradores

**Limites do Plano**:
- Até 100 projetos simultâneos
- Até 50 clientes
- 10.000 requisições de IA/mês
- 100GB de storage

---

### 3. 🎯 **INDEPENDENT (Produtores Independentes)**
- **Rota**: `/independent`
- **Acesso**: Foco em trabalho autônomo
- **Características**:
  - Dashboard personalizado para poucos clientes
  - Ferramentas de organização individual
  - Pode cadastrar clientes para visualização
  - IA avançada disponível
  - **SEM funcionalidades de equipe**

**Limites do Plano**:
- Até 25 projetos
- Até 10 clientes
- 5.000 requisições de IA/mês
- 50GB de storage

**Diferencial**: Focado para profissionais que trabalham sozinhos mas atendem clientes.

---

### 4. 🎬 **INFLUENCER (Criadores de Conteúdo)**
- **Rota**: `/influencer`
- **Acesso**: Produção individual sem clientes
- **Características**:
  - Dashboard voltado para criação de conteúdo
  - Ferramentas de análise de performance
  - IA avançada para criação
  - Calendário de postagens
  - **NÃO trabalha com clientes externos**

**Limites do Plano**:
- Até 15 projetos
- 0 clientes (foco próprio)
- 3.000 requisições de IA/mês
- 25GB de storage

**Diferencial**: Ferramentas específicas para influenciadores e criadores de conteúdo.

---

### 5. 🆓 **FREE (Plano Gratuito)**
- **Rota**: `/free`
- **Acesso**: Funcionalidades básicas limitadas
- **Características**:
  - Dashboard simplificado
  - Projetos pessoais básicos
  - **SEM IA**
  - Incentivos para upgrade

**Limites do Plano**:
- Até 3 projetos
- 0 clientes
- 0 requisições de IA
- 1GB de storage

**Diferencial**: Versão de teste com funcionalidades limitadas e chamadas para upgrade.

---

### 6. 👤 **CLIENT (Clientes das Agências)**
- **Rota**: `/client/{id}`
- **Acesso**: Visualização apenas
- **Características**:
  - Dashboard personalizado com seus projetos
  - Visualização de relatórios
  - Não pode criar ou modificar

---

## 🛡️ **Sistema de Permissões Implementado**

### **Arquivo**: `lib/permissions.ts`

Contém matriz completa de permissões por tipo de usuário:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: { /* Todas as permissões */ },
  agency: { /* Foco em equipe e clientes */ },
  independent: { /* Individual + clientes */ },
  influencer: { /* Individual sem clientes */ },
  free: { /* Básico limitado */ },
  client: { /* Apenas visualização */ }
}
```

---

## 🔒 **Proteção de Rotas**

### **PermissionGuard Component**
```typescript
<PermissionGuard allowedRoles={['admin', 'agency']} showUnauthorized>
  <ComponenteProtegido />
</PermissionGuard>
```

### **Verificações Automáticas**:
1. **Usuário logado**: Redirect para `/login`
2. **Role válido**: Verificação de permissão
3. **Acesso negado**: Mensagem ou redirect
4. **Roteamento inteligente**: Cada usuário vai para sua área

---

## 📊 **Dashboards Específicos**

### **Admin Dashboard** (`/admin`)
- Status do sistema
- Métricas globais
- Acesso rápido a todas as funcionalidades
- Indicadores de performance

### **Agency Dashboard** (`/agency`)
- Métricas da agência
- Gestão de equipe
- Clientes e projetos
- Colaboração

### **Independent Dashboard** (`/independent`)
- Carteira de clientes (limitada)
- Projetos pessoais
- Ferramentas de produtividade
- Analytics básico

### **Influencer Dashboard** (`/influencer`)
- Projetos de conteúdo
- Métricas de performance
- Ferramentas de criação IA
- Calendário de publicações

### **Free Dashboard** (`/free`)
- Projetos básicos
- Incentivos para upgrade
- Limites visíveis
- Call-to-actions premium

---

## 🎨 **Design System**

### **Cores por Tipo de Usuário**:
- **Admin**: Vermelho (poder/controle)
- **Agency**: Azul (corporativo)
- **Independent**: Verde (crescimento)
- **Influencer**: Roxo (criatividade)
- **Free**: Cinza (básico) + elementos premium dourados

### **Elementos Visuais**:
- Badges de plano
- Indicadores de limite
- Barras de progresso para uso
- Call-to-actions contextuais

---

## ⚙️ **Funcionalidades Diferenciais**

### **Por Tipo de Usuário**:

| Funcionalidade | Admin | Agency | Independent | Influencer | Free |
|----------------|-------|--------|-------------|------------|------|
| IA Avançada | ✅ | ✅ | ✅ | ✅ | ❌ |
| Clientes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Equipe | ✅ | ✅ | ❌ | ❌ | ❌ |
| Relatórios | ✅ | ✅ | ✅ | Básico | ❌ |
| Storage | ∞ | 100GB | 50GB | 25GB | 1GB |
| Projetos | ∞ | 100 | 25 | 15 | 3 |

---

## 🚀 **Roteamento Inteligente**

### **Arquivo**: `app/page.tsx`
```typescript
switch (profile.role) {
  case "admin": redirect("/admin")
  case "agency": redirect("/agency")
  case "independent": redirect("/independent")
  case "influencer": redirect("/influencer")
  case "free": redirect("/free")
  case "client": redirect(`/client/${user.id}`)
}
```

---

## 💡 **Benefícios da Arquitetura**

✅ **Escalabilidade**: Fácil adicionar novos tipos de usuário  
✅ **Segurança**: Múltiplas camadas de proteção  
✅ **UX Personalizada**: Interface adaptada para cada perfil  
✅ **Monetização Clara**: Limites e incentivos para upgrade  
✅ **Manutenibilidade**: Código organizado e reutilizável  

---

## 🔄 **Próximos Passos**

1. **Testes de Integração**: Validar todos os fluxos
2. **Níveis Hierárquicos**: Implementar subníveis em agências
3. **Sistema de Billing**: Controle de pagamentos
4. **Analytics Avançado**: Métricas por tipo de usuário
5. **Mobile Responsivo**: Adaptar para todas as telas

---

Este sistema fornece uma base sólida e escalável para atender diferentes tipos de usuários com necessidades específicas, mantendo a segurança e organização da plataforma FVStudios.
