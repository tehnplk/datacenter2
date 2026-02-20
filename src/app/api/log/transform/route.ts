import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type TransformLogRow = {
  id: number;
  transform_datetime: string | null;
  note: string | null;
};

export async function GET() {
  const rows = await dbQuery<TransformLogRow>(
    `SELECT id,
            to_char(transform_datetime, 'YYYY-MM-DD HH24:MI:SS') AS transform_datetime,
            note
     FROM public.transform_log
     ORDER BY id DESC
     LIMIT 500`,
  );
  return NextResponse.json({ rows });
}
