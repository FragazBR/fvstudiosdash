import { Metadata } from 'next'
import ExecutiveDashboard from '@/components/executive-dashboard'

export const metadata: Metadata = {
  title: 'Analytics Executivo | FVStudios Dashboard',
  description: 'Dashboard executivo com métricas de performance, segurança e negócio',
}

export default function ExecutivePage() {
  return (
    <div className="container mx-auto py-6">
      <ExecutiveDashboard />
    </div>
  )
}