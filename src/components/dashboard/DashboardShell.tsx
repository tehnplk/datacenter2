"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarWidth, setSidebarWidth] = React.useState(320);
  const [isResizing, setIsResizing] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (event: MouseEvent) => {
      setSidebarWidth((prev) => {
        const next = Math.min(480, Math.max(220, event.clientX));
        return next;
      });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    const originalCursor = document.body.style.cursor;
    const originalSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalSelect;
    };
  }, [isResizing]);

  const effectiveSidebarWidth = collapsed ? 72 : sidebarWidth;

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (collapsed) return;
    event.preventDefault();
    setIsResizing(true);
  };

  return (
    <div className="min-h-screen bg-green-50 text-green-950 dark:bg-green-950 dark:text-green-50">
      {/* Desktop */}
      <div className="hidden min-h-screen md:flex">
        <Sidebar
          collapsed={collapsed}
          width={effectiveSidebarWidth}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
        <div
          role="separator"
          aria-orientation="vertical"
          className={`hidden w-1 cursor-col-resize select-none md:block ${
            collapsed ? "cursor-not-allowed opacity-40" : "opacity-0 transition hover:opacity-100"
          } ${isResizing ? "bg-zinc-300" : "bg-transparent"}`}
          onMouseDown={handleResizeStart}
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
                width={320}
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
