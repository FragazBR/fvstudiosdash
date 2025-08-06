'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Database, Trash2, Settings, Shield, Zap, UserCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

export default function AdminSystemPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [isRestoringPermissions, setIsRestoringPermissions] = useState(false)
  const [permissionsResult, setPermissionsResult] = useState<any>(null)

  const checkSystemConfig = async () => {
    try {
      const response = await fetch('/api/admin/system/config')
      const data = await response.json()
      setSystemConfig(data)
    } catch (error) {
      console.error('Erro ao verificar configuração:', error)
    }
  }

  const executeNuclearCleanup = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação vai DELETAR TODOS os dados do sistema (usuários, projetos, agências, etc.) exceto o admin principal. Esta ação é IRREVERSÍVEL.\n\nTem certeza que deseja continuar?')) {
      return
    }

    if (!confirm('💣 CONFIRMAÇÃO FINAL: Digitando "CONFIRMO" você concorda em DELETAR TUDO. Esta é sua última chance de cancelar.')) {
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/system/nuclear-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'NUCLEAR_CLEANUP_DELETE_EVERYTHING' })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Erro na comunicação com o servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const restoreAdminPermissions = async () => {
    if (!confirm('🔑 Deseja restaurar as permissões administrativas para o usuário principal (franco@fvstudios.com.br)?')) {
      return
    }

    setIsRestoringPermissions(true)
    setPermissionsResult(null)

    try {
      const response = await fetch('/api/admin/system/restore-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      setPermissionsResult(data)
    } catch (error) {
      setPermissionsResult({
        success: false,
        error: 'Erro na comunicação com o servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsRestoringPermissions(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Ferramentas avançadas para gerenciamento completo do sistema
          </p>
        </div>
        <Button onClick={checkSystemConfig} variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Verificar Config
        </Button>
      </div>

      {/* System Configuration */}
      {systemConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuração do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Service Role Key</span>
                <Badge variant={systemConfig.config?.hasServiceRoleKey ? 'default' : 'destructive'}>
                  {systemConfig.config?.hasServiceRoleKey ? 'Configurada' : 'Ausente'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Supabase URL</span>
                <Badge variant={systemConfig.config?.supabaseUrl === 'configured' ? 'default' : 'destructive'}>
                  {systemConfig.config?.supabaseUrl === 'configured' ? 'OK' : 'Erro'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span>Ambiente</span>
                <Badge variant="outline">
                  {systemConfig.config?.environment || 'Unknown'}
                </Badge>
              </div>
            </div>

            {systemConfig.serviceRoleTest && (
              <div className="mt-4 p-3 bg-muted rounded">
                <h4 className="font-medium mb-2">Teste Service Role:</h4>
                <div className="text-sm space-y-1">
                  <div>Pode listar usuários: {systemConfig.serviceRoleTest.canListUsers ? '✅' : '❌'}</div>
                  <div>Usuários encontrados: {systemConfig.serviceRoleTest.userCount}</div>
                  {systemConfig.serviceRoleTest.error && (
                    <div className="text-red-600">Erro: {systemConfig.serviceRoleTest.error}</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Permissions Restore */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <UserCheck className="h-5 w-5" />
            Restaurar Permissões Admin
          </CardTitle>
          <CardDescription>
            Restaura as permissões administrativas para o usuário principal em caso de problemas de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <UserCheck className="h-4 w-4" />
            <AlertDescription>
              <strong>Esta operação irá:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Verificar se franco@fvstudios.com.br existe no sistema</li>
                <li>Criar/atualizar permissões admin completas</li>
                <li>Garantir acesso total às funcionalidades administrativas</li>
                <li>Resolver problemas de erro 403 (Forbidden)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={restoreAdminPermissions}
            disabled={isRestoringPermissions}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isRestoringPermissions ? (
              <>
                <UserCheck className="h-4 w-4 animate-pulse" />
                Restaurando Permissões...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                🔑 Restaurar Permissões Admin
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Permissions Restore Results */}
      {permissionsResult && (
        <Card className={permissionsResult.success ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className={permissionsResult.success ? 'text-green-600' : 'text-red-600'}>
              Resultado da Restauração de Permissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permissionsResult.success ? (
              <div className="space-y-4">
                <div className="text-green-600 font-medium">
                  ✅ {permissionsResult.message}
                </div>
                
                {permissionsResult.details && (
                  <div className="bg-green-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Detalhes:</h4>
                    <div className="text-sm space-y-1">
                      <div>Email: {permissionsResult.details.email}</div>
                      <div>Role: {permissionsResult.details.role}</div>
                      <div>Permissões: {JSON.stringify(permissionsResult.details.permissions, null, 2)}</div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  💡 Agora você pode tentar criar usuários novamente sem erro 403.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-red-600 font-medium">
                  ❌ {permissionsResult.error}
                </div>
                {permissionsResult.details && (
                  <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                    {permissionsResult.details}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nuclear Cleanup */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Limpeza Nuclear do Sistema
          </CardTitle>
          <CardDescription>
            Remove TODOS os dados do sistema exceto o admin principal. Use apenas para reset completo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> Esta operação é IRREVERSÍVEL e remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos os usuários (exceto franco@fvstudios.com.br)</li>
                <li>Todas as agências, projetos e tarefas</li>
                <li>Todos os contatos, mensagens e conversas</li>
                <li>Todos os relatórios e logs de atividade</li>
                <li>Todos os convites e dados auxiliares</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={executeNuclearCleanup}
            disabled={isLoading || !systemConfig?.config?.hasServiceRoleKey}
            variant="destructive" 
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Zap className="h-4 w-4 animate-spin" />
                Executando Limpeza Nuclear...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                💣 Executar Limpeza Nuclear
              </>
            )}
          </Button>

          {!systemConfig?.config?.hasServiceRoleKey && (
            <p className="text-sm text-red-600">
              ⚠️ Service Role Key não configurada. Operação não disponível.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
              Resultado da Operação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="text-green-600 font-medium">
                  ✅ {result.message}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {result.summary?.tables_cleared || 0}
                    </div>
                    <div className="text-sm text-green-700">Tabelas Limpas</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.summary?.users_cleaned || 0}
                    </div>
                    <div className="text-sm text-blue-700">Usuários Removidos</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {result.summary?.errors_count || 0}
                    </div>
                    <div className="text-sm text-yellow-700">Erros</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">1</div>
                    <div className="text-sm text-purple-700">Admin Preservado</div>
                  </div>
                </div>

                {result.results?.tablesCleared && result.results.tablesCleared.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tabelas Limpas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.results.tablesCleared.map((table: string) => (
                        <Badge key={table} variant="outline" className="text-green-600 border-green-200">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.results?.errors && result.results.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-600">Erros/Avisos:</h4>
                    <div className="space-y-1">
                      {result.results.errors.map((error: string, index: number) => (
                        <div key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-red-600 font-medium">
                  ❌ {result.error}
                </div>
                {result.details && (
                  <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                    {result.details}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Database Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Ferramentas de Banco de Dados
          </CardTitle>
          <CardDescription>
            Gerenciamento de schemas, RLS, triggers e estrutura do banco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" disabled>
              <Database className="h-6 w-6" />
              <span>Schema Manager</span>
              <Badge variant="secondary" className="text-xs">Em breve</Badge>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" disabled>
              <Shield className="h-6 w-6" />
              <span>RLS Policies</span>
              <Badge variant="secondary" className="text-xs">Em breve</Badge>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" disabled>
              <Zap className="h-6 w-6" />
              <span>Triggers</span>
              <Badge variant="secondary" className="text-xs">Em breve</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}