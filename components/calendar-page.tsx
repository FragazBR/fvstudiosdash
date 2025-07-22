"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./Shared/Topbar";
import CalendarWrapper from "./calendar-wrapper";
import { Toaster } from "@/components/ui/toaster";

type CalendarPageProps = {
  personalMode?: boolean;
};

export default function CalendarPage({ personalMode }: CalendarPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar
          name="Calendário"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <CalendarWrapper
            view={view}
            filterProject={filterProject}
            filterAssignee={filterAssignee}
          />
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster />
      {personalMode && (
        <div className="text-sm text-gray-500 mb-4">Modo pessoal: recursos limitados.</div>
      )}
    </div>
   );
}
