import { PermissionGuard } from '@/components/permission-guard'

export default function IntelligentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'agency_staff', 'independent_producer']} showUnauthorized>
      {children}
    </PermissionGuard>
  )
}