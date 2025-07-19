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
          // Silently fail in read-only contexts
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie modification not available in this context
            console.warn('Cookie modification attempted in read-only context:', name)
          }
        },
        remove(name) {
          // Silently fail in read-only contexts
          try {
            cookieStore.set({ name, value: "", maxAge: -1 })
          } catch (error) {
            // Cookie modification not available in this context
            console.warn('Cookie removal attempted in read-only context:', name)
          }
        },
      },
    }
  )
}
