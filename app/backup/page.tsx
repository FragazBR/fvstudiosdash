import { BackupRecoveryDashboard } from '@/components/backup-recovery-dashboard'

export default function BackupPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Backup & Recovery</h1>
        <p className="text-muted-foreground">
          Gerencie backups e recuperação de dados críticos da sua agência
        </p>
      </div>
      
      <BackupRecoveryDashboard />
    </div>
  )
}