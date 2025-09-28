import pkg from "pg";
import type { Pool as PgPool } from "pg";
const { Pool } = pkg;
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

declare const Netlify: undefined | { env?: { get(name: string): string | undefined } };

type DatabaseInstance = NodePgDatabase<typeof schema>;

type EnvAccessor = {
  get(name: string): string | undefined;
};

function readEnv(name: string): string {
  const netlifyEnv: EnvAccessor | undefined =
    typeof Netlify !== "undefined" ? Netlify?.env : undefined;
  const valueFromNetlify = netlifyEnv?.get?.(name);
  if (valueFromNetlify && valueFromNetlify !== "undefined") {
    return valueFromNetlify;
  }
  const valueFromProcess = process.env[name];
  return valueFromProcess ?? "";
}

function prepareConnectionString(url: string): string {
  try {
    const parsed = new URL(url);

    const sslMode = parsed.searchParams.get("sslmode");
    if (!sslMode || sslMode === "disable" || sslMode === "allow" || sslMode === "prefer") {
      parsed.searchParams.set("sslmode", "require");
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

let pool: PgPool | null = null;
let database: DatabaseInstance | null = null;
let initialized = false;

function resolveConnectionString(): string | null {
  const raw = readEnv("DATABASE_URL");
  if (!raw) {
    console.warn("[db] DATABASE_URL is not set. Falling back to in-memory storage");
    return null;
  }

  if (!/^postgres(ql)?:\/\//i.test(raw)) {
    console.warn('[db] DATABASE_URL is invalid. Expected a "postgres://" URI. Using in-memory storage');
    return null;
  }

  return prepareConnectionString(raw);
}

function initializeDatabase(): boolean {
  if (initialized) {
    return database !== null;
  }

  initialized = true;
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    return false;
  }

  pool = new Pool({
    connectionString,
    max: 10,
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
  });

  database = drizzle(pool, { schema });

  pool
    .query("select 1")
    .then(() => {
      console.log("[db] Connection established");
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[db] Connection test failed:", message);
    });

  return true;
}

export function ensureDatabase(): boolean {
  return initializeDatabase();
}

export function getPool(): PgPool | null {
  if (!initialized) {
    initializeDatabase();
  }
  return pool;
}

export function getDb(): DatabaseInstance | null {
  if (!initialized) {
    initializeDatabase();
  }
  return database;
}

export type { DatabaseInstance };
