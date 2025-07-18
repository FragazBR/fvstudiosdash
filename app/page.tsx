import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabaseServer"

export default async function HomePage(): Promise<JSX.Element> {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return redirect("/login")
  }

  if (profile.role === "client") {
    return redirect(`/client/${user.id}`)
  }

  if (profile.role === "agency") {
    return redirect("/dashboard")
  }

  return redirect("/unauthorized")
}
