"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
  description?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

interface ProjectMetrics {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  averageCompletionTime: number;
  onTimeDelivery: number;
  budgetVariance: number;
}

interface TeamMetrics {
  totalMembers: number;
  utilization: number;
  satisfaction: number;
  productivity: number;
}

interface ClientMetrics {
  totalClients: number;
  retentionRate: number;
  acquisitionRate: number;
  satisfaction: number;
}

const mockProjectMetrics: ProjectMetrics = {
  totalProjects: 156,
  completedProjects: 142,
  activeProjects: 14,
  averageCompletionTime: 12.5,
  onTimeDelivery: 94,
  budgetVariance: -5.2
};

const mockTeamMetrics: TeamMetrics = {
  totalMembers: 8,
  utilization: 87,
  satisfaction: 4.6,
  productivity: 92
};

const mockClientMetrics: ClientMetrics = {
  totalClients: 24,
  retentionRate: 91,
  acquisitionRate: 15,
  satisfaction: 4.8
};

export function MetricCard({ title, value, change, trend = "neutral", icon: Icon, description, color = "blue" }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
  };

  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727] hover:border-gray-300 dark:hover:border-[#64f481]/30 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
          {change && (
            <div className={cn(
              "flex items-center text-sm font-medium",
              trend === "up" && "text-green-600 dark:text-green-400",
              trend === "down" && "text-red-600 dark:text-red-400",
              trend === "neutral" && "text-gray-500 dark:text-gray-400"
            )}>
              {trend === "up" && <TrendingUp className="h-4 w-4 mr-1" />}
              {trend === "down" && <TrendingDown className="h-4 w-4 mr-1" />}
              {change}
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{title}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AgencyMetrics() {
  return (
    <div className="space-y-8">
      {/* Métricas de Projetos */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Métricas de Projetos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Total de Projetos"
            value={mockProjectMetrics.totalProjects}
            change="+12"
            trend="up"
            icon={Target}
            description="Este ano"
            color="blue"
          />
          <MetricCard
            title="Taxa de Entrega no Prazo"
            value={`${mockProjectMetrics.onTimeDelivery}%`}
            change="+3%"
            trend="up"
            icon={CheckCircle}
            description="Últimos 3 meses"
            color="green"
          />
          <MetricCard
            title="Tempo Médio de Conclusão"
            value={`${mockProjectMetrics.averageCompletionTime} dias`}
            change="-2.1 dias"
            trend="up"
            icon={Clock}
            description="Melhoria contínua"
            color="purple"
          />
        </div>
      </section>

      {/* Métricas de Equipe */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance da Equipe</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Membros da Equipe"
            value={mockTeamMetrics.totalMembers}
            change="+2"
            trend="up"
            icon={Users}
            description="Novos este trimestre"
            color="blue"
          />
          <MetricCard
            title="Taxa de Utilização"
            value={`${mockTeamMetrics.utilization}%`}
            change="+5%"
            trend="up"
            icon={TrendingUp}
            description="Média da equipe"
            color="green"
          />
          <MetricCard
            title="Satisfação da Equipe"
            value={`${mockTeamMetrics.satisfaction}/5`}
            change="+0.3"
            trend="up"
            icon={Target}
            description="Pesquisa mensal"
            color="yellow"
          />
        </div>
      </section>

      {/* Métricas de Clientes */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Relacionamento com Clientes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Clientes Ativos"
            value={mockClientMetrics.totalClients}
            change="+4"
            trend="up"
            icon={Users}
            description="Este mês"
            color="blue"
          />
          <MetricCard
            title="Taxa de Retenção"
            value={`${mockClientMetrics.retentionRate}%`}
            change="+2%"
            trend="up"
            icon={CheckCircle}
            description="Últimos 12 meses"
            color="green"
          />
          <MetricCard
            title="Satisfação do Cliente"
            value={`${mockClientMetrics.satisfaction}/5`}
            change="+0.1"
            trend="up"
            icon={Target}
            description="Média geral"
            color="yellow"
          />
        </div>
      </section>

      {/* Alertas e Ações */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Atenção Necessária</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Projetos com Atraso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Website TechCorp</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    3 dias
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">App Mobile StartupX</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    7 dias
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800 dark:text-blue-400">
                <Calendar className="h-5 w-5 mr-2" />
                Próximas Entregas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Brand Identity RetailPro</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    2 dias
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">E-commerce Platform</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    5 dias
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
