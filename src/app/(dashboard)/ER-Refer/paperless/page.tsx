import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type PaperlessRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  y: number;
  m: number;
  refer_out_count: number;
  moph_refer_count: number;
  rate: number | null;
};

type HosRow = {
  hoscode: string;
  hosname: string;
  hosname_short: string | null;
};

const TH_MONTHS = [
  "มค",
  "กพ",
  "มีค",
  "เมย",
  "พค",
  "มิย",
  "กค",
  "สค",
  "กย",
  "ตค",
  "พย",
  "ธค",
] as const;

function fmtNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function displayHosName(name?: string | null, shortName?: string | null) {
  const candidate = shortName?.trim();
  if (candidate) return candidate;
  if (!name) return "-";
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล\s*/u, "รพ.");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { year?: string } | Promise<{ year?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});

  const years = await dbQuery<{ y: number }>(
    `select distinct y from public.transform_sync_refer_paperless order by y desc;`,
  ).then((r) => r.map((x) => x.y));

  const selectedYear =
    toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const [hosList, rows, meta] = await Promise.all([
    dbQuery<HosRow>(
      `select hoscode, hosname, hosname_short from public.c_hos order by hosname asc;`,
    ),
    dbQuery<PaperlessRow>(
      `
      select
        s.hoscode,
        h.hosname,
        h.hosname_short,
        s.y,
        s.m,
        s.refer_out_count,
        s.moph_refer_count,
        case when s.refer_out_count > 0
          then (s.moph_refer_count::float8 / s.refer_out_count::float8)
          else null
        end as rate
      from public.transform_sync_refer_paperless s
      left join public.c_hos h on h.hoscode = s.hoscode
      where s.y = $1
      order by h.hosname asc nulls last, s.hoscode asc, s.m asc;
      `,
      [selectedYear],
    ),
    dbQuery<{ row_count: number; last_update: string | null }>(
      `
      select
        (select count(*)::int from public.transform_sync_refer_paperless where y = $1) as row_count,
        (select max(d_update)::text from public.transform_sync_refer_paperless where y = $1) as last_update;
      `,
      [selectedYear],
    ).then((r) => r[0]),
  ]);

  const monthMap = new Map<string, Map<number, PaperlessRow>>();
  for (const r of rows) {
    const m = monthMap.get(r.hoscode) ?? new Map<number, PaperlessRow>();
    m.set(r.m, r);
    monthMap.set(r.hoscode, m);
  }

  return (
    <MetricPage
      title="Refer Paperless"
      description="ร้อยละของเคส Refer ที่ส่งข้อมูลผ่านระบบอิเล็กทรอนิกส์ครบถ้วน (เป้าหมาย 100%)"
      showTopCards={false}
      contentWidth="full"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <YearSelect years={years} value={selectedYear} />
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
          Connected
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            ปี: {selectedYear} • อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_refer_paperless</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <PivotTable hosList={hosList} monthMap={monthMap} />
        </div>
      </div>
    </MetricPage>
  );
}

function PivotTable({
  hosList,
  monthMap,
}: {
  hosList: HosRow[];
  monthMap: Map<string, Map<number, PaperlessRow>>;
}) {
  return (
    <table className="min-w-[1800px] w-full border border-zinc-200 text-[10px] text-zinc-800 dark:border-zinc-800 dark:text-zinc-100">
      <thead className="bg-zinc-50 text-[9px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <tr>
          <th rowSpan={2} className="w-10 border border-zinc-200 px-2 py-2 text-right font-semibold dark:border-zinc-800">
            ลำดับ
          </th>
          <th rowSpan={2} className="border border-zinc-200 px-3 py-2 text-left font-semibold whitespace-nowrap dark:border-zinc-800">
            ชื่อ รพ.
          </th>
          {TH_MONTHS.map((label) => (
            <th
              key={label}
              colSpan={3}
              className="border border-zinc-200 px-2 py-2 text-center font-semibold dark:border-zinc-800"
            >
              {label}
            </th>
          ))}
        </tr>
        <tr>
          {TH_MONTHS.map((label) => (
            <React.Fragment key={`${label}-sub`}>
              <th className="border border-zinc-200 px-2 py-1 text-right font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                Refer Out
              </th>
              <th className="border border-zinc-200 px-2 py-1 text-right font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                By MOPH Refer
              </th>
              <th className="border border-zinc-200 px-2 py-1 text-right font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-100">
                %
              </th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {hosList.map((h, idx) => {
          const byMonth = monthMap.get(h.hoscode);
          return (
            <tr
              key={h.hoscode}
              className="odd:bg-white even:bg-zinc-50/60 dark:odd:bg-zinc-950 dark:even:bg-zinc-900"
            >
              <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums font-semibold dark:border-zinc-800">
                {idx + 1}
              </td>
              <td className="border border-zinc-200 px-3 py-2 font-medium whitespace-nowrap dark:border-zinc-800">
                {displayHosName(h.hosname, h.hosname_short)}
              </td>
              {TH_MONTHS.map((_, monthIndex) => {
                const m = monthIndex + 1;
                const r = byMonth?.get(m);
                return (
                  <React.Fragment key={`${h.hoscode}-${m}`}>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r ? fmtNumber(r.refer_out_count, 0) : "-"}
                    </td>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r ? fmtNumber(r.moph_refer_count, 0) : "-"}
                    </td>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums font-semibold dark:border-zinc-800">
                      {r?.rate != null ? `${fmtNumber(r.rate * 100, 1)}%` : "-"}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
