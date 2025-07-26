"use client";

import { useDrop } from "react-dnd";
import TaskCard from "./task-card";
import type { Task } from "@/types/task";

type FivePhaseStatus = "todo" | "in-progress" | "approval" | "finalization" | "done";

interface ClientTaskColumnProps {
  title: string;
  status: FivePhaseStatus;
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: FivePhaseStatus) => void;
  progressPercentage: number;
}

export default function ClientTaskColumn({
  title,
  status,
  tasks,
  onTaskMove,
  progressPercentage,
}: ClientTaskColumnProps) {
  // Set up drop target
  const [{ isOver }, drop] = useDrop({
    accept: "task",
    drop: (item: { id: string }) => {
      onTaskMove(item.id, status);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Column colors based on status
  const getColumnColor = (status: FivePhaseStatus) => {
    switch (status) {
      case 'todo': return 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
      case 'in-progress': return 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
      case 'approval': return 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
      case 'finalization': return 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20'
      case 'done': return 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
    }
  };

  const getHeaderColor = (status: FivePhaseStatus) => {
    switch (status) {
      case 'todo': return 'text-gray-700 dark:text-gray-300'
      case 'in-progress': return 'text-blue-700 dark:text-blue-300'
      case 'approval': return 'text-yellow-700 dark:text-yellow-300'
      case 'finalization': return 'text-orange-700 dark:text-orange-300'
      case 'done': return 'text-green-700 dark:text-green-300'
    }
  };

  return (
    <div
      ref={drop}
      className={`
        rounded-lg border-2 p-4 min-h-[400px] transition-all duration-200
        ${getColumnColor(status)}
        ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold text-sm ${getHeaderColor(status)}`}>
            {title}
          </h3>
          <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>{progressPercentage}%</span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div 
              className="h-1 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Drop zone indicator when dragging */}
      {isOver && (
        <div className="mt-4 p-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-center text-blue-600 dark:text-blue-400 text-sm">
            Solte aqui para mover para "{title}"
          </p>
        </div>
      )}
    </div>
  );
}