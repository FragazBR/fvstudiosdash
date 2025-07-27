import { Metadata } from 'next'
import GlobalSettingsDashboard from '@/components/global-settings-dashboard'

export const metadata: Metadata = {
  title: 'Configurações Globais | FVStudios Dashboard',
  description: 'Sistema de configuração global com gerenciamento centralizado de configurações do sistema e agências',
}

export default function GlobalSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <GlobalSettingsDashboard />
    </div>
  )
}