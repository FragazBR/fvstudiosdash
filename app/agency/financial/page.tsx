'use client'

import { PermissionGuard } from '@/components/permission-guard'
import { FinancialControlPage } from '@/components/financial-control-page'

function FinancialControlContent() {
  return <FinancialControlPage />
}

export default function FinancialControlRoute() {
  return (
    <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_manager', 'independent_producer']} showUnauthorized>
      <FinancialControlContent />
    </PermissionGuard>
  )
}