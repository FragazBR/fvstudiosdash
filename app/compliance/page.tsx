import { ComplianceDashboard } from '@/components/compliance-dashboard'

export default function CompliancePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Compliance & Auditoria</h1>
        <p className="text-muted-foreground">
          Gerencie regras de compliance e monitore a trilha de auditoria do sistema
        </p>
      </div>
      
      <ComplianceDashboard />
    </div>
  )
}