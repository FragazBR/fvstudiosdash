// app/dashboard/page.tsx
'use client'

import { PermissionGuard } from '@/components/permission-guard'
import { AgencyDashboard } from "@/components/agency-dashboard";

function DashboardContent() {
  return <AgencyDashboard />;
}

export default function DashboardPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_staff', 'independent_producer', 'influencer', 'free_user']} showUnauthorized>
      <DashboardContent />
    </PermissionGuard>
  );
}
