import { UserRoleSimulator } from '@/components/user-role-simulator'

export default function TestPermissionsPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🔒 Sistema de Permissões</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Teste o sistema de controle de acesso da agência
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <UserRoleSimulator />
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">📋 Como Funciona</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <strong>Proprietário/Admin:</strong> Acesso total ao módulo Agency Management
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <strong>Gerente:</strong> Acesso limitado, pode ver contratos mas não dados financeiros internos
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <strong>Funcionário/Cliente:</strong> Sem acesso ao módulo Agency Management
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">🛡️ Níveis de Proteção</h2>
              <div className="space-y-3 text-sm">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <strong className="text-green-700 dark:text-green-300">Sidebar:</strong>
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                    Menu "Agency" só aparece para owners e admins
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <strong className="text-blue-700 dark:text-blue-300">Página:</strong>
                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    Acesso direto via URL é bloqueado com tela de erro
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <strong className="text-purple-700 dark:text-purple-300">Componentes:</strong>
                  <p className="text-purple-600 dark:text-purple-400 text-xs mt-1">
                    Controle granular por abas e funcionalidades específicas
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <strong className="text-amber-700 dark:text-amber-300 text-sm">⚡ Teste Agora:</strong>
              <ol className="text-amber-600 dark:text-amber-400 text-xs mt-2 space-y-1 ml-4 list-decimal">
                <li>Selecione "Funcionário" no simulador</li>
                <li>Clique em "Aplicar Mudanças"</li>
                <li>Observe que o menu "Agency" desaparece da sidebar</li>
                <li>Tente acessar diretamente /agency</li>
                <li>Mude para "Proprietário" para ver a diferença</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
