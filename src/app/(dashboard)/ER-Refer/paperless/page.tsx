import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import HosSelect, { type HosItem } from "@/components/dashboard/HosSelect";
import YearSelect from "@/components/dashboard/YearSelect";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type PaperlessRow = {
  hoscode: string;
  hosname: string | null;
  y: number;
  m: number;
  refer_out_count: number;
  moph_refer_count: number;
  rate: number | null;
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

  const years = await dbQuery<{ y: number }>(
    `select distinct y from public.transform_sync_refer_paperless order by y desc;`,
  ).then((r) => r.map((x) => x.y));

  const selectedYear =
    toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const selectedHos = sp.hos?.trim() || undefined;
  const where: string[] = ["s.y = $1"];
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
    dbQuery<PaperlessRow>(
      `
      select
        s.hoscode,
        h.hosname,
        s.y,
        s.m,
        s.refer_out_count,
        s.moph_refer_count,
        case when s.refer_out_count > 0 then (s.moph_refer_count::float8 / s.refer_out_count::float8) else null end as rate
      from public.transform_sync_refer_paperless s
      left join public.c_hos h on h.hoscode = s.hoscode
      ${whereSql}
      order by h.hosname asc nulls last, s.hoscode asc, s.m asc;
      `,
      params,
    ),
    dbQuery<{ row_count: number; last_update: string | null }>(
      `
      select
        (select count(*)::int from public.transform_sync_refer_paperless s ${whereSql}) as row_count,
        (select max(d_update)::text from public.transform_sync_refer_paperless s ${whereSql}) as last_update;
      `,
      params,
    ).then((r) => r[0]),
  ]);

  return (
    <MetricPage
      title=""
      description="ร้อยละของเคส Refer ที่ส่งข้อมูลผ่านระบบอิเล็กทรอนิกส์ครบถ้วน (เป้าหมาย 100%)"
      showTopCards={false}
      contentWidth="wide"
      titleClassName="hidden"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <HosSelect hospitals={hosList} value={selectedHos} />
        <YearSelect years={years} value={selectedYear} />
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
          Connected
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            ปี: {selectedYear} • อัปเดตเมื่อ: {meta?.last_update ?? "-"} • แถวทั้งหมด: {meta?.row_count ?? 0}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_refer_paperless</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <table className="min-w-[980px] w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
              <tr>
                <Th className="sticky left-0 z-20 w-[72px] bg-white/95 dark:bg-zinc-950/95">ลำดับ</Th>
                <Th className="sticky left-[72px] z-20 w-[260px] bg-white/95 dark:bg-zinc-950/95">ชื่อ รพ.</Th>
                <Th className="w-[72px] text-center">เดือน</Th>
                <Th className="w-[140px] text-right">refer_out</Th>
                <Th className="w-[140px] text-right">moph_refer</Th>
                <Th className="w-[120px] text-right">paperless %</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.hoscode}-${r.m}-${idx}`}>
                  <Td className="sticky left-0 z-10 bg-white/95 text-right tabular-nums dark:bg-zinc-950/95">
                    {idx + 1}
                  </Td>
                  <Td className="sticky left-[72px] z-10 bg-white/95 dark:bg-zinc-950/95">
                    {r.hosname ? shortHosName(r.hosname) : r.hoscode}
                  </Td>
                  <Td className="text-center">{TH_MONTHS[r.m - 1] ?? r.m}</Td>
                  <Td className="text-right tabular-nums">{fmtNumber(r.refer_out_count, 0)}</Td>
                  <Td className="text-right tabular-nums">{fmtNumber(r.moph_refer_count, 0)}</Td>
                  <Td className="text-right tabular-nums">
                    {r.rate != null ? `${fmtNumber(r.rate * 100, 2)}%` : "-"}
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
