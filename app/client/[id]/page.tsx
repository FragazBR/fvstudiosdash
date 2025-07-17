import { supabaseServer } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"
import { PerformanceMetrics } from "@/components/PerformanceMetrics"
import { CampaignChart } from "@/components/CampaignChart"

export default async function ClientDashboard({
  params,
}: {
  params: { id: string }
}) {
  "use server"

  const supabase = await supabaseServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error("Usuário não autenticado:", userError)
    return redirect("/login")
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (
    !profile ||
    profileError ||
    profile.role !== "client" ||
    profile.id.toString() !== params.id
  ) {
    console.error("Acesso não autorizado:", profileError)
    return redirect("/unauthorized")
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Desempenho da Campanha</h1>
      <PerformanceMetrics />
      <CampaignChart />
    </div>
  )
}
