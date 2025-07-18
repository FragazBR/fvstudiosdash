import DashboardClient from "@/components/dashboardClient";
import { type Metadata, type ResolvingMetadata } from "next";

type PageProps = { params: { id: string } };

export default function ClientPage({ params }: PageProps) {
  return <DashboardClient clientId={params.id} />;
}
