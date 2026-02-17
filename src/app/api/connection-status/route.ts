import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type ConnectionRow = {
  hoscode: string | null;
  version: string | null;
  d_update: string | null;
};

export async function GET() {
  const rawRows = await dbQuery<ConnectionRow>(
    `
    select
      hoscode,
      version,
      d_update::text as d_update
    from public.transform_sync_test
    order by hoscode asc nulls last;
    `,
  );

  return NextResponse.json({
    rows: rawRows.map((row) => ({
      hos: row.hoscode,
      sync_version: row.version,
      connected_at: row.d_update,
      status: row.version ? "online" : null,
    })),
  });
}
