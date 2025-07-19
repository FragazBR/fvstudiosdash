


import { redirect } from "next/navigation";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { CampaignChart } from "@/components/CampaignChart";
import { CreateClientForm } from "@/components/CreateClientForm";
import ListClients from "@/components/ListClients";
import React from "react";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function AdminPage() {
  // Verificação de autenticação e role
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Busca o perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Verifica se é admin
  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      <CreateClientForm />
      <ListClients />
      <PerformanceMetrics />
      <CampaignChart />
    </div>
  );
}
