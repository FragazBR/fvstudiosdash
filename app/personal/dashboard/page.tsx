
import { PerformanceMetrics } from '@/components/PerformanceMetrics'
import KanbanPage from '@/components/kanban-page'
import CalendarPage from '@/components/calendar-page'

export default function PersonalDashboardPage() {
  // Versão limitada: acesso a planejamento, execuções, kanban, calendário, métricas básicas
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Pessoal (Free)</h1>
      <PerformanceMetrics />
      <KanbanPage personalMode />
      <CalendarPage personalMode />
    </div>
  )
}
