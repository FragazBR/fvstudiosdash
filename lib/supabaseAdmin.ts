import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase-simple"

// Cliente Supabase com service role key para operações administrativas
export const supabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não está configurada')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Please configure it in Vercel environment variables.')
  }

  console.log('Criando cliente admin com service role key...')
  
  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  )
}

// Função para verificar se a service role key está configurada
export const checkServiceRoleKey = (): boolean => {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Função para obter informações da configuração (sem expor a key)
export const getAdminConfig = () => {
  return {
    hasServiceRoleKey: checkServiceRoleKey(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    environment: process.env.NODE_ENV
  }
}