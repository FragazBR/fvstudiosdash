import { PermissionGuard } from '@/components/permission-guard'
import { ContractsPage } from '@/components/contracts-page'

function ContractsContent() {
  return <ContractsPage />
}

export default function ContractsRoute() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'independent_producer']} showUnauthorized>
      <ContractsContent />
    </PermissionGuard>
  )
}