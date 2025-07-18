import Dashboard from '@/components/dashboard'

export default function UserDashboardPage() {
  // Dashboard para user autônomo: igual agência, mas sem compartilhamento
  return <Dashboard userMode />
}
