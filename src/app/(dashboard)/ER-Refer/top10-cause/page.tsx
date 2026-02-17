import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import HosSelect, { type HosItem } from "@/components/dashboard/HosSelect";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type Top10Row = {
  hoscode: string;
  hosname: string | null;
  icd10: string;
  icd10_name: string;
  total_refer: number;
};

function shortHosName(name: string) {
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล\s*/u, "รพ.");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { hos?: string } | Promise<{ hos?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});

  const selectedHos = sp.hos?.trim() || undefined;
  const where: string[] = [];
  const params: Array<string | number> = [];
  if (selectedHos) {
    params.push(selectedHos);
    where.push(`s.hoscode = $${params.length}`);
  }
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";

  const [hosList, rows, meta] = await Promise.all([
    dbQuery<HosItem>(
      `select hoscode, hosname from public.c_hos order by hosname asc;`,
    ),
    dbQuery<Top10Row>(
      `
      select
        s.hoscode,
        h.hosname,
        s.icd10,
        s.icd10_name,
        s.total_refer
      from public.transform_sync_refer_top10 s
      left join public.c_hos h on h.hoscode = s.hoscode
      ${whereSql}
      order by s.total_refer desc, s.icd10 asc;
      `,
      params,
    ),
    dbQuery<{ row_count: number; last_update: string | null }>(
      `
      select
        (select count(*)::int from public.transform_sync_refer_top10 s ${whereSql}) as row_count,
        (select max(d_update)::text from public.transform_sync_refer_top10 s ${whereSql}) as last_update;
      `,
      params,
    ).then((r) => r[0]),
  ]);

  return (
    <MetricPage
      title="Top 10 สาเหตุ Refer (ICD10)"
      description="สรุป 10 อันดับแรกของรหัสโรค (ICD10) ที่ถูก Refer"
      showTopCards={false}
      contentWidth="wide"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <HosSelect hospitals={hosList} value={selectedHos} />
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
          Connected
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            อัปเดตเมื่อ: {meta?.last_update ?? "-"} • แถวทั้งหมด: {meta?.row_count ?? 0}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_refer_top10</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <table className="min-w-[920px] w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
              <tr>
                <Th className="sticky left-0 z-20 w-[72px] bg-white/95 dark:bg-zinc-950/95">ลำดับ</Th>
                <Th className="sticky left-[72px] z-20 w-[260px] bg-white/95 dark:bg-zinc-950/95">ชื่อ รพ.</Th>
                <Th className="w-[100px]">ICD10</Th>
                <Th>รายละเอียดโรค</Th>
                <Th className="w-[140px] text-right">จำนวน Refer</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.hoscode}-${r.icd10}-${idx}`}>
                  <Td className="sticky left-0 z-10 bg-white/95 text-right tabular-nums dark:bg-zinc-950/95">
                    {idx + 1}
                  </Td>
                  <Td className="sticky left-[72px] z-10 bg-white/95 dark:bg-zinc-950/95">
                    {r.hosname ? shortHosName(r.hosname) : r.hoscode}
                  </Td>
                  <Td className="font-mono">{r.icd10}</Td>
                  <Td className="min-w-[240px]">{r.icd10_name}</Td>
                  <Td className="text-right tabular-nums">{r.total_refer}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MetricPage>
  );
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
