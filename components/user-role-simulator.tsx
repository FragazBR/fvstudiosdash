'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, Settings } from 'lucide-react'
import { getMockUsersByRole, getRoleDisplayName } from '@/lib/permissions'

// Este componente é apenas para desenvolvimento/demonstração
export function UserRoleSimulator() {
  const [selectedRole, setSelectedRole] = useState<string>('owner')
  const mockUsers = getMockUsersByRole()

  const handleRoleChange = (role: string) => {
    setSelectedRole(role)
    
    // Em uma aplicação real, isso seria feito através da autenticação
    // Aqui simulamos mudando o localStorage para demonstração
    localStorage.setItem('demo_user_role', role)
    
    // Recarrega a página para aplicar as mudanças
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
              <SelectItem value="owner">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Proprietário
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  Administrador
                </div>
              </SelectItem>
              <SelectItem value="manager">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  Gerente
                </div>
              </SelectItem>
              <SelectItem value="employee">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  Funcionário
                </div>
              </SelectItem>
              <SelectItem value="client">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  Cliente
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Usuário Simulado:</h4>
          <div className="space-y-1 text-sm">
            <div><strong>Nome:</strong> {mockUsers[selectedRole as keyof typeof mockUsers]?.name}</div>
            <div><strong>Email:</strong> {mockUsers[selectedRole as keyof typeof mockUsers]?.email}</div>
            <div className="flex items-center gap-2">
              <strong>Função:</strong> 
              <Badge variant="secondary">
                {getRoleDisplayName(selectedRole)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Permissões:</h4>
          <div className="text-xs space-y-1">
            {selectedRole === 'owner' || selectedRole === 'admin' ? (
              <Badge variant="default" className="mr-1 mb-1">✅ Acesso ao Agency Management</Badge>
            ) : (
              <Badge variant="destructive" className="mr-1 mb-1">❌ Sem acesso ao Agency Management</Badge>
            )}
            
            {(selectedRole === 'owner' || selectedRole === 'admin' || selectedRole === 'manager') ? (
              <Badge variant="default" className="mr-1 mb-1">✅ Visualizar contratos</Badge>
            ) : (
              <Badge variant="secondary" className="mr-1 mb-1">⚠️ Acesso limitado</Badge>
            )}
          </div>
        </div>

        <Button 
          onClick={() => handleRoleChange(selectedRole)}
          className="w-full"
        >
          Aplicar Mudanças
        </Button>

        <p className="text-xs text-gray-500 text-center">
          * Esta ferramenta é apenas para demonstração do sistema de permissões
        </p>
      </CardContent>
    </Card>
  )
}
