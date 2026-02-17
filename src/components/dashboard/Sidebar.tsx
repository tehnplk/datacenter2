"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { DASHBOARD_NAV, type NavGroup } from "@/components/dashboard/nav";
import {
  CollapseIcon,
  ExpandIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/dashboard/icons";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({
  collapsed,
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
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const g of DASHBOARD_NAV) {
        if (g.items.some((it) => isActivePath(pathname, it.href))) next[g.id] = true;
      }
      return next;
    });
  }, [pathname]);

  const widthClass = collapsed ? "w-[72px]" : "w-[320px]";

  return (
    <aside
      className={`${widthClass} h-full shrink-0 border-r border-zinc-200/70 bg-white transition-[width] duration-300 ease-in-out dark:border-white/10 dark:bg-zinc-950`}
      aria-label="เมนูด้านซ้าย"
    >
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200/70 px-3 dark:border-white/10">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
            <span className="text-[11px] font-bold">PH</span>
          </div>
          <div
            className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-in-out ${
              collapsed
                ? "max-w-0 -translate-x-1 opacity-0"
                : "max-w-[220px] translate-x-0 opacity-100"
            }`}
          >
            <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              PHL Dashboard
            </div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              v0.1
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/70 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-white/5"
          aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
        >
          {collapsed ? <ExpandIcon className="h-5 w-5" /> : <CollapseIcon className="h-5 w-5" />}
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
}: {
  group: NavGroup;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-transparent bg-transparent">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-white/5 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
        aria-expanded={open}
      >
        <span
          className={`inline-flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? group.label : undefined}
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-zinc-50">
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
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/10">
            {open ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
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
          <ul className="mt-1 space-y-1">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm leading-5 transition-colors ${
                      active
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                        : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5"
                    }`}
                    aria-current={active ? "page" : undefined}
                    tabIndex={open ? 0 : -1}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        active
                          ? "bg-white dark:bg-zinc-950"
                          : "bg-zinc-300 dark:bg-white/25"
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
  );
}
