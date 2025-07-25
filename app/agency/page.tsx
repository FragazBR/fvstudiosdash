import { PermissionGuard } from '@/components/permission-guard'
import { AgencyDashboard } from '@/components/agency-dashboard'

function AgencyContent() {
  return <AgencyDashboard />
}

export default function AgencyPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'independent_producer']} showUnauthorized>
      <AgencyContent />
    </PermissionGuard>
  )
}
