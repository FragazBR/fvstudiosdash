"use client";

import { Menu, Plus, Search, Filter, LayoutGrid, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Topbar from "./Shared/Topbar";
import { Dispatch, SetStateAction } from "react";

interface ProjectsHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  filterStatus: string | null;
  onFilterStatusChange: (status: string | null) => void;
}

export default function ProjectsHeader({
  sidebarOpen,
  setSidebarOpen,
  viewMode,
  onViewModeChange,
  filterStatus,
  onFilterStatusChange,
}: ProjectsHeaderProps) {
  return (
    <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-b border-gray-200 dark:border-[#272727] sticky top-0 z-10">
      <Topbar
        name="Project"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Filters Bar */}
      <div className="border-t border-gray-200 dark:border-[#272727] px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-8 h-9 w-full sm:w-64 bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-slate-500 dark:focus:ring-[#64f481]"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus ? filterStatus : "All Projects"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onFilterStatusChange(null)}>
                  <span className={cn(filterStatus === null && "font-medium")}>
                    All Projects
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFilterStatusChange("Planning")}
                >
                  <span
                    className={cn(filterStatus === "Planning" && "font-medium")}
                  >
                    Planning
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFilterStatusChange("In Progress")}
                >
                  <span
                    className={cn(
                      filterStatus === "In Progress" && "font-medium"
                    )}
                  >
                    In Progress
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFilterStatusChange("Completed")}
                >
                  <span
                    className={cn(
                      filterStatus === "Completed" && "font-medium"
                    )}
                  >
                    Completed
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onFilterStatusChange("On Hold")}
                >
                  <span
                    className={cn(filterStatus === "On Hold" && "font-medium")}
                  >
                    On Hold
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-white/90 dark:bg-[#171717]/60 border border-gray-200 dark:border-[#272727] rounded-lg p-1 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-sm font-medium",
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-600/50"
                )}
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-sm font-medium",
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-gray-600/50"
                )}
                onClick={() => onViewModeChange("list")}
              >
                <ListIcon className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
