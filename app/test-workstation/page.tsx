import WorkstationFix from '@/components/workstation-fix'

export default function TestWorkstationPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🔧 Teste da Workstation</h1>
        <p className="text-muted-foreground">
          Componente de teste para identificar problemas na workstation
        </p>
      </div>
      
      <WorkstationFix />
    </div>
  )
}