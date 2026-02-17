"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      {/* Desktop */}
      <div className="hidden min-h-screen md:flex">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
        <div className="min-w-0 flex-1">
          <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      {/* Mobile */}
      <div className="min-h-screen md:hidden">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="min-w-0">{children}</main>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="ปิดเมนู"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[360px] shadow-2xl">
              <Sidebar
                collapsed={false}
                onToggleCollapsed={() => setCollapsed((v) => !v)}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
