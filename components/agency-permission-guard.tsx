'use client'

import React from 'react'
import { useUser } from '@/hooks/useUser'
import { isAgencyOwnerOrAdmin, getRoleDisplayName } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PermissionGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AgencyPermissionGuard({ children, fallback }: PermissionGuardProps) {
  const { user, loading } = useUser()

  // Mostra loading enquanto carrega o usuário
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 dark:border-[#64f481]"></div>
      </div>
    )
  }

  // Verifica se o usuário pode acessar o módulo Agency
  const canAccess = isAgencyOwnerOrAdmin(user?.role)

  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400">
              Acesso Restrito
            </CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta área
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Área Exclusiva para Administradores
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    O módulo <strong>Agency Management</strong> contém informações financeiras 
                    e estratégicas sensíveis da agência. Apenas proprietários e administradores 
                    têm acesso a estes dados.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Informações do seu perfil:
              </h4>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Nome:</span>
                  <span className="font-medium">{user?.name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{user?.email || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Função:</span>
                  <span className="font-medium">{getRoleDisplayName(user?.role)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
                Se você acredita que deveria ter acesso a esta área, entre em contato com o 
                administrador da sua agência.
              </p>
              
              <Link href="/dashboard">
                <Button className="w-full" variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

// Hook para verificar permissões em qualquer lugar da aplicação
export function usePermissions() {
  const { user } = useUser()
  
  return {
    canAccessAgency: isAgencyOwnerOrAdmin(user?.role),
    userRole: user?.role,
    roleDisplayName: getRoleDisplayName(user?.role)
  }
}
