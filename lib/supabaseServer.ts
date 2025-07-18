import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "./supabase.types"

export const supabaseServer = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name) {
          cookieStore.set({ name, value: "", maxAge: -1 })
        },
      },
    }
  )
}
