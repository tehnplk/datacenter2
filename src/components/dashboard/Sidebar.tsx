"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { DASHBOARD_NAV, type NavGroup } from "@/components/dashboard/nav";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

type SidebarProps = {
  collapsed: boolean;
  width?: number;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({
  collapsed,
  width = 320,
  onToggleCollapsed,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of DASHBOARD_NAV) {
      init[g.id] = g.items.some((it) => isActivePath(pathname, it.href));
    }
    return init;
  });

  React.useEffect(() => {
    setOpenGroups(() => {
      const next: Record<string, boolean> = {};
      for (const g of DASHBOARD_NAV) {
        next[g.id] = g.items.some((it) => isActivePath(pathname, it.href));
      }
      return next;
    });
  }, [pathname]);

  const computedWidth = collapsed ? 72 : Math.min(480, Math.max(220, width));

  const selectExclusiveGroup = React.useCallback((groupId: string) => {
    setOpenGroups(() => {
      const next: Record<string, boolean> = {};
      for (const g of DASHBOARD_NAV) {
        next[g.id] = g.id === groupId;
      }
      return next;
    });
  }, []);

  return (
    <aside
      className="h-full shrink-0 border-r border-green-200 bg-white transition-[width] duration-300 ease-in-out dark:border-green-800 dark:bg-green-950"
      style={{ width: computedWidth }}
      aria-label="เมนูด้านซ้าย"
    >
      <div className="flex h-14 items-center gap-2 border-b border-green-200 px-3 dark:border-green-800">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-green-700 text-white dark:bg-green-400 dark:text-green-950">
            <span className="text-[11px] font-bold">PLK</span>
          </div>
          <div
            className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-in-out ${
              collapsed
                ? "max-w-0 -translate-x-1 opacity-0"
                : "max-w-[220px] translate-x-0 opacity-100"
            }`}
          >
            <div className="truncate text-sm font-semibold text-green-900 dark:text-green-50">
              OPOH
            </div>
            <div className="truncate text-xs text-green-600 dark:text-green-400">
              v0.1
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-green-200 bg-white text-green-800 shadow-sm hover:bg-green-50 dark:border-green-700 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
          aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="h-[calc(100%-56px)] overflow-y-auto px-2 py-3">
        <ul className="space-y-2">
          {DASHBOARD_NAV.map((group) => (
            <li key={group.id}>
              <Group
                group={group}
                collapsed={collapsed}
                open={!!openGroups[group.id]}
                onToggle={() =>
                  setOpenGroups((p) => ({ ...p, [group.id]: !p[group.id] }))
                }
                pathname={pathname}
                onNavigate={onNavigate}
                onSelectExclusive={selectExclusiveGroup}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function Group({
  group,
  collapsed,
  open,
  onToggle,
  pathname,
  onNavigate,
  onSelectExclusive,
}: {
  group: NavGroup;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate?: () => void;
  onSelectExclusive: (groupId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-transparent bg-transparent">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-sm font-medium text-green-900 hover:bg-green-100 dark:text-green-100 dark:hover:bg-green-800/50 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
        aria-expanded={open}
      >
        <span
          className={`inline-flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? group.label : undefined}
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            {group.icon}
          </span>
          <span
            className={`min-w-0 overflow-hidden truncate transition-[max-width,opacity,transform] duration-300 ease-in-out ${
              collapsed
                ? "max-w-0 -translate-x-1 opacity-0"
                : "max-w-[220px] translate-x-0 opacity-100"
            }`}
          >
            {group.label}
          </span>
        </span>

        {!collapsed ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800">
            {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </span>
        ) : null}
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        } ${collapsed ? "hidden" : "block"}`}
        aria-hidden={!open}
      >
        <div className="overflow-hidden">
          <div className="mt-1 ml-[42px]">
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        onSelectExclusive(group.id);
                        onNavigate?.();
                      }}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] leading-5 transition-colors ${
                        active
                          ? "bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-50"
                          : "text-green-800 hover:bg-green-100 dark:text-green-200 dark:hover:bg-green-800/50"
                      }`}
                      aria-current={active ? "page" : undefined}
                      tabIndex={open ? 0 : -1}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          active
                            ? "bg-green-700 dark:bg-green-300"
                            : "bg-green-300 dark:bg-green-600"
                        }`}
                      />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
