import { Metadata } from 'next'
import WebhookDashboard from '@/components/webhook-dashboard'

export const metadata: Metadata = {
  title: 'Sistema de Webhooks | FVStudios Dashboard',
  description: 'Configure e monitore webhooks para integração com sistemas externos',
}

export default function WebhooksPage() {
  return (
    <div className="container mx-auto py-6">
      <WebhookDashboard />
    </div>
  )
}