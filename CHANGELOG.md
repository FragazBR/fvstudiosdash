# 📋 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.1.0] - 2025-01-25

### 🔧 Fixed
- **API 500 Errors:** Corrigidos erros de foreign keys nas APIs de projetos e tarefas
- **Database Schema:** Adicionadas colunas `created_by` em projects e `assigned_to` em tasks
- **Foreign Key Constraints:** Implementadas todas as foreign keys necessárias:
  - `projects_created_by_fkey` → user_profiles(id)
  - `tasks_created_by_fkey` → user_profiles(id) 
  - `tasks_assigned_to_fkey` → user_profiles(id)

### 🆕 Added
- **Diagnostic Scripts:** Scripts para identificar e corrigir problemas de API
  - `scripts/CHECK_STRUCTURE.sql` - Verificar estrutura das tabelas
  - `scripts/FIX_API_ERRORS_CORRECTED.sql` - Corrigir foreign keys faltando
- **Documentation:** Seção de troubleshooting no README

### 🔄 Changed
- **README.md:** Atualizada versão para 2.1.0 com novas correções
- **Setup Instructions:** Adicionadas instruções para correção de problemas de API

### 🧪 Technical Details
- Resolvidos erros PostgREST: "Could not find relationship between projects and created_by"
- Resolvidos erros PostgREST: "Could not find relationship between tasks and assigned_to"
- APIs `/api/projects` e `/api/tasks` agora funcionam com relacionamentos corretos

## [2.0.0] - 2025-01-20

### 🆕 Added
- **Team Management System:** Sistema completo de gestão de equipes
  - Criação direta de colaboradores
  - Sistema de convites por email
  - Dashboard unificado com toggle dinâmico
- **Multi-tenant Architecture:** Suporte completo para múltiplas agências
- **Role-based Permissions:** 9 tipos de usuários com permissões granulares
- **Stripe Integration:** Sistema de pagamentos e assinaturas
- **Modern UI:** Interface com shadcn/ui e tema escuro/claro

### 🔧 Fixed
- **Authentication:** Sistema de autenticação robusto com JWT
- **Database Security:** Row Level Security (RLS) implementado
- **Performance:** Otimizações de query e cache

### 📚 Documentation
- **README:** Documentação completa do sistema
- **Installation Guide:** Guia passo-a-passo de instalação
- **Architecture:** Diagramas e explicações técnicas

## [1.0.0] - 2024-12-15

### 🎉 Initial Release
- **Core System:** Sistema básico de dashboard
- **User Management:** Gestão básica de usuários
- **Project Management:** Sistema simples de projetos
- **Database Setup:** Estrutura inicial do banco de dados

---

**Formato baseado em [Keep a Changelog](https://keepachangelog.com/)**