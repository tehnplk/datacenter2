import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import HosSelect, { type HosItem } from "@/components/dashboard/HosSelect";
import YearSelect from "@/components/dashboard/YearSelect";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type WaitBedRow = {
  hoscode: string;
  hosname: string | null;
  yr: number;
  yr_be: number | null;
  total_cases: number | null;
  admitted_cases: number | null;
  refer_out_cases: number | null;
  avg_wait_min: number | null;
  avg_wait_hours: number | null;
  avg_admit_wait_min: number | null;
  avg_admit_wait_hr: number | null;
  avg_refer_wait_min: number | null;
  avg_refer_wait_hr: number | null;
  pct_over_4hr: number | null;
};

function fmtNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function formatHourMinute(totalMinutes: number | null) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return "-";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours} ชม ${minutes} นาที`;
}

function shortHosName(name: string) {
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล\s*/u, "รพ.");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { year?: string; hos?: string } | Promise<{ year?: string; hos?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});

  const years = await dbQuery<{ yr: number }>(
    `select distinct yr from public.transform_sync_critical_wait_bed order by yr desc;`,
  ).then((r) => r.map((x) => x.yr));

  const selectedYear =
    toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const selectedHos = sp.hos?.trim() || undefined;
  const where: string[] = ["s.yr = $1"];
  const params: Array<string | number> = [selectedYear];
  if (selectedHos) {
    params.push(selectedHos);
    where.push(`s.hoscode = $${params.length}`);
  }
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";

  const [hosList, rows, meta] = await Promise.all([
    dbQuery<HosItem>(
      `select hoscode, hosname from public.c_hos order by hosname asc;`,
    ),
    dbQuery<WaitBedRow>(
      `
      select
        s.hoscode,
        h.hosname,
        s.yr,
        s.yr_be,
        s.total_cases,
        s.admitted_cases,
        s.refer_out_cases,
        s.avg_wait_min,
        s.avg_wait_hours,
        s.avg_admit_wait_min,
        s.avg_admit_wait_hr,
        s.avg_refer_wait_min,
        s.avg_refer_wait_hr,
        s.pct_over_4hr
      from public.transform_sync_critical_wait_bed s
      left join public.c_hos h on h.hoscode = s.hoscode
      ${whereSql}
      order by h.hosname asc nulls last, s.hoscode asc;
      `,
      params,
    ),
    dbQuery<{ row_count: number; last_update: string | null }>(
      `
      select
        (select count(*)::int from public.transform_sync_critical_wait_bed s ${whereSql}) as row_count,
        (select max(d_update)::text from public.transform_sync_critical_wait_bed s ${whereSql}) as last_update;
      `,
      params,
    ).then((r) => r[0]),
  ]);

  return (
    <MetricPage
      title=""
      description="ระยะเวลาเฉลี่ยที่ผู้ป่วยวิกฤตรอเตียง ICU (แยก admit/refer out)"
      showTopCards={false}
      contentWidth="wide"
      titleClassName="hidden"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <HosSelect hospitals={hosList} value={selectedHos} />
        <YearSelect years={years} value={selectedYear} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            ปี: {selectedYear} • อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_critical_wait_bed</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <table className="min-w-[720px] w-full border-separate border-spacing-0 text-xs">
            <thead className="bg-white dark:bg-zinc-950">
              <tr>
                <Th className="w-[64px] text-right">ลำดับ</Th>
                <Th className="min-w-[220px]">ชื่อ รพ.</Th>
                <Th className="w-[120px] text-right">จำนวน case</Th>
                <Th className="w-[260px] text-right">ระยะเวลารอเตียงเฉลี่ย</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.hoscode}-${idx}`}>
                  <Td className="text-right tabular-nums">{idx + 1}</Td>
                  <Td>{r.hosname ? shortHosName(r.hosname) : r.hoscode}</Td>
                  <Td className="text-right tabular-nums">
                    {r.total_cases != null ? fmtNumber(r.total_cases, 0) : "-"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {formatHourMinute(r.avg_admit_wait_min)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MetricPage>
  );
}

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function Th({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-zinc-200/70 px-3 py-2 text-left text-xs font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300 ${className ?? ""}`}
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
