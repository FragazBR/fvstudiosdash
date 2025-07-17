import { supabaseServer } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"
import { PerformanceMetrics } from "@/components/PerformanceMetrics"
import { CampaignChart } from "@/components/CampaignChart"
import { CreateClientForm } from "@/components/CreateClientForm"
import ListClients from '@/components/ListClients'


export default async function AdminPage() {
  const supabase = await supabaseServer()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Erro ao obter usuário:", userError)
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "agency") {
    console.error("Acesso negado para admin:", profileError)
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
