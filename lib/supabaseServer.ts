'use server'

import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from './supabase.types'
import type { SupabaseClientOptions } from '@supabase/auth-helpers-nextjs'

export const supabaseServer = async () => {
  const cookieStore = cookies()

  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  }, {
    cookieOptions: {
      name: 'sb-vstudio-auth-token', // ou o nome padrão, se aplicável
    },
  } as SupabaseClientOptions<Database>)
}
