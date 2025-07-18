


import { redirect } from "next/navigation";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { CampaignChart } from "@/components/CampaignChart";
import { CreateClientForm } from "@/components/CreateClientForm";
import ListClients from "@/components/ListClients";
import React from "react";

import { useTranslation } from "react-i18next";
import { supabaseServer } from "@/lib/supabaseServer";


export default async function AdminPage() {
  const { t } = useTranslation();
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    console.error(t("errors.userFetch"), userError);
    return redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profileError || profile.role !== "agency") {
    console.error(t("errors.accessDenied"), profileError);
    return redirect("/unauthorized");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.agencyPanel")}</h1>
      <CreateClientForm />
      <ListClients />
      <PerformanceMetrics />
      <CampaignChart />
    </div>
  );
}
