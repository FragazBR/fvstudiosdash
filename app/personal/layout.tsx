import React from "react";

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-yellow-50 min-h-screen">
      {/* Layout exclusivo para personal */}
      {children}
    </div>
  );
}
