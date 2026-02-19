"use client";

import { useRouter } from "next/navigation";

export default function HosFilter({
  table,
  hospitals,
  selectedHos,
}: {
  table: string;
  hospitals: { hoscode: string }[];
  selectedHos: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const hos = e.target.value;
    const url = `/admin?table=${table}${hos ? `&hos=${hos}` : ""}`;
    router.push(url);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedHos}
        onChange={handleChange}
        className="cursor-pointer rounded-lg border border-green-200 bg-white px-3 py-1 text-xs text-green-900 shadow-sm focus:outline-none dark:border-green-700 dark:bg-green-900 dark:text-green-100"
      >
        <option value="">ทุก รพ.</option>
        {hospitals.map((h) => (
          <option key={h.hoscode} value={h.hoscode}>
            {h.hoscode}
          </option>
        ))}
      </select>
      {selectedHos && (
        <a
          href={`/admin?table=${table}`}
          className="cursor-pointer rounded-lg border border-green-200 bg-white px-3 py-1 text-xs text-green-700 hover:bg-green-50 dark:border-green-700 dark:bg-green-900 dark:text-green-200"
        >
          ล้าง
        </a>
      )}
    </div>
  );
}
