"use client";
import { useState } from "react";
import Sidebar from "./sidebar";
import KanbanHeader from "./kanban-header";
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
    <div className="bg-gray-50 dark:bg-gray-900">
      {personalMode && (
        <div className="text-sm text-gray-500 mb-4">Modo pessoal: recursos limitados.</div>
      )}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <KanbanHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          filterProject={filterProject}
          onFilterProjectChange={setFilterProject}
          filterAssignee={filterAssignee}
          onFilterAssigneeChange={setFilterAssignee}
          filterPriority={filterPriority}
          onFilterPriorityChange={setFilterPriority}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
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
