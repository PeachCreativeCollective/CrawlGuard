import { Pool } from "pg";
import type { Pool as PgPool } from "pg";
import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";

declare const Netlify: undefined | { env?: { get(name: string): string | undefined } };

type DatabaseInstance = NeonDatabase<typeof schema>;

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
        parsed.searchParams.set("sslmode", "no-verify");
      }
    }

    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "no-verify");
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

  try {
    neonConfig.fetchConnectionCache = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[db] Unable to enable Neon fetch cache:", message);
  }

  try {
    const neonClient = neon(connectionString);
    database = drizzle(neonClient, { schema });

    neonClient`select 1`
      .then(() => {
        console.log("[db] Connection established");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[db] Connection test failed:", message);
      });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[db] Failed to initialize database client:", message);
    database = null;
  }

  try {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 60_000,
      ssl: {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      },
    });

    pool.query("select 1").catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[db] pg pool health check failed:", message);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[db] Failed to initialize pg pool:", message);
    pool = null;
  }

  return database !== null;
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
