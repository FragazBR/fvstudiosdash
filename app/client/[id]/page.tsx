import DashboardClient from "@/components/dashboardClient";

export default function ClientPage({ params }: { params: { id: string } }) {
  return <DashboardClient clientId={params.id} />;
}
