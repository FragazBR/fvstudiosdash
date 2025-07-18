import React from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 min-h-screen">
      {/* Layout exclusivo para client */}
      {children}
    </div>
  );
}
