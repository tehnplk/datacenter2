import * as React from "react";

export type MetricPageProps = {
  title: string;
  description?: string;
  notes?: string[];
  children?: React.ReactNode;
  showTopCards?: boolean;
  contentWidth?: "normal" | "wide" | "full";
  titleClassName?: string;
};

export default function MetricPage({
  title,
  description,
  notes,
  children,
  showTopCards = true,
  contentWidth = "normal",
  titleClassName,
}: MetricPageProps) {
  const widthClass =
    contentWidth === "full"
      ? "max-w-none"
      : contentWidth === "wide"
        ? "max-w-7xl"
        : "max-w-6xl";

  return (
    <div className={`mx-auto w-full ${widthClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <h1
          className={`text-balance text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl ${
            titleClassName ?? ""
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-pretty text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {description}
          </p>
        ) : null}
      </header>

      {showTopCards ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">ตัวชี้วัด</div>
            <div className="mt-2 h-9 w-28 rounded-lg bg-zinc-100 dark:bg-white/10" />
            <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-zinc-100 to-white dark:from-white/10 dark:to-transparent" />
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">แนวโน้ม</div>
            <div className="mt-2 h-9 w-36 rounded-lg bg-zinc-100 dark:bg-white/10" />
            <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-zinc-100 to-white dark:from-white/10 dark:to-transparent" />
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">เปรียบเทียบ (ราย รพ.)</div>
            <div className="mt-2 h-9 w-40 rounded-lg bg-zinc-100 dark:bg-white/10" />
            <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-zinc-100 to-white dark:from-white/10 dark:to-transparent" />
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        {children ? (
          children
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                พื้นที่แสดงผล (Placeholder)
              </h2>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                รอเชื่อมข้อมูล
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="h-64 rounded-xl bg-zinc-50 ring-1 ring-zinc-200/70 dark:bg-white/5 dark:ring-white/10" />
              </div>
              <div className="lg:col-span-4">
                <div className="h-64 rounded-xl bg-zinc-50 ring-1 ring-zinc-200/70 dark:bg-white/5 dark:ring-white/10" />
              </div>
            </div>
          </>
        )}

        {notes?.length ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
