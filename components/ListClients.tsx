'use client'

// Arquivo renomeado temporariamente para forçar git a reconhecer case-sensitive
'use client'

"use client";
import React from 'react'
import { useTranslation } from 'react-i18next'

interface Client {
  id: string
  name: string
  email: string
  status: 'Ativo' | 'Inativo'
}

const mockClients: Client[] = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', status: 'Ativo' },
  { id: '2', name: 'Maria Oliveira', email: 'maria@email.com', status: 'Inativo' },
  { id: '3', name: 'Carlos Santos', email: 'carlos@email.com', status: 'Ativo' },
]

function ListClients() {
  const { t } = useTranslation();
  return (
    <div className="w-full bg-white p-4 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">{t('clients.title')}</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">{t('clients.name')}</th>
            <th className="py-2">Email</th>
            <th className="py-2">{t('clients.status.title')}</th>
          </tr>
        </thead>
        <tbody>
          {mockClients.map(client => (
            <tr key={client.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{client.name}</td>
              <td className="py-2">{client.email}</td>
              <td className="py-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    client.status === t('clients.status.active')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {client.status === 'Ativo' ? t('clients.status.active') : t('clients.status.inactive')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  )
}

export default ListClients;
