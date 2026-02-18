import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import CmiChartTabs from "@/components/dashboard/CmiChartTabs";
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

  const topHosChart = hosListSorted.slice(0, 9);
  const chartSeries = topHosChart.map((h) => ({
    key: h.hoscode,
    label: shortHosName(h.hosname),
  }));

  const buildChartRows = (
    valueFn: (row: DrgsSumRow | undefined) => number | null,
  ) =>
    TH_MONTHS.map((label, monthIndex) => {
      const row: Record<string, number | string | null> = { month: label };
      for (const h of topHosChart) {
        const byMonth = monthMap.get(h.hoscode);
        const r = byMonth?.get(monthIndex + 1);
        row[h.hoscode] = valueFn(r);
      }
      return row as { month: string } & Record<string, number | string | null>;
    });

  const chartDatasets = {
    cmi: buildChartRows((r) => r?.cmi ?? null),
    adjrw: buildChartRows((r) => (r?.sum_adjrw ?? null)),
    case: buildChartRows((r) => (r?.cases ?? null)),
  };

  const buildYearChartRows = (
    valueFn: (row: YearPivotRow | undefined) => number | null,
  ) =>
    yearsAsc.map((yy) => {
      const row: Record<string, number | string | null> = { year: String(yy) };
      for (const h of topHosChart) {
        const byYear = yearMap.get(h.hoscode);
        const r = byYear?.get(yy);
        row[h.hoscode] = valueFn(r);
      }
      return row as { year: string } & Record<string, number | string | null>;
    });

  const yearChartDatasets = {
    cmi: buildYearChartRows((r) => r?.cmi ?? null),
    adjrw: buildYearChartRows((r) => (r?.sum_adjrw ?? null)),
    case: buildYearChartRows((r) => (r?.cases ?? null)),
  };

  return (
    <MetricPage
      title="Case Mix Index (CMI) และ Sum adjRW ในภาพรวม และแยกตามหน่วยบริการ"
      description="Case Mix Index (CMI) และ Sum adjRW รายหน่วยบริการ"
      titleClassName="text-sm sm:text-sm"
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

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            {view === "year" ? (
              <>ปี: {yearsAsc[0] ?? "-"} - {yearsAsc.at(-1) ?? "-"}</>
            ) : (
              <>ปี: {selectedYear}</>
            )}
            {" "}• อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_drgs_sum</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          {view === "year" ? (
            <YearTable years={yearsAsc} hosList={hosListYearSorted} yearMap={yearMap} />
          ) : (
            <MonthTable hosList={hosListSorted} monthMap={monthMap} />
          )}
        </div>
      </div>

      {view === "month" ? (
        <div className="mt-6">
          <CmiChartTabs
            title={`แนวโน้มรายเดือน (ปี ${selectedYear})`}
            series={chartSeries}
            datasets={chartDatasets}
            xKey="month"
          />
        </div>
      ) : null}

      {view === "year" ? (
        <div className="mt-6">
          <CmiChartTabs
            title="แนวโน้มรายปี"
            series={chartSeries}
            datasets={yearChartDatasets}
            xKey="year"
          />
        </div>
      ) : null}
    </MetricPage>
  );
}

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function MonthTable({
  hosList,
  monthMap,
}: {
  hosList: HosRow[];
  monthMap: Map<string, Map<number, DrgsSumRow>>;
}) {
  return (
    <table className="min-w-[1500px] w-full border border-zinc-200 text-[10px] text-zinc-800 dark:border-zinc-800 dark:text-zinc-100">
      <thead className="bg-zinc-50 text-[9px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <tr>
          <th rowSpan={2} className="w-16 border border-zinc-200 px-3 py-2 text-right font-semibold dark:border-zinc-800">
            ลำดับ
          </th>
          <th
            rowSpan={2}
            className="border border-zinc-200 px-3 py-2 text-left font-semibold whitespace-nowrap dark:border-zinc-800"
          >
            ชื่อ รพ.
          </th>
          {TH_MONTHS.map((label) => (
            <th
              key={label}
              colSpan={3}
              className="border border-zinc-200 px-3 py-2 text-center font-semibold dark:border-zinc-800"
            >
              {label}
            </th>
          ))}
        </tr>
        <tr>
          {TH_MONTHS.map((label) => (
            <React.Fragment key={`${label}-meta`}>
              <th className="border border-zinc-200 px-2 py-1 text-right font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                Case
              </th>
              <th className="border border-zinc-200 px-2 py-1 text-right font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                adjRW
              </th>
              <th className="border border-zinc-200 px-2 py-1 text-right font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-100">
                CMI
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
              <td className="border border-zinc-200 px-3 py-2 text-right tabular-nums font-semibold dark:border-zinc-800">
                {idx + 1}
              </td>
              <td className="border border-zinc-200 px-3 py-2 font-medium whitespace-nowrap dark:border-zinc-800">
                {shortHosName(h.hosname)}
              </td>
              {TH_MONTHS.map((_, monthIndex) => {
                const m = monthIndex + 1;
                const r = byMonth?.get(m);
                return (
                  <React.Fragment key={`${h.hoscode}-${m}`}>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r ? fmtNumber(r.cases, 0) : "-"}
                    </td>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r ? fmtNumber(r.sum_adjrw, 4) : "-"}
                    </td>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r?.cmi != null ? fmtNumber(r.cmi, 4) : "-"}
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

function YearTable({
  years,
  hosList,
  yearMap,
}: {
  years: number[];
  hosList: HosRow[];
  yearMap: Map<string, Map<number, YearPivotRow>>;
}) {
  return (
    <table className="min-w-[1200px] w-full border border-zinc-200 text-[10px] text-zinc-800 dark:border-zinc-800 dark:text-zinc-100">
      <thead className="bg-zinc-50 text-[9px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <tr>
          <th rowSpan={2} className="w-16 border border-zinc-200 px-3 py-2 text-right font-semibold dark:border-zinc-800">
            ลำดับ
          </th>
          <th rowSpan={2} className="w-64 border border-zinc-200 px-3 py-2 text-left font-semibold dark:border-zinc-800">
            ชื่อ รพ.
          </th>
          {years.map((yy) => (
            <th
              key={yy}
              colSpan={3}
              className="border border-zinc-200 px-3 py-2 text-center font-semibold dark:border-zinc-800"
            >
              {yy}
            </th>
          ))}
        </tr>
        <tr>
          {years.map((yy) => (
            <React.Fragment key={`${yy}-meta`}>
              <th className="border border-zinc-200 px-2 py-1 text-right font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                Case
              </th>
              <th className="border border-zinc-200 px-2 py-1 text-right font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                adjRW
              </th>
              <th className="border border-zinc-200 px-2 py-1 text-right font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-100">
                CMI
              </th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {hosList.map((h, idx) => {
          const byYear = yearMap.get(h.hoscode);
          return (
            <tr
              key={h.hoscode}
              className="odd:bg-white even:bg-zinc-50/60 dark:odd:bg-zinc-950 dark:even:bg-zinc-900"
            >
              <td className="border border-zinc-200 px-3 py-2 text-right tabular-nums font-semibold dark:border-zinc-800">
                {idx + 1}
              </td>
              <td className="border border-zinc-200 px-3 py-2 font-medium dark:border-zinc-800">
                <span className="block max-w-[240px] truncate" title={h.hosname}>
                  {shortHosName(h.hosname)}
                </span>
              </td>
              {years.map((yy) => {
                const r = byYear?.get(yy);
                return (
                  <React.Fragment key={`${h.hoscode}-${yy}`}>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r ? fmtNumber(r.cases, 0) : "-"}
                    </td>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r ? fmtNumber(r.sum_adjrw, 4) : "-"}
                    </td>
                    <td className="border border-zinc-200 px-2 py-2 text-right tabular-nums dark:border-zinc-800">
                      {r?.cmi != null ? fmtNumber(r.cmi, 4) : "-"}
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
