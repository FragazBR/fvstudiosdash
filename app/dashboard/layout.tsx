import React from "react";

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white min-h-screen">
      {/* Layout exclusivo para agency */}
      {children}
    </div>
  );
}
