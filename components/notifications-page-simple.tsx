"use client";

import React, { useState } from "react";
import Sidebar from './sidebar';
import { Toaster } from '@/components/ui/toaster';

export function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p>Página de notificações em construção...</p>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}
