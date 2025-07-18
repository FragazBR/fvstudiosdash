"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { StatCard } from "./stat-card";
import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import { DonutChart } from "./donut-chart";
import { TrendingUp, MousePointerClick, TrendingDown, DollarSign, Percent } from "lucide-react";

type DashboardClientProps = { clientId: string };

export default function DashboardClient({ clientId }: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ cpc: 1.2, ctr: 5.1, cpm: 32.9, conv: 312, roi: 241 });
  const [chartData, setChartData] = useState({ area: [], bar: [], donut: [] });

  useEffect(() => {
    // TODO: buscar dados do Supabase via API route ou client
  }, [clientId]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:ml-64 pt-16 p-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
          <StatCard
            title="CPC"
            value={`R$ ${stats.cpc.toFixed(2)}`}
            change="↓ 3.2%"
            changeText="em relação ao mês anterior"
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            title="CTR"
            value={`${stats.ctr.toFixed(1)}%`}
            change="↑ 1.1%"
            changeText="taxa de cliques melhorou"
            icon={MousePointerClick}
            trend="up"
          />
          <StatCard
            title="CPM"
            value={`R$ ${stats.cpm.toFixed(2)}`}
            change="↓ 0.8%"
            changeText="custo por mil visualizações"
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            title="Conversões"
            value={`${stats.conv}`}
            change="↑ 12.4%"
            changeText="número de conversões"
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            title="ROI"
            value={`${stats.roi}%`}
            change="↑ 4.5%"
            changeText="retorno sobre investimento"
            icon={Percent}
            trend="up"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Performance ao Longo do Tempo</h2>
            <div className="h-64">
              <AreaChart data={chartData.area} />
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Distribuição por Campanha</h2>
            <div className="h-64">
              <DonutChart data={chartData.donut} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Detalhes</h2>
          <div className="h-48">
            <BarChart data={chartData.bar} />
          </div>
        </div>
      </div>
    </div>
  );
}
