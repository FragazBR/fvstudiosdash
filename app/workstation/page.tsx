import { PermissionGuard } from '@/components/permission-guard'
import { IntelligentWorkstation } from '@/components/intelligent-workstation'

function WorkstationContent() {
  return <IntelligentWorkstation />
}

export default function WorkstationPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'agency_staff', 'independent_producer']} showUnauthorized>
      <WorkstationContent />
    </PermissionGuard>
  )
}