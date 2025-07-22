"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGuard } from "@/components/permission-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Shared/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Users, FolderOpen, Calendar, TrendingUp, Settings, Shield, Plus, UserPlus, Loader2 } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function AdminHomeContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    plan: "",
    notes: ""
  });
  const router = useRouter();
  const adminStats = useAdminStats();
  const supabase = createClientComponentClient();

  const quickStats = [
    { 
      title: "Total de Clientes", 
      value: adminStats.isLoading ? "..." : adminStats.totalClients.toString(), 
      icon: Users, 
      color: "text-gray-600 dark:text-gray-400",
      isLoading: adminStats.isLoading
    },
    { 
      title: "Projetos Ativos", 
      value: adminStats.isLoading ? "..." : adminStats.activeProjects.toString(), 
      icon: FolderOpen, 
      color: "text-gray-600 dark:text-gray-400",
      isLoading: adminStats.isLoading
    },
    { 
      title: "Eventos Hoje", 
      value: adminStats.isLoading ? "..." : adminStats.todayEvents.toString(), 
      icon: Calendar, 
      color: "text-gray-600 dark:text-gray-400",
      isLoading: adminStats.isLoading
    },
    { 
      title: "Performance Geral", 
      value: adminStats.isLoading ? "..." : adminStats.systemPerformance, 
      icon: TrendingUp, 
      color: "text-gray-600 dark:text-gray-400",
      isLoading: adminStats.isLoading
    }
  ];

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: clientForm.email,
        password: 'TemporaryPass123!', // Senha temporária
        options: {
          data: {
            name: clientForm.name,
            company: clientForm.company,
            phone: clientForm.phone
          }
        }
      });

      if (authError) throw authError;

      // Criar perfil do usuário
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: clientForm.email,
            name: clientForm.name,
            company: clientForm.company,
            phone: clientForm.phone,
            role: clientForm.plan || 'free',
            notes: clientForm.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) throw profileError;
      }
      
      // Reset do formulário
      setClientForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        plan: "",
        notes: ""
      });
      
      setCreateClientOpen(false);
      
      // Mostrar sucesso
      alert(`Cliente ${clientForm.name} criado com sucesso! Um email de confirmação foi enviado para ${clientForm.email}`);
      
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      alert(`Erro ao criar cliente: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setClientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-64">
        <Topbar
          name="FVStudios Admin - Home"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="py-10 pt-20">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Admin Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
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
                
                {/* Botão Criar Cliente */}
                <Dialog open={createClientOpen} onOpenChange={setCreateClientOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-white">Criar Novo Cliente</DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Preencha as informações do cliente abaixo
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleClientSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Nome Completo</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Nome do cliente"
                            value={clientForm.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="email@exemplo.com"
                            value={clientForm.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Telefone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={clientForm.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company" className="text-gray-700 dark:text-gray-300">Empresa</Label>
                          <Input
                            id="company"
                            type="text"
                            placeholder="Nome da empresa"
                            value={clientForm.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="plan" className="text-gray-700 dark:text-gray-300">Plano</Label>
                        <Select onValueChange={(value) => handleInputChange('plan', value)} value={clientForm.plan}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione o plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Gratuito</SelectItem>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="agency">Agência</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Adicione observações sobre o cliente..."
                          value={clientForm.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          className="mt-1 min-h-[80px]"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setCreateClientOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isCreating}
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Criando Cliente...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Criar Cliente
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Controle total do sistema e gerenciamento de todas as contas
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {adminStats.error ? (
                <div className="col-span-full">
                  <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <CardContent className="p-6">
                      <p className="text-red-600 dark:text-red-400">
                        Erro ao carregar dados: {adminStats.error}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                quickStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] hover:border-gray-300 dark:hover:border-[#64f481]/30 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {stat.title}
                            </p>
                            <div className="flex items-center mt-2">
                              {stat.isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                              ) : null}
                              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {stat.value}
                              </p>
                            </div>
                          </div>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                    Acesso Rápido
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Navegue pelas principais funcionalidades administrativas
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="p-3 text-left rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                    >
                      <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400 mb-2" />
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Dashboard</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Métricas detalhadas</p>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/contas')}
                      className="p-3 text-left rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                    >
                      <Users className="h-5 w-5 text-gray-600 dark:text-gray-400 mb-2" />
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Contas</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gerenciar clientes</p>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/projects')}
                      className="p-3 text-left rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                    >
                      <FolderOpen className="h-5 w-5 text-gray-600 dark:text-gray-400 mb-2" />
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Projetos</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gestão de projetos</p>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/settings')}
                      className="p-3 text-left rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                    >
                      <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400 mb-2" />
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Configurações</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sistema geral</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Gestão de Clientes */}
              <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                    Gestão de Clientes
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Crie e gerencie contas de clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Clientes Ativos:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {adminStats.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            adminStats.totalClients
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Novos (mês):</span>
                        <span className="font-medium text-green-600">
                          {adminStats.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `+${adminStats.newClientsThisMonth}`
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setCreateClientOpen(true)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Novo Cliente
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => router.push('/admin/clients')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Ver Todos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Status do Sistema</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Informações sobre o estado atual da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Servidor</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md">Online</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Base de Dados</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md">Conectado</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Backup</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md">Última: 02:00</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Performance</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-md">Excelente</span>
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
