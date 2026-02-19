import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type HospitalRow = {
  hoscode: string;
  hosname: string;
  sp_level: string | null;
  gps: string | null;
};

export async function GET() {
  const rows = await dbQuery<HospitalRow>(
    `SELECT hoscode, hosname, sp_level, gps
     FROM public.c_hos
     WHERE gps IS NOT NULL
     ORDER BY hoscode ASC`,
  );

  return NextResponse.json({ hospitals: rows });
}
