import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import { dbQuery } from "@/lib/db";
import HospitalTabs, { type HospitalTabItem } from "@/components/dashboard/HospitalTabs";

export const dynamic = "force-dynamic";

type TopAdjrwRow = {
  hoscode: string;
  hosname: string | null;
  y: number;
  m: number;
  drgs_code: string;
  drgs_name: string | null;
  sum_adj_rw: number;
  rank: number;
};

type TopHosRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  total_adjrw: number;
};

type MetaRow = {
  row_count: number;
  last_update: string | null;
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

export default async function Page({
  searchParams,
}: {
  searchParams?:
    | { year?: string; hos?: string }
    | Promise<{ year?: string; hos?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});

  const years = await dbQuery<{ y: number }>(
    `select distinct y from public.transform_sync_drgs_rw_top10 order by y desc;`,
  ).then((r) => r.map((x) => x.y));

  const selectedYear =
    toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const selectedHosParam = sp.hos?.trim() || undefined;

  const [topHospitals, meta] = await Promise.all([
    dbQuery<TopHosRow>(
      `
      select
        h.hoscode,
        h.hosname,
        h.hosname_short,
        coalesce(sum(s.sum_adj_rw), 0)::float8 as total_adjrw
      from public.c_hos h
      left join public.transform_sync_drgs_rw_top10 s
        on s.hoscode = h.hoscode
       and s.y = $1
      group by h.hoscode, h.hosname, h.hosname_short
      order by total_adjrw desc, h.hosname asc nulls last;
      `,
      [selectedYear],
    ),
    dbQuery<MetaRow>(
      `
      select
        (select count(*)::int from public.transform_sync_drgs_rw_top10 s where s.y = $1) as row_count,
        (select max(d_update)::text from public.transform_sync_drgs_rw_top10 s where s.y = $1) as last_update;
      `,
      [selectedYear],
    ).then((r) => r[0]),
  ]);

  const tabs: HospitalTabItem[] = topHospitals.map((h) => ({
    value: h.hoscode,
    label: h.hosname_short ?? h.hosname ?? h.hoscode,
  }));

  const selectedHos =
    (selectedHosParam && tabs.some((t) => t.value === selectedHosParam)
      ? selectedHosParam
      : tabs[0]?.value) ?? "";

  const rows = selectedHos
    ? await dbQuery<TopAdjrwRow>(
        `
        select
          s.hoscode,
          h.hosname,
          s.y,
          s.m,
          s.drgs_code,
          d.drgname::text as drgs_name,
          s.sum_adj_rw::float8 as sum_adj_rw,
          row_number() over (
            partition by s.hoscode, s.y, s.m
            order by s.sum_adj_rw desc, s.drgs_code asc
          )::int as rank
        from public.transform_sync_drgs_rw_top10 s
        left join public.c_hos h on h.hoscode = s.hoscode
        left join public.c_drgs_63 d on d.drg = s.drgs_code
        where s.y = $1 and s.hoscode = $2
        order by s.m asc, rank asc;
        `,
        [selectedYear, selectedHos],
      )
    : [];

  const rowsByMonth = new Map<number, TopAdjrwRow[]>();
  for (const r of rows) {
    const list = rowsByMonth.get(r.m) ?? [];
    list.push(r);
    rowsByMonth.set(r.m, list);
  }

  return (
    <MetricPage
      title="RW/CMI: Top AdjRW"
      description="แสดงกลุ่มโรคที่มี AdjRW สูงสุด แยกรายเดือน (เลือก 1 ใน 9 โรงพยาบาลที่มี AdjRW รวมสูงสุดของปีที่เลือก)"
      showTopCards={false}
      contentWidth="wide"
      hideHeader
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <HospitalTabs items={tabs} value={selectedHos} paramName="hos" />
        <YearSelect years={years} value={selectedYear} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            ปี: {selectedYear} • อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_drgs_rw_top10</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          {tabs.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              ไม่พบข้อมูลโรงพยาบาล
            </div>
          ) : (
          <table className="min-w-[840px] w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
              <tr>
                <Th className="w-[72px] text-center">เดือน</Th>
                <Th className="w-[140px]">DRGs Code</Th>
                <Th className="min-w-[320px]">DRGs Name</Th>
                <Th className="w-[140px] text-right">AdjRW</Th>
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
                TH_MONTHS.map((label, idx) => {
                  const m = idx + 1;
                  const list = rowsByMonth.get(m) ?? [];
                  if (!list.length) return null;

                  return list.map((r, rowIdx) => (
                    <tr key={`${r.hoscode}-${r.y}-${m}-${r.drgs_code}-${rowIdx}`}>
                      {rowIdx === 0 ? (
                        <Td
                          className="text-center font-semibold text-zinc-700 dark:text-zinc-200"
                          rowSpan={list.length}
                        >
                          {label}
                        </Td>
                      ) : null}
                      <Td className="font-mono">{r.drgs_code}</Td>
                      <Td className={r.drgs_name ? "" : "text-zinc-400"}>
                        {r.drgs_name ?? "-"}
                      </Td>
                      <Td className="text-right tabular-nums">{fmtNumber(r.sum_adj_rw, 4)}</Td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
          )}
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
