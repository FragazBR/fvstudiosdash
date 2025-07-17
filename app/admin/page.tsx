import { supabaseServer } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"
import { PerformanceMetrics } from "@/components/PerformanceMetrics"
import { CampaignChart } from "@/components/CampaignChart"
import { CreateClientForm } from "@/components/CreateClientForm"
import { ListClients } from "@/components/ListClients"

export default async function AdminPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "agency") {
    redirect("/unauthorized")
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Painel da Agência</h1>
      <CreateClientForm />
      <ListClients />
      <PerformanceMetrics />
      <CampaignChart />
    </div>
  )
}
