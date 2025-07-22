'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, Settings } from 'lucide-react'
import { UserRole, USER_ROLE_LABELS } from '@/lib/permissions'

// Mock data para demonstração
const mockUsers = {
  admin: [{ id: '1', name: 'Admin FVStudios', email: 'admin@fvstudios.com' }],
  agency_owner: [{ id: '2', name: 'João Silva', email: 'joao@agencia.com' }],
  agency_staff: [{ id: '3', name: 'Maria Santos', email: 'maria@agencia.com' }],
  agency_client: [{ id: '4', name: 'Cliente A', email: 'cliente@empresa.com' }],
  independent_producer: [{ id: '5', name: 'Pedro Freelancer', email: 'pedro@freelancer.com' }],
  independent_client: [{ id: '6', name: 'Cliente B', email: 'cliente@independente.com' }],
  influencer: [{ id: '7', name: 'Ana Influencer', email: 'ana@influencer.com' }],
  free_user: [{ id: '8', name: 'Usuário Gratuito', email: 'user@free.com' }]
}

// Este componente é apenas para desenvolvimento/demonstração
export function UserRoleSimulator() {
  const [selectedRole, setSelectedRole] = useState<string>('admin')

  const handleRoleChange = (role: string) => {
    setSelectedRole(role)
    
    // Em uma aplicação real, isso seria feito através da autenticação
    // Aqui simulamos mudando o localStorage para demonstração
    localStorage.setItem('mockUserRole', role)
    window.location.reload()
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Simulador de Usuário
        </CardTitle>
        <CardDescription>
          Para demonstração do sistema de permissões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Selecionar tipo de usuário:
          </label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um tipo de usuário" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role selecionado:</label>
          <Badge variant="outline" className="capitalize">
            {USER_ROLE_LABELS[selectedRole as UserRole] || selectedRole}
          </Badge>
        </div>

        <Button onClick={() => handleRoleChange(selectedRole)} className="w-full">
          Simular como {USER_ROLE_LABELS[selectedRole as UserRole] || selectedRole}
        </Button>

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Nota:</strong> Este simulador é apenas para demonstração. 
          Em produção, os roles são definidos pela autenticação real.
        </div>
      </CardContent>
    </Card>
  )
}