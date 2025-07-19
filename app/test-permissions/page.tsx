import { TestPermissions } from "@/components/test-permissions";
import { UserRoleSimulator } from '@/components/user-role-simulator';

export default function TestPermissionsPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🔒 Sistema de Permissões FVStudios</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema completo com 5 tipos de usuário e compatibilidade com funções legadas
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Sistema de teste do usuário atual */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Usuário Atual</h2>
            <TestPermissions />
          </div>
          
          {/* Simulador de usuários */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Simulador</h2>
            <UserRoleSimulator />
            
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">📋 Tipos de Usuário</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold">A</span>
                  <div>
                    <strong>Admin:</strong> FVStudios - Controle total do sistema
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">G</span>
                  <div>
                    <strong>Agency:</strong> Agências com equipe e clientes
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold">I</span>
                  <div>
                    <strong>Independent:</strong> Produtores autônomos
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">C</span>
                  <div>
                    <strong>Influencer:</strong> Criadores de conteúdo
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center text-xs font-bold">F</span>
                  <div>
                    <strong>Free:</strong> Plano gratuito limitado
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <strong className="text-amber-700 dark:text-amber-300 text-sm">⚡ Sistema Completo:</strong>
              <ul className="text-amber-600 dark:text-amber-400 text-xs mt-2 space-y-1 ml-4 list-disc">
                <li>5 tipos de usuário com permissões específicas</li>
                <li>Compatibilidade com função isAgencyOwnerOrAdmin</li>
                <li>Controle de acesso por componente</li>
                <li>Sistema de quotas e limites</li>
                <li>Proteção de rotas automática</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
