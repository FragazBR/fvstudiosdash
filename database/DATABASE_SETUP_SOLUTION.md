# Database Setup Solution - FVStudios Dashboard

## Problem Detected
PostgreSQL database is not running or not installed on the system. This is preventing the execution of database migration scripts.

## Solution Steps

### 1. Install PostgreSQL (if not installed)

**Option A: Official PostgreSQL Installer**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Choose version 15 or 16
3. During installation, set:
   - Username: `postgres`
   - Password: (remember this password)
   - Port: `5432` (default)

**Option B: Using Docker (Recommended for Development)**
```bash
# Pull and run PostgreSQL container
docker run --name fvstudios-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=fvstudiosdash \
  -p 5432:5432 \
  -d postgres:15

# Or using docker-compose (create docker-compose.yml):
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: fvstudios-postgres
    environment:
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: fvstudiosdash
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

### 2. Start PostgreSQL Service

**For Windows Installation:**
```cmd
# Start service
net start postgresql-x64-16

# Or using Services.msc - look for "postgresql-x64-16" and start it
```

**For Docker:**
```bash
docker start fvstudios-postgres
```

### 3. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fvstudiosdash;

# Exit
\q
```

### 4. Execute Database Migrations

Once PostgreSQL is running, execute the migrations in this order:

```bash
# 1. Basic structure
psql -U postgres -d fvstudiosdash -f MINIMAL_BASE_MIGRATION.sql

# 2. Complete migration (if minimal works)
psql -U postgres -d fvstudiosdash -f COMPLETE_MIGRATION_FIXED.sql

# 3. Additional schemas
psql -U postgres -d fvstudiosdash -f INTELLIGENT_SYSTEM_SCHEMA.sql
psql -U postgres -d fvstudiosdash -f SOCIAL_MEDIA_API_SCHEMA.sql
psql -U postgres -d fvstudiosdash -f N8N_INTEGRATION_SCHEMA.sql
```

### 5. Environment Variables

Create/update your `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fvstudiosdash"
DIRECT_URL="postgresql://postgres:your_password@localhost:5432/fvstudiosdash"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys (configure as needed)
OPENAI_API_KEY=your_openai_key
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Current Database Files Status

### ✅ Ready Files
- `MINIMAL_BASE_MIGRATION.sql` - Essential tables only (just created)
- `COMPLETE_MIGRATION_FIXED.sql` - Complete migration without integration_id errors
- `INTELLIGENT_SYSTEM_SCHEMA.sql` - AI system tables (fixed)
- `SOCIAL_MEDIA_API_SCHEMA.sql` - Social media integration tables
- `N8N_INTEGRATION_SCHEMA.sql` - N8N workflow automation tables

### 🔧 Debug Files
- `DEBUG_INTEGRATION_ERROR.sql` - Diagnostic script
- `FIX_API_INTEGRATIONS.sql` - Specific fix for api_integrations table
- `TEST_N8N_SCHEMA.sql` - Validation script for N8N schema

## Migration Execution Order

**If you want to start with minimal setup:**
1. `MINIMAL_BASE_MIGRATION.sql` (5 essential tables)
2. Then add other schemas as needed

**If you want complete setup:**
1. `COMPLETE_MIGRATION_FIXED.sql` (all tables)
2. Additional feature schemas

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql -U postgres -h localhost -p 5432 -d fvstudiosdash -c "SELECT version();"

# Check running services
sc query | findstr postgres  # Windows
ps aux | grep postgres       # Linux/Mac
docker ps | grep postgres    # Docker
```

### Migration Errors
```bash
# Clear database and start fresh
psql -U postgres -d fvstudiosdash -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then re-run migrations
```

### Permission Issues
```bash
# Grant permissions (if needed)
psql -U postgres -d fvstudiosdash -c "GRANT ALL ON SCHEMA public TO postgres;"
```

## Next Steps After Database Setup

1. **Test Application Connection**
   ```bash
   npm run dev
   # Check if app connects to database
   ```

2. **Run Database Tests**
   ```bash
   # Test database functionality
   psql -U postgres -d fvstudiosdash -f TEST_N8N_SCHEMA.sql
   ```

3. **Configure APIs**
   - Set up Meta Developer account for Facebook/Instagram
   - Configure Google Cloud Console for Google Ads
   - Set up other social media API credentials

4. **Test Full System**
   - Create test agency
   - Create test user
   - Test API integrations
   - Test AI system functionality

## Support

If you encounter any issues:
1. Check PostgreSQL logs
2. Verify environment variables
3. Test database connection manually
4. Check application logs for specific errors

The system has been designed to handle all the requirements from the previous conversation including:
- ✅ Multi-tenant agency system
- ✅ Complete client management
- ✅ API integrations (Meta, Google, TikTok, LinkedIn)
- ✅ AI system with intelligent recommendations
- ✅ N8N workflow automation
- ✅ Real-time notifications
- ✅ Social media post management
- ✅ Advanced project management with tasks
- ✅ WhatsApp integration
- ✅ Canva design management