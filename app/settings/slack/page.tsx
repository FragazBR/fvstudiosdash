import { Metadata } from 'next'
import SlackDashboard from '@/components/slack-dashboard'

export const metadata: Metadata = {
  title: 'Integração Slack | FVStudios Dashboard',
  description: 'Configure notificações automáticas para seus canais Slack',
}

export default function SlackIntegrationPage() {
  return (
    <div className="container mx-auto py-6">
      <SlackDashboard />
    </div>
  )
}