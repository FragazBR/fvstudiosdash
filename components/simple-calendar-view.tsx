"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CalendarEvent } from "@/types/calendar";
import CalendarEventDetail from "./calendar-event-detail";
import CalendarEventForm from "./calendar-event-form";
import { useToast } from "@/components/ui/use-toast";

interface SimpleCalendarViewProps {
  view: "month" | "week" | "day";
  filterProject: string | null;
  filterAssignee: string | null;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  start_date?: string;
  project?: {
    id: string;
    name: string;
    client?: {
      id: string;
      name: string;
      company?: string;
    };
  };
  assigned_to?: {
    id: string;
    name: string;
    email: string;
  };
}

// Função para converter tarefa em evento de calendário
const taskToCalendarEvent = (task: Task): CalendarEvent => {
  const getStatusColor = (status: string, priority: string) => {
    if (status === 'completed') return '#10b981'
    if (status === 'cancelled') return '#ef4444'
    if (priority === 'urgent') return '#dc2626'
    if (priority === 'high') return '#ea580c'
    if (priority === 'medium') return '#d97706'
    return '#6b7280'
  }

  const startDate = task.start_date ? new Date(task.start_date) : (task.due_date ? new Date(task.due_date) : new Date())
  const endDate = task.due_date ? new Date(task.due_date) : startDate

  return {
    id: task.id,
    title: task.title,
    start: startDate,
    end: endDate,
    allDay: !task.start_date, // Se não tem hora de início, é um evento de dia inteiro
    project: task.project?.id || '',
    projectName: task.project?.name || 'Sem projeto',
    location: task.project?.client?.company || task.project?.client?.name || '',
    description: task.description || '',
    assignees: task.assigned_to ? [{
      id: task.assigned_to.id,
      name: task.assigned_to.name,
      avatar: ''
    }] : [],
    color: getStatusColor(task.status, task.priority),
  }
}

export default function SimpleCalendarView({
  view,
  filterProject,
  filterAssignee,
}: SimpleCalendarViewProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNewEventFormOpen, setIsNewEventFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Buscar tarefas da API e converter em eventos
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const data = await response.json();
          const tasks = data.tasks || [];
          
          // Converter tarefas em eventos de calendário
          const calendarEvents = tasks.map((task: Task) => taskToCalendarEvent(task));
          setEvents(calendarEvents);
        }
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...events];

    if (filterProject) {
      filtered = filtered.filter((event) => event.project === filterProject);
    }

    if (filterAssignee) {
      filtered = filtered.filter((event) =>
        event.assignees.some((assignee) => assignee.id === filterAssignee)
      );
    }

    setFilteredEvents(filtered);
  }, [events, filterProject, filterAssignee]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Get days in month
  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check if the day falls within the event's date range
      return (
        (isSameDay(day, eventStart) || day > eventStart) &&
        (isSameDay(day, eventEnd) || day < eventEnd)
      );
    });
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    // Desabilitado para dados reais da API
    toast({
      title: "Funcionalidade indisponível",
      description: "Para criar tarefas, use a página de projetos ou tarefas.",
    });
  };

  // Handle event creation
  const handleEventCreated = (newEvent: CalendarEvent) => {
    // Desabilitado para dados reais da API
    toast({
      title: "Funcionalidade indisponível",
      description: "Para criar tarefas, use a página de projetos ou tarefas.",
    });
  };

  // Handle event update
  const handleEventUpdated = (updatedEvent: CalendarEvent) => {
    // Desabilitado para dados reais da API
    toast({
      title: "Funcionalidade indisponível",
      description: "Para editar tarefas, use a página de projetos ou tarefas.",
    });
  };

  // Handle event deletion
  const handleEventDeleted = (eventId: string) => {
    // Desabilitado para dados reais da API
    toast({
      title: "Funcionalidade indisponível",
      description: "Para excluir tarefas, use a página de projetos ou tarefas.",
    });
  };

  // Render month view
  const renderMonthView = () => {
    const days = getDaysInMonth();
    const firstDayOfMonth = startOfMonth(currentDate).getDay();

    return (
      <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 rounded-lg p-4 transition-all duration-200">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div
              key={day}
              className="text-center font-medium text-gray-500 dark:text-gray-400 text-sm py-2"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="sm:h-16 lg:h-24 p-1 border border-gray-200 dark:border-[#272727] rounded-md bg-gray-50 dark:bg-[#0f0f0f]/60 hover:bg-gray-100 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200"
            ></div>
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toString()}
                className={`sm:h-16 lg:h-24 p-1 border rounded-md overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200 ${
                  isCurrentMonth
                    ? "border-gray-200 dark:border-[#272727] bg-white/90 dark:bg-[#171717]/60"
                    : "border-gray-200 dark:border-[#272727] bg-gray-50 dark:bg-[#0f0f0f]/60"
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div className="text-right mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isCurrentMonth ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-16">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                      style={{
                        backgroundColor: `${event.color}20`,
                        color: event.color,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view (simplified)
  const renderWeekView = () => {
    return (
      <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 rounded-lg p-4 transition-all duration-200">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Visualização semanal em breve.</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Por favor, use a visualização mensal por enquanto.
          </p>
        </div>
      </div>
    );
  };

  // Render day view (simplified)
  const renderDayView = () => {
    return (
      <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 rounded-lg p-4 transition-all duration-200">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Visualização diária em breve.</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Por favor, use a visualização mensal por enquanto.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} disabled={loading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={loading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsNewEventFormOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            + Novo Evento
          </Button>
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {loading ? 'Carregando...' : `${filteredEvents.length} tarefas`}
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] rounded-lg p-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : (
        <>
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </>
      )}

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <CalendarEventDetail
          event={selectedEvent}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onEdit={() => {
            setIsDetailOpen(false);
            setIsEditFormOpen(true);
          }}
          onDelete={() => {
            handleEventDeleted(selectedEvent.id);
            setIsDetailOpen(false);
          }}
        />
      )}

      {/* Edit Event Form */}
      {selectedEvent && (
        <CalendarEventForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* New Event Form */}
      {selectedDate && (
        <CalendarEventForm
          isOpen={isNewEventFormOpen}
          onClose={() => setIsNewEventFormOpen(false)}
          selectedDate={selectedDate}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
}
