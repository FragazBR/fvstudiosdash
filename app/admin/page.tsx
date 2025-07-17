import { PerformanceMetrics } from "@/components/PerformanceMetrics"
import { CampaignChart } from "@/components/CampaignChart"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "agency") {
    redirect("/unauthorized")
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Painel da Agência</h1>
      <PerformanceMetrics />
      <CampaignChart />
    </div>
  )
}
