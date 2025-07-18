import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabaseServer"

export default async function HomePage(): Promise<JSX.Element> {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<any>()

  if (!profile) {
    redirect("/login")
  }

  if (!profile.role) {
    redirect("/unauthorized")
  }

  if (profile.role === "admin") {
    redirect("/admin/dashboard")
  }
  if (profile.role === "personal") {
    redirect("/personal/dashboard")
  }
  if (profile.role === "client") {
    redirect(`/client/${user.id}`)
  }
  if (profile.role === "agency") {
    redirect("/dashboard")
  }
  redirect("/unauthorized")
}
