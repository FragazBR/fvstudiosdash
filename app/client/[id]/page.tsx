import DashboardClient from "@/components/dashboardClient";
import { type Metadata, type ResolvingMetadata } from "next";

type PageProps = { params: Promise<{ id: string }> };

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;
  return <DashboardClient clientId={id} />;
}
