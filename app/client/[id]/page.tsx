import { supabaseServer } from "@/lib/supabaseserver"
import { redirect } from "next/navigation"
import { PerformanceMetrics } from "@/components/PerformanceMetrics"
import { CampaignChart } from "@/components/CampaignChart"

export default async function ClientDashboard({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "client" || profile.id.toString() !== params.id) {
    redirect("/unauthorized")
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Desempenho da Campanha</h1>
      <PerformanceMetrics />
      <CampaignChart />
    </div>
  )
}
