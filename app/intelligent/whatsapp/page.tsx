'use client'

// ==================================================
// FVStudios Dashboard - WhatsApp Business Page
// Página completa para gerenciamento do WhatsApp Business
// ==================================================

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { WhatsAppDashboard } from '@/components/whatsapp-dashboard'
import { useUser } from '@/hooks/useUser'

export default function WhatsAppPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="WhatsApp Business"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <WhatsAppDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}