import { SystemMonitoringDashboard } from '@/components/system-monitoring-dashboard'

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Monitoramento do Sistema</h1>
        <p className="text-muted-foreground">
          Acompanhe a saúde, performance e logs do sistema em tempo real
        </p>
      </div>
      
      <SystemMonitoringDashboard />
    </div>
  )
}