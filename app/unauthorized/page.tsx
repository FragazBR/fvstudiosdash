"use client"

import React from "react";
import { useTranslation } from "react-i18next";

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold text-red-600 mb-4">{t('unauthorized.title')}</h1>
      <p className="text-lg">{t('unauthorized.message')}</p>
    </div>
  );
}
