import { type PageProps } from "next"
import DashboardClient from "@/components/dashboardClient"
import { supabaseServer } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"

export default async function ClientPage({ params }: PageProps<{ id: string }>) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error("❌ Usuário não autenticado:", userError)
    return redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,id")
    .eq("id", user.id)
    .eq("id", params.id)
    .single()

  if (profileError || !profile || profile.role !== "client") {
    console.error("❌ Acesso negado:", profileError)
    return redirect("/unauthorized")
  }

  return <DashboardClient clientId={params.id} />
}
