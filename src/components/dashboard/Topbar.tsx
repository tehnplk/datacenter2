"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Menu, Search, X } from "lucide-react";

type ConnectionRow = {
  hos: string | null;
  hosname: string | null;
  sync_version: string | null;
  connected_at: string | null;
  status: string | null;
};

const STALE_MINUTES = 180;

function parseConnectedAt(value: string | null) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function isConnectedFresh(value: string | null) {
  const dt = parseConnectedAt(value);
  if (!dt) return false;
  const diffMinutes = (Date.now() - dt.getTime()) / 60000;
  return diffMinutes <= STALE_MINUTES;
}

function formatConnectedAt(value: string | null) {
  const dt = parseConnectedAt(value);
  if (!dt) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dt);
}

function shortHosName(name: string) {
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล\s*/u, "รพ.");
}

type TopbarProps = {
  onOpenMobileNav: () => void;
};

export default function Topbar({ onOpenMobileNav }: TopbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rows, setRows] = React.useState<ConnectionRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    setLoading(true);
    setError(null);

    fetch("/api/connection-status")
      .then((res) => {
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        return res.json();
      })
      .then((data) => {
        if (!isActive) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <div className="border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/70 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-white/5 md:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu className="h-5 w-5" />
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
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-zinc-200/70 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/10 sm:inline-flex"
          >
            <Search className="h-3.5 w-3.5" />
            Connection
          </button>
        </div>
      </div>

      {isOpen && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center px-4 py-6">
              <button
                type="button"
                className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                aria-label="ปิดหน้าต่าง"
                onClick={() => setIsOpen(false)}
              />
              <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/10"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-between border-b border-zinc-200/70 px-5 py-4 pr-14 text-sm font-semibold text-zinc-900 dark:border-white/10 dark:text-zinc-50">
                  สถานะการเชื่อมต่อ
                </div>
                <div className="max-h-[70vh] overflow-auto px-5 py-4 text-xs">
                  {loading ? (
                    <div className="py-6 text-center text-zinc-500">กำลังโหลดข้อมูล...</div>
                  ) : error ? (
                    <div className="py-6 text-center text-rose-600">{error}</div>
                  ) : (
                    <table className="w-full min-w-[640px] border-separate border-spacing-0">
                      <thead className="bg-white/90 text-[11px] uppercase text-zinc-400 backdrop-blur dark:bg-zinc-950/90">
                        <tr>
                          <th className="px-3 py-2 text-left">Hos</th>
                          <th className="px-3 py-2 text-left">Sync Version</th>
                          <th className="px-3 py-2 text-left">Connected At</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => {
                          const isFresh = isConnectedFresh(row.connected_at);
                          const statusLabel = isFresh ? "Online" : "Offline";
                          const statusColor = isFresh
                            ? "bg-emerald-500"
                            : "bg-rose-500";
                          return (
                            <tr
                              key={`${row.hos ?? "-"}-${idx}`}
                              className="border-b border-zinc-100 text-zinc-700 dark:border-white/5 dark:text-zinc-200"
                            >
                              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                                <div className="flex flex-col">
                                  <span>{row.hos ?? "-"}</span>
                                  {row.hosname ? (
                                    <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                                      {shortHosName(row.hosname)}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px]">
                                {row.sync_version ?? "-"}
                              </td>
                              <td className="px-3 py-2">{formatConnectedAt(row.connected_at)}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-2 font-medium">
                                  <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                                  <span className={isFresh ? "text-emerald-600" : "text-rose-600"}>
                                    {statusLabel}
                                  </span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {rows.length === 0 ? (
                          <tr>
                            <td className="px-3 py-6 text-center text-zinc-500" colSpan={4}>
                              ไม่พบข้อมูลการเชื่อมต่อ
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
