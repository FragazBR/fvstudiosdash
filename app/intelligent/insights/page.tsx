'use client'

// ==================================================
// FVStudios Dashboard - Insights Inteligentes
// Sistema de análise profunda com IA
// ==================================================

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { IntelligentAnalytics } from '@/components/intelligent-analytics'

export default function IntelligentInsightsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Insights Inteligentes"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <IntelligentAnalytics />
          </div>
        </main>
      </div>
    </div>
  )
}