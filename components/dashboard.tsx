"use client";
import { useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./Shared/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle,
  Clock,
  Calendar,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Users,
  BarChart3
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useAnalytics } from "@/hooks/useAnalytics";
import Link from "next/link";

interface DashboardProps {
  userMode?: boolean;
}

export default function Dashboard({ userMode = false }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const { data: analytics, loading } = useAnalytics('30');

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar
          name="Dashboard"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Bem-vindo, {user?.name || 'Usuário'}! 👋
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Aqui está um resumo das suas atividades
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Este mês
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {loading ? (
                <>
                  <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
                  <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
                  <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
                  <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
                </>
              ) : (
                <>
                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Minhas Tarefas</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {analytics?.analytics.tasks.total || 0}
                          </p>
                        </div>
                        <Briefcase className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concluídas</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {analytics?.analytics.tasks.completed || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Progresso</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {analytics?.analytics.tasks.in_progress || 0}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projetos</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {analytics?.analytics.projects.active || 0}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/my-tasks">
                    <Button className="w-full justify-start" variant="outline">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Ver Minhas Tarefas
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Ver Projetos
                    </Button>
                  </Link>
                  <Link href="/calendar">
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Abrir Calendário
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Progresso Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tarefas Concluídas</span>
                        <span className="text-sm font-medium">
                          {analytics?.analytics.tasks.completed || 0} de {analytics?.analytics.tasks.total || 0}
                        </span>
                      </div>
                      <Progress 
                        value={((analytics?.analytics.tasks.completed || 0) / (analytics?.analytics.tasks.total || 1)) * 100} 
                        className="h-2" 
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Você completou {Math.round(((analytics?.analytics.tasks.completed || 0) / (analytics?.analytics.tasks.total || 1)) * 100)}% das suas tarefas
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Role-specific message */}
            {user?.role && ['admin', 'agency_owner', 'agency_manager', 'independent_producer'].includes(user.role) && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Dashboard Avançado Disponível
                      </h3>
                      <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                        Como {user.role === 'admin' ? 'administrador' : user.role === 'agency_owner' ? 'dono de agência' : 'produtor independente'}, você tem acesso ao dashboard avançado com métricas detalhadas de gestão.
                      </p>
                      <Link href="/agency">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          Acessar Dashboard da Agência
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
