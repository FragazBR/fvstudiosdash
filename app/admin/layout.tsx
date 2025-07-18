import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Aqui pode entrar um header/side nav exclusivo do admin */}
      {children}
    </div>
  );
}
