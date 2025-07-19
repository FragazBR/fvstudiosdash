import { AgencyManagementPage } from '@/components/agency-management-page'
import { AgencyPermissionGuard } from '@/components/agency-permission-guard'

export default function AgencyPage() {
  return (
    <AgencyPermissionGuard>
      <AgencyManagementPage />
    </AgencyPermissionGuard>
  )
}
