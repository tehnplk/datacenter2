import * as React from "react";
import { dbQuery } from "@/lib/db";
import AdminGrid from "./AdminGrid";

export const dynamic = "force-dynamic";

const TABLES = [
  "transform_sync_test",
  "transform_sync_bed_an_occupancy",
  "transform_sync_bed_type_all",
  "transform_sync_critical_wait_bed",
  "transform_sync_drgs_rw_top10",
  "transform_sync_drgs_sum",
  "transform_sync_icu_semi_icu_case_realtime",
  "transform_sync_icu_ward_death",
  "transform_sync_mortality_ami",
  "transform_sync_mortality_sepsis",
  "transform_sync_normal_ward_death",
  "transform_sync_or_utilization_rate",
  "transform_sync_refer_paperless",
  "transform_sync_refer_top10",
  "transform_sync_waiting_time_cataract",
  "transform_sync_waiting_time_hernia",
] as const;

type TableName = (typeof TABLES)[number];

function isValidTable(name: string): name is TableName {
  return (TABLES as readonly string[]).includes(name);
}

type HosRow = { hoscode: string };
type HosNameRow = { hoscode: string; hosname: string | null };

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { table?: string; hos?: string } | Promise<{ table?: string; hos?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const selectedTable: TableName = isValidTable(sp.table ?? "")
    ? (sp.table as TableName)
    : TABLES[0];
  const selectedHos = sp.hos?.trim() || "";

  const hospitals = await dbQuery<HosRow>(
    `select distinct hoscode from public.c_hos order by hoscode asc`,
  );

  const hosNames = await dbQuery<HosNameRow>(
    `select hoscode, hosname from public.c_hos order by hoscode asc`,
  );
  const hosMap: Record<string, string> = {};
  for (const h of hosNames) hosMap[h.hoscode] = h.hosname ?? "";

  const columns = await dbQuery<{ column_name: string }>(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = $1
     order by ordinal_position`,
    [selectedTable],
  );
  const cols = columns.map((c) => c.column_name);
  const hasHoscode = cols.includes("hoscode");

  const params: unknown[] = [];
  let whereClause = "";
  if (hasHoscode && selectedHos) {
    whereClause = `where hoscode = $1`;
    params.push(selectedHos);
  }

  const rows = await dbQuery<Record<string, unknown>>(
    `select * from public.${selectedTable} ${whereClause} limit 2000`,
    params,
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Vertical Tab Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-green-200 bg-white dark:border-green-800 dark:bg-green-950">
        <div className="border-b border-green-200 bg-green-100 px-4 py-3 dark:border-green-800 dark:bg-green-900">
          <div className="text-sm font-bold text-green-900 dark:text-green-50">Admin</div>
          <div className="text-xs text-green-600 dark:text-green-400">Transform Tables</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {TABLES.map((t) => {
            const active = t === selectedTable;
            return (
              <a
                key={t}
                href={`/admin?table=${t}${selectedHos ? `&hos=${selectedHos}` : ""}`}
                className={`block cursor-pointer px-4 py-2 text-[11px] leading-5 transition-colors ${
                  active
                    ? "bg-green-200 font-semibold text-green-900 dark:bg-green-700 dark:text-green-50"
                    : "text-green-800 hover:bg-green-50 dark:text-green-200 dark:hover:bg-green-800/50"
                }`}
              >
                <span className="block truncate font-mono">{t}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-green-200 bg-green-100 px-4 py-2.5 dark:border-green-800 dark:bg-green-900">
          <div>
            <span className="font-mono text-sm font-bold text-green-900 dark:text-green-50">
              public.{selectedTable}
            </span>
            <span className="ml-3 text-xs text-green-600 dark:text-green-400">
              {rows.length} แถว{rows.length === 2000 ? " (จำกัด 2,000)" : ""}
              {" · "}
              {cols.length} คอลัมน์
            </span>
          </div>

        </div>

        {/* Data grid */}
        <div className="flex-1 overflow-auto p-4">
          {cols.length === 0 ? (
            <div className="rounded-xl border border-green-200 bg-white px-6 py-10 text-center text-sm text-green-600">
              ไม่พบตาราง
            </div>
          ) : (
            <AdminGrid
              cols={cols}
              rows={rows}
              hasHoscode={hasHoscode}
              hosMap={hosMap}
              hospitals={hospitals.map((h) => h.hoscode)}
              selectedHos={selectedHos}
              selectedTable={selectedTable}
            />
          )}
        </div>
      </div>
    </div>
  );
}
