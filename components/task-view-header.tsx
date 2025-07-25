"use client"
import { LayoutGrid, List, Calendar, Filter, ArrowDownUp, Layers, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TaskViewHeaderProps {
  activeView: string
  onViewChange: (view: string) => void
}

export default function TaskViewHeader({ activeView, onViewChange }: TaskViewHeaderProps) {
  return (
    <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-b border-gray-200 dark:border-[#272727] py-3 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap  justify-between gap-3">
        <div className="flex flex-wrap gap-1 items-center bg-gray-100 dark:bg-[#1f1f1f] rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-sm font-medium",
              activeView === "board"
                ? "bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-[#272727]/50",
            )}
            onClick={() => onViewChange("board")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Quadro
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-sm font-medium",
              activeView === "list"
                ? "bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-[#272727]/50",
            )}
            onClick={() => onViewChange("list")}
          >
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-sm font-medium",
              activeView === "calendar"
                ? "bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/50 dark:hover:bg-[#272727]/50",
            )}
            onClick={() => onViewChange("calendar")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendário
          </Button>
        </div>    
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Filter Button */}
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>

          {/* Sort Button */}
          <Button variant="outline" size="sm" className="h-8">
            <ArrowDownUp className="h-4 w-4 mr-2" />
            Ordenar
          </Button>

          {/* Group By Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Layers className="h-4 w-4 mr-2" />
                Agrupar Por
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#272727]">
              <DropdownMenuLabel>Agrupar Tarefas Por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span>Status</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Prioridade</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Responsável</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Projeto</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Prazo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
