import MetricPage from "@/components/dashboard/MetricPage";
import HospitalTabs, { type HospitalTabItem } from "@/components/dashboard/HospitalTabs";
import { dbQuery } from "@/lib/db";
import * as React from "react";

export const dynamic = "force-dynamic";

type Top10Row = {
  hoscode: string;
  hosname: string | null;
  icd10: string;
  icd10_name: string;
  total_refer: number;
};

type TopHosRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  total_refer: number;
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

export default async function Page({
  searchParams,
}: {
  searchParams?: { hos?: string } | Promise<{ hos?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const selectedHosParam = sp.hos?.trim() || undefined;

  const [allHospitals, meta] = await Promise.all([
    dbQuery<TopHosRow>(
      `
      select
        h.hoscode,
        h.hosname,
        h.hosname_short,
        coalesce(sum(s.total_refer), 0)::int as total_refer
      from public.c_hos h
      left join public.transform_sync_refer_top10 s on s.hoscode = h.hoscode
      group by h.hoscode, h.hosname, h.hosname_short
      order by total_refer desc, h.hosname asc nulls last;
      `,
    ),
    dbQuery<{ last_update: string | null }>(
      `select max(d_update)::text as last_update from public.transform_sync_refer_top10;`,
    ).then((r) => r[0]),
  ]);

  const tabs: HospitalTabItem[] = allHospitals.map((h) => ({
    value: h.hoscode,
    label: displayHosName(h.hosname, h.hosname_short),
  }));

  const selectedHos =
    (selectedHosParam && tabs.some((t) => t.value === selectedHosParam)
      ? selectedHosParam
      : tabs[0]?.value) ?? "";

  const rows = selectedHos
    ? await dbQuery<Top10Row>(
        `
        select
          s.hoscode,
          h.hosname,
          s.icd10,
          s.icd10_name,
          s.total_refer
        from public.transform_sync_refer_top10 s
        left join public.c_hos h on h.hoscode = s.hoscode
        where s.hoscode = $1
        order by s.total_refer desc, s.icd10 asc;
        `,
        [selectedHos],
      )
    : [];

  return (
    <MetricPage
      title="Top 10 สาเหตุ Refer (ICD10)"
      description="สรุป 10 อันดับแรกของรหัสโรค (ICD10) ที่ถูก Refer แยกตามโรงพยาบาล"
      showTopCards={false}
      contentWidth="wide"
      hideHeader
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <HospitalTabs items={tabs} value={selectedHos} paramName="hos" />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          {tabs.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              ไม่พบข้อมูลโรงพยาบาล
            </div>
          ) : (
            <table className="w-full max-w-3xl border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
                <tr>
                  <Th className="w-[56px] text-center">ลำดับ</Th>
                  <Th className="w-[120px]">ICD10</Th>
                  <Th>รายละเอียดโรค</Th>
                  <Th className="w-[140px] text-right font-semibold text-zinc-700 dark:text-zinc-100">จำนวน Refer</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <Td className="py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={4}>
                      ไม่พบข้อมูล
                    </Td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={`${r.hoscode}-${r.icd10}-${idx}`}>
                      <Td className="text-center tabular-nums font-semibold text-zinc-700 dark:text-zinc-200">
                        {idx + 1}
                      </Td>
                      <Td className="font-mono">{r.icd10}</Td>
                      <Td>{r.icd10_name}</Td>
                      <Td className="text-right tabular-nums font-semibold">{r.total_refer}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-zinc-200/70 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
          ข้อมูลจากตาราง: <span className="font-mono">transform_sync_refer_top10</span>
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
