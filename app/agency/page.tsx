import { PermissionGuard } from '@/components/permission-guard'
import { AgencyManagementPage } from '@/components/agency-management-page'

function AgencyContent() {
  return <AgencyManagementPage />
}

export default function AgencyPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_staff']} showUnauthorized>
      <AgencyContent />
    </PermissionGuard>
  )
}
