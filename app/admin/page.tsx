


import { redirect } from "next/navigation";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { CampaignChart } from "@/components/CampaignChart";
import { CreateClientForm } from "@/components/CreateClientForm";
import ListClients from "@/components/ListClients";
import React from "react";


import { getTranslation } from "@/lib/utils-ssr";
import { supabaseServer } from "@/lib/supabaseServer";
import { ErrorBoundary } from "@/components/ErrorBoundary";


export default async function AdminPage() {
  const t = await getTranslation();
  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t("dashboard.agencyPanel")}</h1>
        <CreateClientForm />
        <ListClients />
        <PerformanceMetrics />
        <CampaignChart />
      </div>
    </ErrorBoundary>
  );
}
