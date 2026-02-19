import * as React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f9f0] text-green-950 dark:bg-green-950 dark:text-green-50">
      {children}
    </div>
  );
}
