import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export let pool: Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (hasDatabase) {
  // Supabase Postgres requires SSL in most environments
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    ssl: { rejectUnauthorized: false },
  });
  db = drizzle(pool, { schema });
} else {
  console.warn(
    'DATABASE_URL is not set. Using in-memory storage. Connect a database to enable persistence.'
  );
}
