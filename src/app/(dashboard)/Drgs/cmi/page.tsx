import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import ViewTabs from "@/components/dashboard/ViewTabs";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type DrgsSumRow = {
  hoscode: string;
  hosname: string | null;
  y: number;
  m: number;
  cases: number;
  sum_adjrw: number;
  cmi: number | null;
};

type HosRow = {
  hoscode: string;
  hosname: string;
};

type YearSummaryRow = {
  hoscode: string;
  hosname: string;
  cases: number;
  sum_adjrw: number;
  cmi: number | null;
};

type YearPivotRow = {
  hoscode: string;
  hosname: string;
  y: number | null;
  cases: number;
  sum_adjrw: number;
  cmi: number | null;
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

const SUBCOL_W_CASE = "w-[72px] min-w-[72px]";
const SUBCOL_W_RW = "w-[96px] min-w-[96px]";
const SUBCOL_W_CMI = "w-[72px] min-w-[72px]";

function monthShade(monthIndex: number) {
  return monthIndex % 2 === 0
    ? "bg-zinc-50/70 dark:bg-white/5"
    : "bg-white dark:bg-zinc-950";
}

function fmtNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function shortHosName(name: string) {
  const raw = name.trim();

  // Special cases (จังหวัดพิษณุโลก)
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";

  // Common prefix in source data: "โรงพยาบาล..." → display as "รพ...."
  return raw.replace(/^โรงพยาบาล\s*/u, "รพ.");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { year?: string; view?: string } | Promise<{ year?: string; view?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});

  const years = await dbQuery<{ y: number }>(
    `select distinct y from public.transform_sync_drgs_sum order by y desc;`,
  ).then((r) => r.map((x) => x.y));

  const selectedYear =
    toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const view = sp.view === "year" ? "year" : "month";

  const yearsAsc = [...years].sort((a, b) => a - b);

  const [hosList, rows, yearSummary, yearPivot, meta] = await Promise.all([
    dbQuery<HosRow>(
      `select hoscode, hosname from public.c_hos order by hosname asc;`,
    ),
    dbQuery<DrgsSumRow>(
      `
      select
        s.hoscode,
        h.hosname,
        s.y,
        s.m,
        sum(s.num_pt)::int as cases,
        sum(s.sum_adjrw)::float8 as sum_adjrw,
        case when sum(s.num_pt) > 0 then (sum(s.sum_adjrw) / sum(s.num_pt))::float8 else null end as cmi
      from public.transform_sync_drgs_sum s
      left join public.c_hos h on h.hoscode = s.hoscode
      where s.y = $1
      group by s.hoscode, h.hosname, s.y, s.m
      order by h.hosname asc nulls last, s.hoscode asc, s.m asc;
      `,
      [selectedYear],
    ),
    dbQuery<YearSummaryRow>(
      `
      select
        h.hoscode,
        h.hosname,
        coalesce(sum(s.num_pt), 0)::int as cases,
        coalesce(sum(s.sum_adjrw), 0)::float8 as sum_adjrw,
        case when sum(s.num_pt) > 0 then (sum(s.sum_adjrw) / sum(s.num_pt))::float8 else null end as cmi
      from public.c_hos h
      left join public.transform_sync_drgs_sum s
        on s.hoscode = h.hoscode
       and s.y = $1
      group by h.hoscode, h.hosname
      order by h.hosname asc;
      `,
      [selectedYear],
    ),
    dbQuery<YearPivotRow>(
      `
      select
        h.hoscode,
        h.hosname,
        s.y,
        coalesce(sum(s.num_pt), 0)::int as cases,
        coalesce(sum(s.sum_adjrw), 0)::float8 as sum_adjrw,
        case when sum(s.num_pt) > 0 then (sum(s.sum_adjrw) / sum(s.num_pt))::float8 else null end as cmi
      from public.c_hos h
      left join public.transform_sync_drgs_sum s
        on s.hoscode = h.hoscode
      group by h.hoscode, h.hosname, s.y
      order by h.hosname asc, s.y asc;
      `,
    ),
    dbQuery<{
      row_count_selected: number;
      row_count_all: number;
      last_update: string | null;
    }>(
      `
      select
        (select count(*)::int from public.transform_sync_drgs_sum where y = $1) as row_count_selected,
        (select count(*)::int from public.transform_sync_drgs_sum) as row_count_all,
        (select max(d_update)::text from public.transform_sync_drgs_sum) as last_update;
      `,
      [selectedYear],
    ).then((r) => r[0]),
  ]);

  const monthMap = new Map<string, Map<number, DrgsSumRow>>();
  for (const r of rows) {
    const m = monthMap.get(r.hoscode) ?? new Map<number, DrgsSumRow>();
    m.set(r.m, r);
    monthMap.set(r.hoscode, m);
  }

  const casesByHos = new Map<string, number>();
  for (const r of yearSummary) casesByHos.set(r.hoscode, r.cases);

  const hosListSorted = [...hosList].sort((a, b) => {
    const ac = casesByHos.get(a.hoscode) ?? 0;
    const bc = casesByHos.get(b.hoscode) ?? 0;

    const aHas = ac > 0;
    const bHas = bc > 0;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (aHas && bHas && ac !== bc) return bc - ac;
    return a.hosname.localeCompare(b.hosname, "th");
  });

  const yearMap = new Map<string, Map<number, YearPivotRow>>();
  for (const r of yearPivot) {
    if (r.y == null) continue;
    const m = yearMap.get(r.hoscode) ?? new Map<number, YearPivotRow>();
    m.set(r.y, r);
    yearMap.set(r.hoscode, m);
  }

  const totalCasesAllYears = new Map<string, number>();
  for (const r of yearPivot) {
    if (r.y == null) continue;
    totalCasesAllYears.set(
      r.hoscode,
      (totalCasesAllYears.get(r.hoscode) ?? 0) + (r.cases ?? 0),
    );
  }

  const hosListYearSorted = [...hosList].sort((a, b) => {
    const ac = totalCasesAllYears.get(a.hoscode) ?? 0;
    const bc = totalCasesAllYears.get(b.hoscode) ?? 0;
    const aHas = ac > 0;
    const bHas = bc > 0;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (aHas && bHas && ac !== bc) return bc - ac;
    return a.hosname.localeCompare(b.hosname, "th");
  });

  const yearSummarySorted = [...yearSummary].sort((a, b) => {
    const aHas = a.cases > 0;
    const bHas = b.cases > 0;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (aHas && bHas && a.cases !== b.cases) return b.cases - a.cases;
    return a.hosname.localeCompare(b.hosname, "th");
  });

  return (
    <MetricPage
      title="Case Mix Index (CMI) และ Sum adjRW ในภาพรวม และแยกตามหน่วยบริการ"
      titleClassName="text-[20px] sm:text-[26px]"
      showTopCards={false}
      contentWidth="full"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
          <ViewTabs
            value={view}
            tabs={[
              { value: "month", label: "รายเดือน" },
              { value: "year", label: "ภาพรวม ปี" },
            ]}
          />
          {view === "month" ? <YearSelect years={years} value={selectedYear} /> : null}
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
            Connected
          </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            {view === "year" ? (
              <>ปี: {yearsAsc[0] ?? "-"} - {yearsAsc.at(-1) ?? "-"}</>
            ) : (
              <>ปี: {selectedYear}</>
            )}
            {" "}• อัปเดตเมื่อ: {meta?.last_update ?? "-"} • แถวทั้งหมด: {view === "year" ? (meta?.row_count_all ?? 0) : (meta?.row_count_selected ?? 0)}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_drgs_sum</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          {view === "year" ? (
            <table className="min-w-[1200px] w-full border-separate border-spacing-0 text-xs">
              <colgroup>
                <col style={{ width: 72 }} />
                <col style={{ width: 260 }} />
                {yearsAsc.map((_, i) => (
                  <React.Fragment key={i}>
                    <col style={{ width: 72 }} />
                    <col style={{ width: 96 }} />
                    <col style={{ width: 72 }} />
                  </React.Fragment>
                ))}
              </colgroup>

              <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
                <tr>
                  <Th className="sticky left-0 z-20 w-[72px] bg-white/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    ลำดับ
                  </Th>
                  <Th className="sticky left-[72px] z-20 w-[260px] bg-white/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    ชื่อ รพ.
                  </Th>

                  {yearsAsc.map((yy, yearIndex) => (
                    <Th
                      key={yy}
                      className={`whitespace-nowrap border-l border-zinc-200/70 p-0 text-center dark:border-white/10 ${monthShade(yearIndex)}`}
                      colSpan={3}
                    >
                      <div className="px-3 py-2 text-center">{yy}</div>
                    </Th>
                  ))}
                </tr>

                <tr>
                  <Th className="sticky left-0 z-20 bg-white/95 dark:bg-zinc-950/95" />
                  <Th className="sticky left-[72px] z-20 bg-white/95 dark:bg-zinc-950/95" />
                  {yearsAsc.map((yy, yearIndex) => (
                    <MonthCols key={yy} monthIndex={yearIndex} />
                  ))}
                </tr>
              </thead>

              <tbody>
                {hosListYearSorted.map((h, idx) => {
                  const byYear = yearMap.get(h.hoscode);
                  return (
                    <tr key={h.hoscode}>
                      <Td className="sticky left-0 z-10 bg-white/95 text-right tabular-nums shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        {idx + 1}
                      </Td>
                      <Td className="sticky left-[72px] z-10 bg-white/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        <span
                          className="block max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap"
                          title={h.hosname}
                        >
                          {shortHosName(h.hosname)}
                        </span>
                      </Td>

                      {yearsAsc.map((yy, yearIndex) => {
                        const r = byYear?.get(yy);
                        const bg = monthShade(yearIndex);
                        return (
                          <React.Fragment key={`${h.hoscode}-${yy}`}>
                            <Td
                              className={`border-l border-zinc-100 text-right tabular-nums dark:border-white/5 ${bg} ${SUBCOL_W_CASE}`}
                            >
                              {r ? fmtNumber(r.cases, 0) : "-"}
                            </Td>
                            <Td className={`text-right tabular-nums ${bg} ${SUBCOL_W_RW}`}>
                              {r ? fmtNumber(r.sum_adjrw, 4) : "-"}
                            </Td>
                            <Td className={`text-right tabular-nums ${bg} ${SUBCOL_W_CMI}`}>
                              {r?.cmi != null ? fmtNumber(r.cmi, 4) : "-"}
                            </Td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="min-w-[1500px] w-full border-separate border-spacing-0 text-xs">
              <colgroup>
                <col style={{ width: 72 }} />
                <col style={{ width: 260 }} />
                {TH_MONTHS.map((_, i) => (
                  <React.Fragment key={i}>
                    <col style={{ width: 72 }} />
                    <col style={{ width: 96 }} />
                    <col style={{ width: 72 }} />
                  </React.Fragment>
                ))}
              </colgroup>

              <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
                <tr>
                  <Th className="sticky left-0 z-20 w-[72px] bg-white/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    ลำดับ
                  </Th>
                  <Th className="sticky left-[72px] z-20 w-[260px] bg-white/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    ชื่อ รพ.
                  </Th>
                  {TH_MONTHS.map((mm, monthIndex) => (
                    <Th
                      key={mm}
                      className={`whitespace-nowrap border-l border-zinc-200/70 p-0 text-center dark:border-white/10 ${monthShade(monthIndex)}`}
                      colSpan={3}
                    >
                      <div className="px-3 py-2 text-center">
                        {mm}
                      </div>
                    </Th>
                  ))}
                </tr>
                <tr>
                  <Th className="sticky left-0 z-20 bg-white/95 dark:bg-zinc-950/95" />
                  <Th className="sticky left-[72px] z-20 bg-white/95 dark:bg-zinc-950/95" />
                  {TH_MONTHS.map((mm, monthIndex) => (
                    <MonthCols key={mm} monthIndex={monthIndex} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {hosListSorted.map((h, idx) => {
                  const byMonth = monthMap.get(h.hoscode);
                  return (
                    <tr key={h.hoscode}>
                      <Td className="sticky left-0 z-10 bg-white/95 text-right tabular-nums shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        {idx + 1}
                      </Td>
                      <Td className="sticky left-[72px] z-10 bg-white/95 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950/95 dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        <span className="block max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap" title={h.hosname}>
                          {shortHosName(h.hosname)}
                        </span>
                      </Td>
                      {TH_MONTHS.map((_, monthIndex) => {
                        const m = monthIndex + 1;
                        const r = byMonth?.get(m);
                        const bg = monthShade(monthIndex);
                        return (
                          <React.Fragment key={`${h.hoscode}-${m}`}>
                            <Td
                              className={`border-l border-zinc-100 text-right tabular-nums dark:border-white/5 ${bg} ${SUBCOL_W_CASE}`}
                            >
                              {r ? fmtNumber(r.cases, 0) : "-"}
                            </Td>
                            <Td className={`text-right tabular-nums ${bg} ${SUBCOL_W_RW}`}>
                              {r ? fmtNumber(r.sum_adjrw, 4) : "-"}
                            </Td>
                            <Td className={`text-right tabular-nums ${bg} ${SUBCOL_W_CMI}`}>
                              {r?.cmi != null ? fmtNumber(r.cmi, 4) : "-"}
                            </Td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
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

function MonthCols({ monthIndex }: { monthIndex: number }) {
  const bg = monthShade(monthIndex);
  return (
    <React.Fragment>
      <Th
        className={`border-l border-zinc-200/70 text-right dark:border-white/10 ${bg} ${SUBCOL_W_CASE}`}
      >
        Case
      </Th>
      <Th className={`text-right ${bg} ${SUBCOL_W_RW}`}>adjRW</Th>
      <Th className={`text-right ${bg} ${SUBCOL_W_CMI}`}>CMI</Th>
    </React.Fragment>
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
