import { PermissionGuard } from '@/components/permission-guard'
import { AgencyDashboard } from '@/components/agency-dashboard'

function AgencyContent() {
  return <AgencyDashboard />
}

export default function AgencyPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'independent_producer']} showUnauthorized>
      <AgencyContent />
    </PermissionGuard>
  )
}
