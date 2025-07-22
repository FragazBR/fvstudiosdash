"use client";
import { useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./Shared/Topbar";
import KanbanBoard from "./kanban-board";
import { Toaster } from "@/components/ui/toaster";

type KanbanPageProps = {
  personalMode?: boolean;
};

export default function KanbanPage({ personalMode }: KanbanPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      {personalMode && (
        <div className="text-sm text-gray-500 mb-4">Modo pessoal: recursos limitados.</div>
      )}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar
          name="Kanban"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <KanbanBoard
            filterProject={filterProject}
            filterAssignee={filterAssignee}
            filterPriority={filterPriority}
          />
        </main>
      </div>
      <Toaster />
      {/* Customização futura: */}
      {/* - Abas customizáveis, cores, temas, widgets, etc. */}
    </div>
  );
}
