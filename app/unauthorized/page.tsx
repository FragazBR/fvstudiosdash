"use client"

import React from "react";
// import { useTranslation } from "react-i18next"; // Desabilitado temporariamente

export default function UnauthorizedPage() {
  // const { t } = useTranslation(); // Desabilitado temporariamente
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Acesso Negado</h1>
      <p className="text-lg">Você não tem permissão para acessar esta página.</p>
    </div>
  );
}
