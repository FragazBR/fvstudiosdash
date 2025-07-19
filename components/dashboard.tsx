"use client";
import { useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./Shared/Topbar";
import { StatCard } from "./stat-card";
import { FileText, Clock, CheckCircle, AlertCircle, Star, Calendar, MoreHorizontal, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DonutChart } from "./donut-chart";
import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/hooks/useUser";

type projectT = {
  id: number;
  name: string;
  description: string;
  status: string;
  deadline: string;
  progress: number;
  tasks: number;
  activity: number;
  starred: boolean;
  team: {
    name: string;
    avatar: string;
  }[];
};

type taskGroupsT = {
  id: number;
  title: string;
  completed: boolean;
  due: string;
  status: string;
  priority: string;
  assignees: {
    name: string;
    avatar: string;
  }[];
};

const taskGroups = [
  {
    project: "Figma Design System",
    tasks: [
      {
        id: 1,
        title: "Create component documentation",
        completed: false,
        due: "Today, 2:00 PM",
        status: "today",
        priority: "high",
        assignees: [
          { name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
          { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
        ],
      },
      {
        id: 2,
        title: "Design system color palette update",
        completed: true,
        due: "Today, 10:00 AM",
        status: "today",
        priority: "medium",
        assignees: [
          { name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
        ],
      },
      {
        id: 3,
        title: "Review button component variations",
        completed: false,
        due: "Tomorrow, 11:00 AM",
        status: "tomorrow",
        priority: "medium",
        assignees: [
          { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
        ],
      },
    ],
  },
  {
    project: "Keep React",
    tasks: [
      {
        id: 4,
        title: "Fix navigation component responsive issues",
        completed: false,
        due: "Today, 4:00 PM",
        status: "today",
        priority: "high",
        assignees: [
          { name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
        ],
      },
      {
        id: 5,
        title: "Implement dark mode for all components",
        completed: false,
        due: "Oct 30, 2023",
        status: "upcoming",
        priority: "low",
        assignees: [
          { name: "David Kim", avatar: "/avatars/david-kim.png" },
          { name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
        ],
      },
      {
        id: 6,
        title: "Create documentation for new components",
        completed: false,
        due: "Tomorrow, 3:00 PM",
        status: "tomorrow",
        priority: "medium",
        assignees: [{ name: "Ryan Park", avatar: "/avatars/ryan-park.png" }],
      },
    ],
  },
];

const teamMembers = [
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    role: "UI/UX Designer",
    avatar: "/avatars/alex-morgan.png",
    tasks: {
      total: 18,
      running: 7,
      completed: 11,
    },
    performance: 12,
  },
  {
    id: 2,
    name: "Jessica Chen",
    email: "jessica.chen@example.com",
    role: "Frontend Developer",
    avatar: "/avatars/jessica-chen.png",
    tasks: {
      total: 24,
      running: 9,
      completed: 15,
    },
    performance: 8,
  },
  {
    id: 3,
    name: "Ryan Park",
    email: "ryan.park@example.com",
    role: "Product Manager",
    avatar: "/avatars/ryan-park.png",
    tasks: {
      total: 14,
      running: 3,
      completed: 11,
    },
    performance: 15,
  },
  {
    id: 4,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "Backend Developer",
    avatar: "/avatars/sarah-johnson.png",
    tasks: {
      total: 20,
      running: 8,
      completed: 12,
    },
    performance: -3,
  },
  {
    id: 5,
    name: "David Kim",
    email: "david.kim@example.com",
    role: "QA Engineer",
    avatar: "/avatars/david-kim.png",
    tasks: {
      total: 16,
      running: 5,
      completed: 11,
    },
    performance: 6,
  },
];

type DashboardProps = {
  userMode?: boolean;
};

export default function Dashboard({ userMode }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  
  // Verifica se o usuário é admin
  const isAdmin = user?.role === 'admin';

  return (
    <div className="bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar
          name="Home"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          {/* Admin Badge */}
          {isAdmin && (
            <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-2 rounded-md mb-4 flex items-center">
              <span className="font-semibold">🔑 Modo Administrador</span>
              <span className="ml-2 text-sm">Você tem acesso completo a todos os recursos</span>
            </div>
          )}

          {/* Admin Dashboard Quick Access */}
          {isAdmin && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acesso Rápido de Administrador</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/admin" className="block">
                  <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <BarChart2 className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">Admin</h3>
                        <p className="text-sm text-gray-600">Painel administrativo</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard" className="block">
                  <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <BarChart2 className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">Agency</h3>
                        <p className="text-sm text-gray-600">Dashboard agência</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/client" className="block">
                  <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">Client Agency</h3>
                        <p className="text-sm text-gray-600">Área do cliente</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link href="/user/dashboard" className="block">
                  <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">User</h3>
                        <p className="text-sm text-gray-600">Dashboard usuário</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/personal/dashboard" className="block">
                  <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Star className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">Personal (Free)</h3>
                        <p className="text-sm text-gray-600">Dashboard pessoal</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </section>
          )}
          
          {userMode && (
            <div className="text-sm text-gray-500 mb-4">Modo usuário autônomo: recursos de compartilhamento desabilitados.</div>
          )}
          {/* Stats Overview */}
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 xl:gap-6">
              <StatCard title="Total Projects" value="12" change="+2" changeText="from last month" icon={FileText} trend="up" />
              <StatCard title="In Progress" value="7" change="+3" changeText="from last month" icon={Clock} trend="up" />
              <StatCard title="Completed" value="4" change="+1" changeText="from last month" icon={CheckCircle} trend="up" />
              <StatCard title="Overdue" value="1" change="-2" changeText="from last month" icon={AlertCircle} trend="down" />
            </div>
          </section>

          {/* Customização futura: */}
          {/* - Abas de serviços customizáveis por cliente */}
          {/* - Escolha de cores, temas, branding (shadcn/ui) */}
          {/* - Configurações de layout e widgets */}
        </main>
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: projectT }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2 justify-between items-start">
          <div className="flex items-start space-x-2">
            <div
              className={cn(
                "w-1 h-12 rounded-full",
                project.status === "In Progress" && "bg-yellow-500",
                project.status === "Completed" && "bg-green-500",
                project.status === "Planning" && "bg-blue-500"
              )}
            />
            <div>
              <CardTitle className="text-lg flex items-center">
                {project.name}
                {project.starred && (
                  <Star className="h-4 w-4 ml-2 text-yellow-500 fill-yellow-500" />
                )}
              </CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
          </div>
          <Badge
            className={cn(
              "font-medium text-nowrap",
              project.status === "In Progress" &&
                "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
              project.status === "Completed" &&
                "bg-green-100 text-green-800 hover:bg-green-100",
              project.status === "Planning" &&
                "bg-blue-100 text-blue-800 hover:bg-blue-100"
            )}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Deadline: {project.deadline}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex -space-x-2">
            {project.team.map((member, index) => (
              <Avatar key={index} className="h-8 w-8 border-2 border-white">
                <AvatarImage
                  src={member.avatar || "/placeholder.svg"}
                  alt={member.name}
                />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center">
              <FileText className="h-3.5 w-3.5 mr-1" />
              <span>{project.tasks} tasks</span>
            </div>
            <div className="flex items-center">
              <BarChart2 className="h-3.5 w-3.5 mr-1" />
              <span>{project.activity} activities</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Task Item Component
function TaskItem({ task }: { task: taskGroupsT }) {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all">
      <div className="flex items-center">
        <Checkbox
          id={`task-${task.id}`}
          className="mr-3"
          defaultChecked={task.completed}
        />
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={`task-${task.id}`}
            className={cn(
              "font-medium text-gray-900",
              task.completed && "line-through text-gray-500"
            )}
          >
            {task.title}
          </label>
          <div className="flex flex-wrap gap-2 items-center mt-1">
            {task.due && (
              <div className="flex items-center text-xs mr-3">
                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                <span
                  className={cn(
                    task.status === "overdue" && "text-red-600",
                    task.status === "today" && "text-blue-600",
                    task.status === "tomorrow" && "text-yellow-600",
                    task.status === "upcoming" && "text-gray-500"
                  )}
                >
                  {task.due}
                </span>
              </div>
            )}
            {task.priority && (
              <Badge
                className={cn(
                  "text-xs",
                  task.priority === "high" &&
                    "bg-red-100 text-red-800 hover:bg-red-100",
                  task.priority === "medium" &&
                    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                  task.priority === "low" &&
                    "bg-green-100 text-green-800 hover:bg-green-100"
                )}
              >
                {task.priority}
              </Badge>
            )}
            {task.completed && (
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {task.assignees.map((assignee, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-white">
                <AvatarImage
                  src={assignee.avatar || "/placeholder.svg"}
                  alt={assignee.name}
                />
                <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Helper Functions
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

// Sample Data
const projects = [
  {
    id: 1,
    name: "Figma Design System",
    description: "UI component library for design system",
    status: "In Progress",
    deadline: "Nov 15, 2023",
    progress: 65,
    tasks: 24,
    activity: 128,
    starred: true,
    team: [
      { name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
      { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
      { name: "Ryan Park", avatar: "/avatars/ryan-park.png" },
    ],
  },
  {
    id: 2,
    name: "Keep React",
    description: "React component library development",
    status: "Planning",
    deadline: "Dec 5, 2023",
    progress: 25,
    tasks: 18,
    activity: 86,
    starred: false,
    team: [
      { name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
      { name: "David Kim", avatar: "/avatars/david-kim.png" },
      { name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
    ],
  },
  {
    id: 3,
    name: "StaticMania",
    description: "Marketing website redesign project",
    status: "Completed",
    deadline: "Oct 25, 2023",
    progress: 100,
    tasks: 32,
    activity: 214,
    starred: true,
    team: [
      { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
      { name: "Ryan Park", avatar: "/avatars/ryan-park.png" },
      { name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
    ],
  },
];
