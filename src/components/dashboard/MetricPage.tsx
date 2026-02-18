import * as React from "react";
import { FileText } from "lucide-react";

export type MetricPageProps = {
  title: string;
  description?: string;
  notes?: string[];
  children?: React.ReactNode;
  showTopCards?: boolean;
  contentWidth?: "normal" | "wide" | "full";
  titleClassName?: string;
  hideHeader?: boolean;
};

export default function MetricPage({
  title,
  description,
  notes,
  children,
  showTopCards = true,
  contentWidth = "normal",
  titleClassName,
  hideHeader = true,
}: MetricPageProps) {
  const widthClass =
    contentWidth === "full"
      ? "max-w-none"
      : contentWidth === "wide"
        ? "max-w-7xl"
        : "max-w-6xl";

  if (!children) {
    return (
      <div className={`mx-auto w-full ${widthClass} px-4 py-[2px] sm:px-6 sm:py-[2px]`}>
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-green-200 bg-green-50 text-sm font-medium text-green-600 shadow-sm dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          อยู่ระหว่างจัดเตรียมข้อมูล
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full ${widthClass} px-4 py-[2px] sm:px-6 sm:py-[2px]`}>
      {!hideHeader ? (
        <header className="mb-6">
          <h1
            className={`text-balance text-2xl font-semibold tracking-tight text-green-900 dark:text-green-50 sm:text-3xl ${
              titleClassName ?? ""
            }`}
          >
            {title}
          </h1>
          {description ? (
            <p className="my-[10px] inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-pretty text-sm font-medium text-green-700 shadow-sm dark:border-green-800 dark:bg-white/5 dark:text-green-200">
              <FileText className="h-5 w-5 shrink-0" />
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      {hideHeader && description ? (
        <p className="my-[10px] inline-flex max-w-3xl items-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-pretty text-sm font-medium text-green-700 shadow-sm dark:border-green-800 dark:bg-white/5 dark:text-green-200">
          <FileText className="h-5 w-5 shrink-0" />
          {description}
        </p>
      ) : null}

      {showTopCards ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm dark:border-green-800 dark:bg-green-950">
            <div className="text-xs font-medium text-green-600 dark:text-green-400">ตัวชี้วัด</div>
            <div className="mt-2 h-9 w-28 rounded-lg bg-green-100 dark:bg-green-800/40" />
            <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-green-100 to-white dark:from-green-800/30 dark:to-transparent" />
          </div>
          <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm dark:border-green-800 dark:bg-green-950">
            <div className="text-xs font-medium text-green-600 dark:text-green-400">แนวโน้ม</div>
            <div className="mt-2 h-9 w-36 rounded-lg bg-green-100 dark:bg-green-800/40" />
            <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-green-100 to-white dark:from-green-800/30 dark:to-transparent" />
          </div>
          <div className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm dark:border-green-800 dark:bg-green-950">
            <div className="text-xs font-medium text-green-600 dark:text-green-400">เปรียบเทียบ (ราย รพ.)</div>
            <div className="mt-2 h-9 w-40 rounded-lg bg-green-100 dark:bg-green-800/40" />
            <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-green-100 to-white dark:from-green-800/30 dark:to-transparent" />
          </div>
        </section>
      ) : null}

      <section className="mt-2 rounded-2xl border border-green-200 bg-white p-4 shadow-sm dark:border-green-800 dark:bg-green-950">
        {children}

        {notes?.length ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-green-700 dark:text-green-300">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
