// app/dashboard/page.tsx
'use client'

import { PermissionGuard } from '@/components/permission-guard'
import Dashboard from "@/components/dashboard";

function DashboardContent() {
  return <Dashboard />;
}

export default function DashboardPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'agency_staff', 'independent_producer', 'influencer', 'free_user', 'agency_client']} showUnauthorized>
      <DashboardContent />
    </PermissionGuard>
  );
}
