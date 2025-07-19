"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGuard } from "@/components/permission-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Shared/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FolderOpen, Calendar, TrendingUp, Settings, Shield } from "lucide-react";

function AdminHomeContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const quickStats = [
    { title: "Total de Clientes", value: "24", icon: Users, color: "text-blue-600" },
    { title: "Projetos Ativos", value: "12", icon: FolderOpen, color: "text-green-600" },
    { title: "Eventos Hoje", value: "5", icon: Calendar, color: "text-purple-600" },
    { title: "Performance Geral", value: "98%", icon: TrendingUp, color: "text-emerald-600" }
  ];

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Topbar
          name="FVStudios Admin - Home"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Admin Header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Painel Administrativo FVStudios
                  </h1>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
                    🔒 Acesso Exclusivo - Equipe FVStudios
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Controle total do sistema e gerenciamento de todas as contas
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="bg-white dark:bg-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Acesso Rápido
                  </CardTitle>
                  <CardDescription>
                    Navegue pelas principais funcionalidades administrativas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Activity className="h-8 w-8 text-green-600 mb-2" />
                      <p className="font-medium">Dashboard</p>
                      <p className="text-xs text-gray-500">Métricas detalhadas</p>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/contas')}
                      className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Users className="h-8 w-8 text-blue-600 mb-2" />
                      <p className="font-medium">Contas</p>
                      <p className="text-xs text-gray-500">Gerenciar clientes</p>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/projects')}
                      className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FolderOpen className="h-8 w-8 text-purple-600 mb-2" />
                      <p className="font-medium">Projetos</p>
                      <p className="text-xs text-gray-500">Gestão de projetos</p>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/settings')}
                      className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="h-8 w-8 text-orange-600 mb-2" />
                      <p className="font-medium">Configurações</p>
                      <p className="text-xs text-gray-500">Sistema geral</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle>Status do Sistema</CardTitle>
                  <CardDescription>
                    Informações sobre o estado atual da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Servidor</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Base de Dados</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Conectado</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Backup</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Última: 02:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Performance</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Excelente</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <PermissionGuard allowedRoles={['admin']} showUnauthorized>
      <AdminHomeContent />
    </PermissionGuard>
  );
}
