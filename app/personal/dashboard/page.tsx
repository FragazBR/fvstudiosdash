
import React from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { useTranslation } from "react-i18next";

export default async function PersonalDashboardPage() {
  const { t } = useTranslation();
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
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

  if (!profile || profileError || profile.role !== "personal") {
    return redirect("/unauthorized");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('personal.welcome')}</h1>
      <p>{t('personal.limitedResources')}</p>
    </div>
  );
}
