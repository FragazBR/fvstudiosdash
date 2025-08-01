export type TaskStatus = "backlog" | "todo" | "in-progress" | "in-review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  attachments: number;
  comments: number;
  progress?: number; // Percentual de progresso (0-100)
  subtasks: {
    completed: number;
    total: number;
    items?: {
      title: string;
      completed: boolean;
    }[];
  };
  assignees: {
    id: string;
    name: string;
    avatar: string;
  }[];
  description?: string;
}
