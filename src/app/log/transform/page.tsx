"use client";

import { useEffect, useState } from "react";

type TransformLogRow = {
  id: number;
  transform_datetime: string | null;
  note: string | null;
};

export default function TransformLogPage() {
  const [rows, setRows] = useState<TransformLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/log/transform")
      .then((r) => r.json())
      .then((data) => setRows(data.rows ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Transform Log</h1>

      {loading && (
        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
      )}

      {error && (
        <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3 w-56">Transform Datetime</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{row.id}</td>
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                      {row.transform_datetime ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-800 whitespace-pre-wrap break-words max-w-xl">
                      {row.note ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            แสดง {rows.length} รายการ
          </div>
        </div>
      )}
    </div>
  );
}
