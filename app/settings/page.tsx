'use client'

import Link from "next/link";
import { Settings, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
                <p className="text-gray-600 mt-1">Página funcionando!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
