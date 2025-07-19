"use client";
import { AgencyDashboard } from "./agency-dashboard";
import { useUser } from "@/hooks/useUser";

type DashboardProps = {
  userMode?: boolean;
};

export default function Dashboard({ userMode }: DashboardProps) {
  const { user } = useUser();
  
  // Para agências, usar o dashboard especializado
  if (user?.role === 'agency' || user?.role === 'admin') {
    return <AgencyDashboard />;
  }

  // Para outros tipos de usuário, dashboard básico
  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Dashboard {userMode ? 'Usuário' : 'Básico'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Dashboard para role: {user?.role || 'unknown'}
        </p>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            🚧 Este dashboard está em desenvolvimento. Use o dashboard da agência para a experiência completa.
          </p>
        </div>
      </div>
    </div>
  );
}
