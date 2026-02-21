import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

const BED_GROUPS: Record<string, string> = {
  "1": "Ward",
  "2": "ICU",
  "3": "SEMI ICU",
  "4": "Stroke Unit",
  "5": "Burn Unit",
  "6": "เตียงอื่นๆ",
  "7": "ห้องความดันลบ",
};

const GROUP_ORDER = ["1", "2", "3", "4", "5", "6", "7"];

type BedCountRow = {
  hoscode: string;
  grp: string;
  beds: number;
};

type HosRow = {
  hoscode: string;
  hosname: string;
  hosname_short: string | null;
  size_level: string | null;
};

function displayHosName(name?: string | null, shortName?: string | null) {
  const s = shortName?.trim();
  if (s) return s;
  if (!name) return "-";
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล/, "รพ.");
}

export default async function Page() {
  const [hosList, rows, meta] = await Promise.all([
    dbQuery<HosRow>(
      `SELECT hoscode, hosname, hosname_short, size_level FROM public.c_hos ORDER BY hosname ASC`,
    ),
    dbQuery<BedCountRow>(
      `SELECT hoscode, substring(export_code, 4, 1) AS grp, count(*)::int AS beds
       FROM public.transform_sync_bed_type_all
       GROUP BY hoscode, grp
       ORDER BY hoscode, grp`,
    ),
    dbQuery<{ last_update: string | null }>(
      `SELECT MAX(d_update)::text AS last_update FROM public.transform_sync_bed_type_all`,
    ).then((r) => r[0]),
  ]);

  // build map: hoscode -> grp -> beds
  const dataMap = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!dataMap.has(r.hoscode)) dataMap.set(r.hoscode, new Map());
    dataMap.get(r.hoscode)!.set(r.grp, r.beds);
  }

  const activeHosList = hosList.filter((h) => dataMap.has(h.hoscode));

  // totals per group
  const groupTotals = new Map<string, number>();
  for (const [, grpMap] of dataMap) {
    for (const [g, beds] of grpMap) {
      groupTotals.set(g, (groupTotals.get(g) ?? 0) + beds);
    }
  }

  return (
    <MetricPage
      title="Beds: จำนวนเตียง"
      description="จำนวนเตียงแยกตามประเภท (หลักที่ 4 ของรหัสมาตรฐาน 6 หลัก)"
      showTopCards={false}
      contentWidth="wide"
      hideHeader
    >
      <div className="mt-2 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div>อัปเดตเมื่อ: {meta?.last_update ?? "-"}</div>
          <div>{activeHosList.length} โรงพยาบาล</div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <table className="w-full max-w-4xl border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
              <tr>
                <Th className="w-8 text-center">ลำดับ</Th>
                <Th className="text-left">โรงพยาบาล</Th>
                {GROUP_ORDER.map((g) => (
                  <Th key={g} className="w-20 text-right">{BED_GROUPS[g]}</Th>
                ))}
                <Th className="w-20 text-right font-bold text-zinc-700 dark:text-zinc-100">รวม</Th>
              </tr>
            </thead>
            <tbody>
              {activeHosList.map((h, idx) => {
                const grpMap = dataMap.get(h.hoscode)!;
                const total = [...grpMap.values()].reduce((a, b) => a + b, 0);
                return (
                  <tr key={h.hoscode} className="odd:bg-white even:bg-zinc-50/60 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                    <Td className="text-center tabular-nums text-zinc-400">{idx + 1}</Td>
                    <Td className="font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <SpLevelBadge level={h.size_level} />
                        {displayHosName(h.hosname, h.hosname_short)}
                      </span>
                    </Td>
                    {GROUP_ORDER.map((g) => {
                      const beds = grpMap.get(g);
                      return (
                        <Td key={g} className="text-right tabular-nums">
                          {beds != null ? beds.toLocaleString("th-TH") : <span className="text-zinc-300 dark:text-zinc-600">-</span>}
                        </Td>
                      );
                    })}
                    <Td className="text-right tabular-nums font-bold text-zinc-700 dark:text-zinc-200">
                      {total.toLocaleString("th-TH")}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-50 dark:bg-zinc-900">
                <Td className="text-center font-bold" colSpan={2}>รวมทั้งหมด</Td>
                {GROUP_ORDER.map((g) => (
                  <Td key={g} className="text-right tabular-nums font-bold text-zinc-700 dark:text-zinc-200">
                    {(groupTotals.get(g) ?? 0).toLocaleString("th-TH")}
                  </Td>
                ))}
                <Td className="text-right tabular-nums font-bold text-green-700 dark:text-green-400">
                  {[...groupTotals.values()].reduce((a, b) => a + b, 0).toLocaleString("th-TH")}
                </Td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-zinc-200/70 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
          ข้อมูลจากตาราง: <span className="font-mono">transform_sync_bed_type_all</span>
        </div>
      </div>
    </MetricPage>
  );
}

function Th({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-zinc-200/70 px-3 py-2 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300 ${className ?? ""}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`border-b border-zinc-200/70 px-3 py-2 text-zinc-800 dark:border-white/10 dark:text-zinc-100 ${className ?? ""}`}
      {...props}
    >
      {children}
    </td>
  );
}
