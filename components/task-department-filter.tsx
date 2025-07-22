'use client'

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AGENCY_DEPARTMENTS,
  getAllSpecializations,
  getDepartmentById,
  getSpecializationById,
  getSpecializationsByWorkflowStage,
  type TaskFilter
} from '@/types/departments'
import { WORKFLOW_STAGES } from '@/types/workflow'
import { useUser } from '@/hooks/useUser'
import { DepartmentPermission } from '@/types/departments'
import {
  Filter,
  X,
  Users,
  Target,
  Search
} from 'lucide-react'

interface TaskDepartmentFilterProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  availableAssignees?: Array<{
    id: string;
    name: string;
    department_id?: string;
    specialization_id?: string;
  }>;
}

export function TaskDepartmentFilter({ 
  currentFilter, 
  onFilterChange,
  availableAssignees = []
}: TaskDepartmentFilterProps) {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Verificar permissões do usuário
  const canViewAllDepartments = user?.department_permissions?.includes(DepartmentPermission.VIEW_ALL) || false;
  const canViewDepartmentTasks = user?.department_permissions?.includes(DepartmentPermission.VIEW_DEPARTMENT) || false;
  
  // Se o usuário só pode ver suas próprias tarefas, não mostrar filtros
  const showDepartmentFilters = canViewAllDepartments || canViewDepartmentTasks;
  
  // Departamentos que o usuário pode visualizar
  const availableDepartments = showDepartmentFilters 
    ? AGENCY_DEPARTMENTS 
    : user?.department_id 
    ? AGENCY_DEPARTMENTS.filter(dept => dept.id === user.department_id)
    : [];

  // Especializações disponíveis baseadas no departamento selecionado ou permissões do usuário
  const availableSpecializations = currentFilter.department
    ? getDepartmentById(currentFilter.department)?.specializations || []
    : showDepartmentFilters
    ? getAllSpecializations()
    : user?.specialization_id
    ? getAllSpecializations().filter(spec => spec.id === user.specialization_id)
    : [];

  // Pessoas que podem ser assignees baseado nas permissões
  const filteredAssignees = availableAssignees.filter(assignee => {
    if (!showDepartmentFilters && assignee.id !== user?.id) {
      return false; // Se só pode ver próprias tarefas, só mostrar a si mesmo
    }
    
    if (currentFilter.department && assignee.department_id !== currentFilter.department) {
      return false; // Filtrar por departamento se selecionado
    }
    
    if (currentFilter.specialization && assignee.specialization_id !== currentFilter.specialization) {
      return false; // Filtrar por especialização se selecionado
    }
    
    if (searchTerm && !assignee.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false; // Filtrar por termo de busca
    }
    
    return true;
  });

  const updateFilter = (key: keyof TaskFilter, value: string | undefined) => {
    const newFilter = { ...currentFilter };
    
    if (value === '' || value === undefined) {
      delete newFilter[key];
    } else {
      newFilter[key] = value;
    }
    
    // Limpar filtros dependentes quando mudamos um filtro superior
    if (key === 'department') {
      delete newFilter.specialization;
    }
    
    onFilterChange(newFilter);
  };

  const clearAllFilters = () => {
    onFilterChange({});
    setSearchTerm('');
  };

  const activeFiltersCount = Object.keys(currentFilter).length;

  if (!showDepartmentFilters && !availableAssignees.length) {
    return null; // Não mostrar nada se não há permissões e nem assignees
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de expandir/recolher */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros de Equipe
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          
          {/* Filtro por Departamento - apenas se tem permissão */}
          {showDepartmentFilters && (
            <div>
              <label className="text-sm font-medium mb-2 block">Departamento</label>
              <Select 
                value={currentFilter.department || ''} 
                onValueChange={(value) => updateFilter('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos departamentos</SelectItem>
                  {availableDepartments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${department.color}`} />
                        {department.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro por Especialização */}
          {showDepartmentFilters && availableSpecializations.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Especialização</label>
              <Select 
                value={currentFilter.specialization || ''} 
                onValueChange={(value) => updateFilter('specialization', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas especializações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas especializações</SelectItem>
                  {availableSpecializations.map((specialization) => (
                    <SelectItem key={specialization.id} value={specialization.id}>
                      {specialization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtro por Etapa do Workflow */}
          <div>
            <label className="text-sm font-medium mb-2 block">Etapa do Workflow</label>
            <Select 
              value={currentFilter.workflow_stage || ''} 
              onValueChange={(value) => updateFilter('workflow_stage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas etapas</SelectItem>
                {WORKFLOW_STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Pessoa/Assignee */}
          {filteredAssignees.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Responsável</label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar pessoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select 
                  value={currentFilter.assignee || ''} 
                  onValueChange={(value) => updateFilter('assignee', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas pessoas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas pessoas</SelectItem>
                    {filteredAssignees.slice(0, 10).map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{assignee.name}</span>
                          {assignee.specialization_id && (
                            <Badge variant="outline" className="text-xs">
                              {getSpecializationById(assignee.specialization_id)?.name}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges dos filtros ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentFilter.department && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getDepartmentById(currentFilter.department)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('department', undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {currentFilter.specialization && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getSpecializationById(currentFilter.specialization)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('specialization', undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {currentFilter.workflow_stage && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {WORKFLOW_STAGES.find(s => s.id === currentFilter.workflow_stage)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('workflow_stage', undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {currentFilter.assignee && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {availableAssignees.find(a => a.id === currentFilter.assignee)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => updateFilter('assignee', undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Hook para filtrar tarefas baseado nos filtros de departamento
export function useTaskDepartmentFilter(tasks: any[], filter: TaskFilter, userId?: string) {
  return tasks.filter(task => {
    // Filtro por departamento
    if (filter.department) {
      const assigneeDepartment = task.assigned_to?.department_id;
      if (assigneeDepartment !== filter.department) return false;
    }
    
    // Filtro por especialização
    if (filter.specialization) {
      const assigneeSpecialization = task.assigned_to?.specialization_id;
      if (assigneeSpecialization !== filter.specialization) return false;
    }
    
    // Filtro por etapa do workflow
    if (filter.workflow_stage) {
      if (task.workflow_stage !== filter.workflow_stage) return false;
    }
    
    // Filtro por assignee específico
    if (filter.assignee) {
      if (task.assigned_to?.id !== filter.assignee) return false;
    }
    
    return true;
  });
}