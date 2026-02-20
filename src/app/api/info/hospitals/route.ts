import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type HospitalRow = {
  hoscode: string;
  hosname: string;
  hosname_short: string | null;
  sp_level: string | null;
  gps: string | null;
  amp_code: string | null;
  beds: number | null;
};

export async function GET() {
  const rows = await dbQuery<HospitalRow>(
    `SELECT hoscode, hosname, hosname_short, sp_level, gps, amp_code, beds
     FROM public.c_hos
     ORDER BY amp_code ASC NULLS LAST, hoscode ASC`,
  );

  return NextResponse.json({ hospitals: rows });
}
