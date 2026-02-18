import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type ConnectionRow = {
  hoscode: string | null;
  hosname: string | null;
  version: string | null;
  d_update: string | null;
};

export async function GET() {
  const rawRows = await dbQuery<ConnectionRow>(
    `
    select
      t.hoscode,
      h.hosname,
      t.version,
      t.d_update::text as d_update
    from public.transform_sync_test t
    left join public.c_hos h on h.hoscode = t.hoscode
    order by t.hoscode asc nulls last;
    `,
  );

  return NextResponse.json({
    rows: rawRows.map((row) => ({
      hos: row.hoscode,
      hosname: row.hosname,
      sync_version: row.version,
      connected_at: row.d_update,
      status: row.version ? "online" : null,
    })),
  });
}
