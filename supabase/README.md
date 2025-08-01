# =� Supabase Configuration

This directory contains Supabase-specific configuration files and archived migration scripts.

## =� Current Structure

```
supabase/
   README.md                    # This file
   SETUP_DATABASE.md           # Database setup guide (legacy)
   migrations/                 # Supabase CLI migrations (legacy)
   archive_old/               # Archived SQL files (development history)
```

## =� Quick Setup

For new installations, use the consolidated migration script:

```bash
# Execute the complete migration
psql $DATABASE_URL -f database/COMPLETE_MIGRATION.sql

# Or using Supabase CLI
npx supabase db reset
```

## =� Documentation

- **Main Setup Guide**: [`docs/INSTALLATION.md`](../docs/INSTALLATION.md)
- **Complete Migration**: [`database/COMPLETE_MIGRATION.sql`](../database/COMPLETE_MIGRATION.sql)
- **Security Architecture**: [`docs/SECURITY.md`](../docs/SECURITY.md)

## =' Legacy Files

All old migration files have been moved to `archive_old/` for historical reference. The current system uses a single consolidated migration file for clean installations.

---

**=� For fresh installations, follow the [Installation Guide](../docs/INSTALLATION.md)**