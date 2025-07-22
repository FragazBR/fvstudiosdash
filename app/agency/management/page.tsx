import { PermissionGuard } from '@/components/permission-guard'
import { AgencyManagementPage } from '@/components/agency-management-page'

function AgencyManagementContent() {
  return <AgencyManagementPage />
}

export default function AgencyManagementRoute() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'independent_producer']} showUnauthorized>
      <AgencyManagementContent />
    </PermissionGuard>
  )
}