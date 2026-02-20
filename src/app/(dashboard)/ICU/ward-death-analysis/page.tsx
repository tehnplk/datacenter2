import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type DeathRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  sp_level: string | null;
  pdx: string;
  pdx_name: string | null;
  death_count: number;
};

type Top10Row = {
  pdx: string;
  pdx_name: string | null;
  total_death: number;
  rank: number;
};

type HosRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  sp_level: string | null;
  total_death: number;
};

function displayHosName(name?: string | null, shortName?: string | null) {
  const candidate = shortName?.trim();
  if (candidate) return candidate;
  if (!name) return "-";
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล\s*/u, "รพ.");
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

type TabKey = "overview" | "by-hospital";
const TABS: { key: TabKey; label: string }[] = [
  { key: "overview",    label: "ภาพรวม" },
  { key: "by-hospital", label: "รายโรงพยาบาล" },
];

export default async function Page({
  searchParams,
}: {
  searchParams?: { year?: string; tab?: string; hos?: string } | Promise<{ year?: string; tab?: string; hos?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const selectedTab: TabKey = sp.tab === "by-hospital" ? "by-hospital" : "overview";
  const selectedHos = sp.hos ?? null;

  const years = await dbQuery<{ y: number }>(
    `SELECT DISTINCT y FROM public.transform_sync_normal_ward_death ORDER BY y DESC`,
  ).then((r) => r.map((x) => x.y));

  const selectedYear = toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const [top10, rows, meta] = await Promise.all([
    dbQuery<Top10Row>(
      `SELECT d.pdx, ic.name AS pdx_name, sum(d.death_count)::int AS total_death,
              rank() OVER (ORDER BY sum(d.death_count) DESC)::int AS rank
       FROM public.transform_sync_normal_ward_death d
       LEFT JOIN public.c_icd10 ic ON ic.code = d.pdx
       WHERE d.y = $1
       GROUP BY d.pdx, ic.name
       ORDER BY total_death DESC
       LIMIT 10`,
      [selectedYear],
    ),
    dbQuery<DeathRow>(
      `SELECT h.hoscode, h.hosname, h.hosname_short, h.sp_level,
              d.pdx, ic.name AS pdx_name, d.death_count
       FROM public.transform_sync_normal_ward_death d
       JOIN public.c_hos h ON h.hoscode = d.hoscode
       LEFT JOIN public.c_icd10 ic ON ic.code = d.pdx
       WHERE d.y = $1
       ORDER BY h.hosname ASC, d.death_count DESC`,
      [selectedYear],
    ),
    dbQuery<{ last_update: string | null }>(
      `SELECT max(d_update)::text AS last_update
       FROM public.transform_sync_normal_ward_death WHERE y = $1`,
      [selectedYear],
    ).then((r) => r[0]),
  ]);

  const top10Pdx = top10.map((t) => t.pdx);

  const hosMap = new Map<string, HosRow & { byPdx: Map<string, { name: string | null; count: number }> }>();
  for (const r of rows) {
    if (!hosMap.has(r.hoscode)) {
      hosMap.set(r.hoscode, {
        hoscode: r.hoscode,
        hosname: r.hosname,
        hosname_short: r.hosname_short,
        sp_level: r.sp_level,
        total_death: 0,
        byPdx: new Map(),
      });
    }
    const h = hosMap.get(r.hoscode)!;
    h.total_death += r.death_count;
    const prev = h.byPdx.get(r.pdx);
    h.byPdx.set(r.pdx, { name: r.pdx_name, count: (prev?.count ?? 0) + r.death_count });
  }

  const hosList = [...hosMap.values()].sort((a, b) => b.total_death - a.total_death);
  const activeHos = selectedHos ?? (hosList.length ? hosList[0].hoscode : null);
  const activeHosData = hosMap.get(activeHos ?? "");

  const thCls = "border border-zinc-200 px-2 py-1.5 text-center text-[10px] font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 whitespace-nowrap";
  const tdCls = "border border-zinc-200 px-2 py-1.5 text-[11px] dark:border-zinc-800";
  const tdNum = `${tdCls} text-right tabular-nums`;

  return (
    <MetricPage
      title="การตายใน ward ธรรมดา (Top 10)"
      description="10 อันดับโรคที่มีผู้เสียชีวิตสูงสุดใน ward ธรรมดา"
      showTopCards={false}
      contentWidth="full"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <YearSelect years={years} value={selectedYear} />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b border-zinc-200/70 dark:border-white/10">
        {TABS.map((tab) => {
          const active = tab.key === selectedTab;
          const params = new URLSearchParams({ year: String(selectedYear), tab: tab.key });
          return (
            <a
              key={tab.key}
              href={`?${params.toString()}`}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg border border-b-0 transition-colors whitespace-nowrap ${
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

      {/* Tab: ภาพรวม */}
      {selectedTab === "overview" && (
        <div className="overflow-hidden rounded-b-xl rounded-tr-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">10 อันดับโรคที่มีผู้เสียชีวิตสูงสุด (รวมทุก รพ.)</span>
            <span>ปี {selectedYear} • อัปเดต: {meta?.last_update?.slice(0, 10) ?? "-"}</span>
          </div>
          <div className="overflow-auto bg-white dark:bg-zinc-950">
            <table className="w-full max-w-2xl text-sm">
              <colgroup>
                <col className="w-10" />
                <col className="w-24" />
                <col />
                <col className="w-20" />
              </colgroup>
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className={`${thCls} text-right`}>อันดับ</th>
                  <th className={`${thCls} text-left`}>รหัส ICD-10</th>
                  <th className={`${thCls} text-left`}>ชื่อโรค</th>
                  <th className={`${thCls}`}>จำนวนตาย</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((t) => (
                  <tr key={t.pdx} className="odd:bg-white even:bg-zinc-50/60 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                    <td className={`${tdNum} text-center font-bold`}>{t.rank}</td>
                    <td className={`${tdCls} text-center font-mono`}>{t.pdx}</td>
                    <td className={tdCls}>{t.pdx_name ?? "-"}</td>
                    <td className={`${tdNum} font-bold text-red-600 dark:text-red-400`}>{fmtNum(t.total_death)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-200 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_normal_ward_death</span>
          </div>
        </div>
      )}

      {/* Tab: รายโรงพยาบาล */}
      {selectedTab === "by-hospital" && (
        <div className="overflow-hidden rounded-b-xl rounded-tr-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
          {/* Hospital sub-tabs */}
          <div className="overflow-x-auto border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex min-w-max gap-0.5 px-2 pt-2">
              {hosList.map((h) => {
                const isActive = h.hoscode === activeHos;
                const params = new URLSearchParams({ year: String(selectedYear), tab: "by-hospital", hos: h.hoscode });
                return (
                  <a
                    key={h.hoscode}
                    href={`?${params.toString()}`}
                    className={`flex items-center gap-1 rounded-t-md border border-b-0 px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <SpLevelBadge level={h.sp_level} />
                    {displayHosName(h.hosname, h.hosname_short)}
                    <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/50 dark:text-red-400">
                      {fmtNum(h.total_death)}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Hospital detail - vertical list */}
          {activeHosData && (
            <div className="bg-white dark:bg-zinc-950">
              <div className="border-b border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {displayHosName(activeHosData.hosname, activeHosData.hosname_short)}
                </span>
                <span className="ml-3">ปี {selectedYear} • รวม {fmtNum(activeHosData.total_death)} ราย</span>
              </div>
              <div className="overflow-auto">
                <table className="w-full max-w-xl text-[11px]">
                  <colgroup>
                    <col className="w-10" />
                    <col className="w-24" />
                    <col />
                    <col className="w-20" />
                  </colgroup>
                  <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      <th className={`${thCls} text-right`}>ลำดับ</th>
                      <th className={`${thCls} text-left`}>รหัส ICD-10</th>
                      <th className={`${thCls} text-left`}>ชื่อโรค</th>
                      <th className={`${thCls}`}>จำนวนตาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...activeHosData.byPdx.entries()]
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([pdx, { name, count }], idx) => (
                        <tr key={pdx} className="odd:bg-white even:bg-zinc-50/60 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                          <td className={`${tdNum} text-center font-bold`}>{idx + 1}</td>
                          <td className={`${tdCls} text-center font-mono`}>{pdx}</td>
                          <td className={tdCls}>{name ?? "-"}</td>
                          <td className={`${tdNum} font-bold text-red-600 dark:text-red-400`}>{fmtNum(count)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-200 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_normal_ward_death</span>
          </div>
        </div>
      )}
    </MetricPage>
  );
}
