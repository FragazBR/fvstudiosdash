
"use client";

import { redirect } from "next/navigation";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";
import { CampaignChart } from "@/components/CampaignChart";
import { CreateClientForm } from "@/components/CreateClientForm";
import ListClients from "@/components/ListClients";
import React, { useState } from "react";
import { supabaseServer } from "@/lib/supabaseServer";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Shared/Topbar";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      
      // Verifica se é admin
      if (user.role !== 'admin') {
        router.replace('/unauthorized');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col pt-16">
        <Topbar
          name="Painel Administrativo"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-gray-50 dark:bg-[#121212] p-3 lg:p-6">
          <div className="space-y-6">
            <CreateClientForm />
            <ListClients />
            <PerformanceMetrics />
            <CampaignChart />
          </div>
        </main>
      </div>
    </div>
  );
}
