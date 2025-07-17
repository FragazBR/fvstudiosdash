import { CampaignChart } from "@/components/CampaignChart"
import { PerformanceMetrics } from "@/components/PerformanceMetrics"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function ClientDashboard({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "client") {
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
