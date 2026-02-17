import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Create .env.local and set DATABASE_URL (e.g. postgres://admin:password@localhost:5433/datacenter).",
  );
}

export const pgPool = global.__pgPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") global.__pgPool = pgPool;

export async function dbQuery<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pgPool.query<T>(text, params);
  return res.rows;
}
