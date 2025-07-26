# 🔧 Scripts - FVStudios Dashboard

Utilitários e scripts de manutenção para o FVStudios Dashboard.

## 📁 Estrutura Atual

```
scripts/
├── README.md                     # Este arquivo
├── DIAGNOSTIC.sql               # Script de diagnóstico do sistema
├── PRODUCTION_SETUP.sql         # Setup para produção
├── TEST_ALL_FUNCTIONALITIES.sql # Testes automatizados
├── VIEW_DATABASE_STRUCTURE.sql  # Verificar estrutura do banco
├── add_sample_tasks.js          # Adicionar tarefas de exemplo  
├── archive/                     # Scripts históricos de desenvolvimento
└── *.js                        # Utilitários JavaScript diversos
```

## 🎯 Scripts Principais

### 📊 `DIAGNOSTIC.sql`
**Script de diagnóstico completo do sistema**

Verifica a integridade de:
- ✅ Estrutura das tabelas
- ✅ Políticas RLS ativas
- ✅ Triggers funcionando
- ✅ Funções criadas
- ✅ Índices de performance
- ✅ Dados básicos consistentes

```bash
# Executar diagnóstico
psql $DATABASE_URL -f scripts/DIAGNOSTIC.sql
```

### 🚀 `PRODUCTION_SETUP.sql`
**Configurações específicas para produção**

Aplica:
- 🔒 Políticas de segurança reforçadas
- ⚡ Otimizações de performance
- 📊 Configurações de auditoria
- 🔧 Tuning específico para produção

### 🧪 `TEST_ALL_FUNCTIONALITIES.sql`
**Testes automatizados do sistema**

Testa:
- 👥 Sistema de usuários e permissões
- 🔗 Integrações de API  
- 📱 Funcionalidades multi-tenant
- 🤖 Sistema inteligente
- 📈 Cálculos de métricas

### 📋 `VIEW_DATABASE_STRUCTURE.sql`
**Visualizar estrutura completa do banco**

Mostra:
- 📊 Todas as tabelas e colunas
- 🔐 Políticas RLS ativas
- ⚡ Triggers e funções
- 📈 Estatísticas de uso

## 🗃️ Archive

A pasta `archive/` contém todo o histórico de desenvolvimento:
- Scripts de migração antigos
- Correções aplicadas durante o desenvolvimento
- Experimentos e testes
- Backup de configurações antigas

**Nota**: Para instalações novas, use o [`database/COMPLETE_MIGRATION.sql`](../database/COMPLETE_MIGRATION.sql) ao invés dos scripts do archive.

## 🔧 Utilitários JavaScript

### `add_sample_tasks.js`
Adiciona tarefas de exemplo para demonstração:

```bash
node scripts/add_sample_tasks.js
```

### Scripts de Teste e Configuração
- `create_test_data.js` - Criar dados de teste
- `check_schema.js` - Verificar esquema do banco
- `execute_sql_direct.js` - Executar SQL via Node.js

## 📖 Documentação Relacionada

- **Instalação Completa**: [`docs/INSTALLATION.md`](../docs/INSTALLATION.md)
- **Migração Principal**: [`database/COMPLETE_MIGRATION.sql`](../database/COMPLETE_MIGRATION.sql)
- **Segurança**: [`docs/SECURITY.md`](../docs/SECURITY.md)
- **APIs**: [`docs/API_INTEGRATIONS.md`](../docs/API_INTEGRATIONS.md)

## 🚨 Notas Importantes

### Para Desenvolvimento
- Use `DIAGNOSTIC.sql` regularmente para verificar a saúde do sistema
- Scripts no `archive/` são apenas para referência histórica
- Sempre teste scripts em ambiente de desenvolvimento primeiro

### Para Produção  
- Execute `PRODUCTION_SETUP.sql` após a migração principal
- Configure monitoring e alertas
- Mantenha backups regulares antes de executar scripts

---

**⚡ Para instalação do zero, siga o [Guia de Instalação](../docs/INSTALLATION.md)**