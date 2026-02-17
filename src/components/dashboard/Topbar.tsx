"use client";

import * as React from "react";
import { MenuIcon } from "@/components/dashboard/icons";

type TopbarProps = {
  onOpenMobileNav: () => void;
};

export default function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/70 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-white/5 md:hidden"
          aria-label="เปิดเมนู"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard ข้อมูลสุขภาพ
          </div>
          <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            สำนักงานสาธารณสุขจังหวัดพิษณุโลก
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200 sm:inline">
            Prototype
          </span>
        </div>
      </div>
    </div>
  );
}
