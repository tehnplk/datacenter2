import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "sepsis", label: "Sepsis", table: "transform_sync_mortality_sepsis" },
  { key: "ami",    label: "AMI",    table: "transform_sync_mortality_ami" },
] as const;
type TabKey = "sepsis" | "ami";

type MortalityRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  discharge_year: number;
  total_admissions: number;
  deaths: number;
  mortality_rate_pct: number | null;
};

type HosRow = { hoscode: string; hosname: string | null; hosname_short: string | null; size_level: string | null };

function fmt(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("th-TH");
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "-";
  return `${Number(n).toFixed(2)}%`;
}

function Th({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-zinc-200/70 px-2 py-2 text-center text-xs font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300 ${className ?? ""}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`border-b border-zinc-200/70 px-2 py-1.5 text-xs text-zinc-800 dark:border-white/10 dark:text-zinc-100 ${className ?? ""}`}
      {...props}
    >
      {children}
    </td>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { tab?: string } | Promise<{ tab?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const selectedTab: TabKey = sp.tab === "ami" ? "ami" : "sepsis";
  const activeTable = TABS.find((t) => t.key === selectedTab)!.table;

  const [hosList, rows] = await Promise.all([
    dbQuery<HosRow>(
      `select hoscode, hosname, hosname_short, size_level from public.c_hos order by hosname asc;`,
    ),
    dbQuery<MortalityRow>(
      `
      select
        h.hoscode,
        h.hosname,
        h.hosname_short,
        s.discharge_year,
        s.total_admissions,
        s.deaths,
        s.mortality_rate_pct
      from public.c_hos h
      left join public.${activeTable} s on s.hoscode = h.hoscode
      order by h.hosname asc nulls last, h.hoscode asc, s.discharge_year asc;
      `,
    ),
  ]);

  const allYears: number[] = [];
  for (const r of rows) {
    if (r.discharge_year != null && !allYears.includes(r.discharge_year)) {
      allYears.push(r.discharge_year);
    }
  }
  allYears.sort((a, b) => b - a);
  const years = allYears.slice(0, 5);

  type YearData = { total_admissions: number; deaths: number; mortality_rate_pct: number | null };
  const dataMap = new Map<string, Map<number, YearData>>();
  for (const r of rows) {
    if (r.discharge_year == null) continue;
    const hosMap = dataMap.get(r.hoscode) ?? new Map<number, YearData>();
    hosMap.set(r.discharge_year, {
      total_admissions: r.total_admissions,
      deaths: r.deaths,
      mortality_rate_pct: r.mortality_rate_pct,
    });
    dataMap.set(r.hoscode, hosMap);
  }

  const hosListSorted = [...hosList].sort((a, b) => {
    for (const y of years) {
      const aHas = dataMap.get(a.hoscode)?.has(y) === true;
      const bHas = dataMap.get(b.hoscode)?.has(y) === true;
      if (aHas !== bHas) return aHas ? -1 : 1;
    }
    return (a.hosname ?? "").localeCompare(b.hosname ?? "", "th");
  });

  return (
    <MetricPage
      title="ICU: อัตราตายโรควิกฤตสำคัญ"
      description="อัตราตายในโรควิกฤตสำคัญ (Sepsis, AMI) รายโรงพยาบาล ย้อนหลัง 5 ปี"
      showTopCards={false}
      contentWidth="full"
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200/70 dark:border-white/10">
        {TABS.map((tab) => {
          const active = tab.key === selectedTab;
          return (
            <a
              key={tab.key}
              href={`?tab=${tab.key}`}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg border border-b-0 transition-colors ${
                active
                  ? "border-zinc-200/70 bg-white text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-b-xl rounded-tr-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
              {/* Year header row */}
              <tr>
                <Th className="w-8" rowSpan={2}>ลำดับ</Th>
                <Th className="w-40 text-left" rowSpan={2}>ชื่อ รพ.</Th>
                {years.map((y) => (
                  <Th key={y} colSpan={3} className="border-l border-zinc-200/70 dark:border-white/10">
                    ปี {y + 543}
                  </Th>
                ))}
              </tr>
              {/* Sub-header row */}
              <tr>
                {years.map((y) => (
                  <React.Fragment key={y}>
                    <Th className="border-l border-zinc-200/70 font-normal dark:border-white/10">Admit</Th>
                    <Th className="font-normal">Death</Th>
                    <Th className="font-bold">%</Th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {hosListSorted.map((h, idx) => {
                const hosData = dataMap.get(h.hoscode);
                const displayName = h.hosname_short?.trim() || h.hosname || h.hoscode;
                return (
                  <tr key={h.hoscode} className={idx % 2 === 0 ? "" : "bg-zinc-50/60 dark:bg-white/[0.02]"}>
                    <Td className="text-center tabular-nums">{idx + 1}</Td>
                    <Td className="font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <SpLevelBadge level={h.size_level} />
                        {displayName}
                      </span>
                    </Td>
                    {years.map((y) => {
                      const d = hosData?.get(y);
                      return (
                        <React.Fragment key={y}>
                          <Td className="border-l border-zinc-200/70 text-right tabular-nums dark:border-white/10">
                            {d ? fmt(d.total_admissions) : "-"}
                          </Td>
                          <Td className="text-right tabular-nums">
                            {d ? fmt(d.deaths) : "-"}
                          </Td>
                          <Td className="text-right tabular-nums font-bold">
                            {d ? fmtPct(d.mortality_rate_pct) : "-"}
                          </Td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-200/70 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
          ข้อมูลจากตาราง: <span className="font-mono">{activeTable}</span>
        </div>
      </div>
    </MetricPage>
  );
}
