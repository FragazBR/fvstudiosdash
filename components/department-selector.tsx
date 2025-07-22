'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AGENCY_DEPARTMENTS,
  getDepartmentById,
  getSpecializationById,
  type Department,
  type Specialization
} from '@/types/departments'
import {
  Users,
  Target,
  Palette,
  TrendingUp,
  Code,
  Settings,
  CheckCircle
} from 'lucide-react'

interface DepartmentSelectorProps {
  selectedDepartmentId?: string;
  selectedSpecializationId?: string;
  onDepartmentChange: (departmentId: string) => void;
  onSpecializationChange: (specializationId: string) => void;
  mode?: 'full' | 'compact';
  disabled?: boolean;
}

const getIcon = (iconName: string) => {
  const icons = {
    Users,
    Target, 
    Palette,
    TrendingUp,
    Code,
    Settings
  };
  const Icon = icons[iconName as keyof typeof icons] || Users;
  return <Icon className="h-5 w-5" />;
};

export function DepartmentSelector({ 
  selectedDepartmentId,
  selectedSpecializationId, 
  onDepartmentChange,
  onSpecializationChange,
  mode = 'full',
  disabled = false
}: DepartmentSelectorProps) {
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(() =>
    selectedDepartmentId ? getDepartmentById(selectedDepartmentId) || null : null
  );

  const handleDepartmentSelect = (departmentId: string) => {
    const department = getDepartmentById(departmentId);
    if (department) {
      setCurrentDepartment(department);
      onDepartmentChange(departmentId);
      // Reset specialization quando muda departamento
      if (selectedSpecializationId) {
        onSpecializationChange('');
      }
    }
  };

  const handleSpecializationSelect = (specializationId: string) => {
    onSpecializationChange(specializationId);
  };

  if (mode === 'compact') {
    return (
      <div className="space-y-4">
        <Select 
          value={selectedDepartmentId || ''} 
          onValueChange={handleDepartmentSelect}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um departamento" />
          </SelectTrigger>
          <SelectContent>
            {AGENCY_DEPARTMENTS.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                <div className="flex items-center gap-2">
                  {getIcon(department.icon)}
                  {department.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentDepartment && (
          <Select 
            value={selectedSpecializationId || ''} 
            onValueChange={handleSpecializationSelect}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma especialização" />
            </SelectTrigger>
            <SelectContent>
              {currentDepartment.specializations.map((specialization) => (
                <SelectItem key={specialization.id} value={specialization.id}>
                  {specialization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Departamento */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Escolha o Departamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENCY_DEPARTMENTS.map((department) => (
            <Card 
              key={department.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedDepartmentId === department.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && handleDepartmentSelect(department.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${department.color} text-white`}>
                    {getIcon(department.icon)}
                  </div>
                  {selectedDepartmentId === department.id && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <CardTitle className="text-base">{department.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {department.description}
                </p>
                <div className="text-xs text-gray-500">
                  {department.specializations.length} especializações
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Seleção de Especialização */}
      {currentDepartment && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Especialização em {currentDepartment.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentDepartment.specializations.map((specialization) => (
              <Card 
                key={specialization.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedSpecializationId === specialization.id 
                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && handleSpecializationSelect(specialization.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{specialization.name}</CardTitle>
                    {selectedSpecializationId === specialization.id && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {specialization.description}
                  </p>
                  
                  {/* Skills */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Habilidades:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {specialization.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {specialization.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{specialization.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Workflow Stages */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Etapas do Workflow:
                    </p>
                    <p className="text-xs text-gray-500">
                      {specialization.workflow_stages.length} etapas relacionadas
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedDepartmentId && selectedSpecializationId && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Seleção Confirmada</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{currentDepartment?.name}</strong> - {getSpecializationById(selectedSpecializationId)?.name}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para mostrar informações do departamento de um usuário
export function DepartmentInfo({ 
  departmentId, 
  specializationId 
}: { 
  departmentId?: string; 
  specializationId?: string; 
}) {
  const department = departmentId ? getDepartmentById(departmentId) : null;
  const specialization = specializationId ? getSpecializationById(specializationId) : null;

  if (!department && !specialization) {
    return (
      <div className="text-sm text-gray-500">
        Sem departamento definido
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {department && (
        <div className={`p-1 rounded ${department.color} text-white`}>
          {getIcon(department.icon)}
        </div>
      )}
      <div className="text-sm">
        <div className="font-medium">{specialization?.name || department?.name}</div>
        {specialization && department && (
          <div className="text-xs text-gray-500">{department.name}</div>
        )}
      </div>
    </div>
  );
}