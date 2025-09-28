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
      }
    }

    parsed.searchParams.set("sslmode", "no-verify");

    return parsed.toString();
  } catch {
    return url;
  }
}

let pool: PgPool | null = null;
let database: DatabaseInstance | null = null;
let initialized = false;

function resolveConnectionStrings(): string[] {
  const raw = readEnv("DATABASE_URL");
  if (!raw) {
    console.warn("[db] DATABASE_URL is not set. Falling back to in-memory storage");
    return [];
  }

  if (!/^postgres(ql)?:\/\//i.test(raw)) {
    console.warn('[db] DATABASE_URL is invalid. Expected a "postgres://" URI. Using in-memory storage');
    return [];
  }

  const trimmed = raw.trim();
  const prepared = prepareConnectionString(trimmed);
  const candidates: string[] = [];

  if (prepared && prepared.length > 0 && prepared !== trimmed) {
    candidates.push(prepared);
  }

  if (!candidates.includes(trimmed)) {
    candidates.push(trimmed);
  }

  return candidates;
}

function initializeDatabase(): boolean {
  if (initialized) {
    return database !== null;
  }

  const connectionCandidates = resolveConnectionStrings();
  if (connectionCandidates.length === 0) {
    pool = null;
    database = null;
    initialized = true;
    return false;
  }

  let fallbackTriggered = false;

  const attempt = (index: number): boolean => {
    if (index >= connectionCandidates.length) {
      return false;
    }

    const connectionString = connectionCandidates[index];

    try {
      const candidatePool = new Pool({
        connectionString,
        max: 10,
        ssl: {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined,
        },
      });

      const candidateDb = drizzle(candidatePool, { schema });

      candidatePool
        .query("select 1")
        .then(() => {
          console.log(`[db] Connection established (strategy ${index + 1}/${connectionCandidates.length})`);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[db] Connection test failed (strategy ${index + 1}):`, message);

          if (!fallbackTriggered && index + 1 < connectionCandidates.length) {
            fallbackTriggered = true;
            candidatePool.end().catch(() => {});
            pool = null;
            database = null;
            initialized = false;

            const fallbackSuccess = attempt(index + 1);
            if (!fallbackSuccess) {
              console.error("[db] All database connection attempts failed");
            }
          }
        });

      pool = candidatePool;
      database = candidateDb;
      initialized = true;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[db] Failed to initialize database (strategy ${index + 1}):`, message);
      return attempt(index + 1);
    }
  };

  const success = attempt(0);
  if (!success) {
    pool = null;
    database = null;
    initialized = true;
  }

  return success;
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
