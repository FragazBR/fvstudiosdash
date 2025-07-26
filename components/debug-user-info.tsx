'use client'

import { useUser } from '@/hooks/useUser'
import { getUserPermissions } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DebugUserInfo() {
  const { user, loading, supabaseUser } = useUser()
  
  if (loading) {
    return <div>Carregando informações do usuário...</div>
  }

  const permissions = user?.role ? getUserPermissions(user.role as any) : null

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>🐛 Debug - Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Dados do Perfil (user_profiles):</h4>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="font-semibold">Dados do Supabase Auth:</h4>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify({
                id: supabaseUser?.id,
                email: supabaseUser?.email,
                created_at: supabaseUser?.created_at
              }, null, 2)}
            </pre>
          </div>

          {permissions && (
            <div>
              <h4 className="font-semibold">Permissões Calculadas:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Dashboard:</strong>
                  <ul className="list-disc list-inside">
                    <li>Admin: {permissions.canAccessAdminDashboard ? '✅' : '❌'}</li>
                    <li>Agency: {permissions.canAccessAgencyDashboard ? '✅' : '❌'}</li>
                    <li>Manager: {permissions.canAccessAgencyManagerDashboard ? '✅' : '❌'}</li>
                  </ul>
                </div>
                <div>
                  <strong>Features:</strong>
                  <ul className="list-disc list-inside">
                    <li>AI Agents: {permissions.canAccessAIAgents ? '✅' : '❌'}</li>
                    <li>Chat Clientes: {permissions.canChatWithClients ? '✅' : '❌'}</li>
                    <li>Chat Team: {permissions.canChatWithTeam ? '✅' : '❌'}</li>
                    <li>Relatórios: {permissions.canGenerateBasicReports ? '✅' : '❌'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold">Verificações de Acesso:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Sidebar Links:</strong>
                <ul className="list-disc list-inside">
                  <li>Contas: {user?.role && ['admin', 'agency_owner', 'agency_manager', 'agency_staff', 'independent_producer'].includes(user.role) ? '✅' : '❌'}</li>
                  <li>Projetos: {user?.role && !['free_user'].includes(user.role) ? '✅' : '❌'}</li>
                  <li>Agência: {user?.role && ['admin', 'agency_owner', 'independent_producer'].includes(user.role) ? '✅' : '❌'}</li>
                </ul>
              </div>
              <div>
                <strong>Pages:</strong>
                <ul className="list-disc list-inside">
                  <li>/agency: {user?.role && ['admin', 'agency_owner', 'agency_manager', 'independent_producer'].includes(user.role) ? '✅' : '❌'}</li>
                  <li>/workstation: {user?.role && ['admin', 'agency_owner', 'agency_manager', 'agency_staff', 'independent_producer', 'influencer'].includes(user.role) ? '✅' : '❌'}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-100 p-3 rounded">
            <h4 className="font-semibold text-yellow-800">⚠️ Diagnóstico:</h4>
            <ul className="text-yellow-700 text-sm list-disc list-inside">
              {user?.role === 'free_user' && (
                <li><strong>PROBLEMA:</strong> Role está como "free_user" - execute o script COMPLETE_AGENCY_OWNER_FIX.sql</li>
              )}
              {!user?.agency_id && user?.role === 'agency_owner' && (
                <li><strong>PROBLEMA:</strong> agency_owner sem agency_id - execute o script para criar agência</li>
              )}
              {user?.role === 'agency_owner' && user?.agency_id && (
                <li><strong>CORRETO:</strong> Role e agência configurados corretamente!</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}