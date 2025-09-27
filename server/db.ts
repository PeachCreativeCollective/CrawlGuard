import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

const rawDbUrl = process.env.DATABASE_URL || "";
const isValidDbUrl = /^postgres(ql)?:\/\//i.test(rawDbUrl);
export const hasDatabase = Boolean(rawDbUrl) && isValidDbUrl;

function prepareConnectionString(url: string): string {
  try {
    const parsed = new URL(url);

    // Ensure Supabase pooler connections include project routing
    if (parsed.hostname.includes("pooler.supabase.com")) {
      const username = parsed.username || "";
      const segments = username.split(".");
      const role = segments[0] ?? username;
      const projectRef = segments.length > 1 ? segments[segments.length - 1] : undefined;

      if (projectRef) {
        parsed.hostname = `db.${projectRef}.supabase.co`;
        parsed.port = "5432";
        parsed.username = role;
        parsed.search = "";
        parsed.searchParams.set("sslmode", "require");
      }
    }

    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export let pool: Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (hasDatabase) {
  if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  const connectionString = prepareConnectionString(rawDbUrl);

  // Supabase Postgres requires SSL in most environments
  pool = new Pool({
    connectionString,
    max: 10,
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
  });
  db = drizzle(pool, { schema });
  // Test connection once at startup for clearer diagnostics
  pool.query('select 1').then(() => {
    console.log('Database connection OK');
  }).catch((err) => {
    console.error('Database connection failed:', err?.message || err);
  });
} else {
  const reason = rawDbUrl
    ? 'DATABASE_URL is invalid. Expected a postgres://… URI. Falling back to in-memory storage.'
    : 'DATABASE_URL is not set. Using in-memory storage. Connect a database to enable persistence.';
  console.warn(reason);
}
