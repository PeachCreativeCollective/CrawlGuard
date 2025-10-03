import { createClient, type SupabaseClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import { readEnv, requireEnv } from "./env";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, fetch as undiciFetch } from "undici";

let serviceClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

let cachedFetch: typeof globalThis.fetch | null = null;
let fetchUsesCustomCa = false;

const ISRG_ROOT_X1_CERT = `-----BEGIN CERTIFICATE-----
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
RA4H
-----END CERTIFICATE-----`;

function normalizeMultiline(value: string): string {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function readCertificateFromPath(path: string, logOnError: boolean): string | null {
  try {
    let resolvedPath = path;
    if (path.startsWith("file://")) {
      resolvedPath = fileURLToPath(path as unknown as URL);
    } else if (!isAbsolute(path)) {
      resolvedPath = resolve(process.cwd(), path);
    }

    if (!existsSync(resolvedPath)) {
      if (logOnError) {
        console.warn("[tls] CA certificate file not found", { path: resolvedPath });
      }
      return null;
    }

    const content = readFileSync(resolvedPath, "utf8");
    console.log("[tls] Loaded CA certificate from file", { path: resolvedPath });
    return content;
  } catch (error) {
    if (logOnError) {
      console.error("[tls] Failed to read CA certificate", {
        path,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  }
}

function loadCaCertificate(): string {
  const direct = readEnv("SUPABASE_CA_CERT");
  if (direct) {
    console.log("[tls] Using CA certificate from SUPABASE_CA_CERT environment variable");
    return normalizeMultiline(direct);
  }

  const moduleDir = fileURLToPath(new URL(".", import.meta.url));
  const defaultCandidate = resolve(moduleDir, "../certs/isrg-root-x1.pem");
  const workingDirCandidate = resolve(process.cwd(), "certs/isrg-root-x1.pem");

  const candidates: Array<{ path: string; logOnError: boolean }> = [];
  const explicitPath = readEnv("SUPABASE_CA_CERT_PATH") ?? readEnv("NODE_EXTRA_CA_CERTS");
  if (explicitPath) {
    candidates.push({ path: explicitPath, logOnError: true });
  }
  candidates.push({ path: defaultCandidate, logOnError: false });
  candidates.push({ path: workingDirCandidate, logOnError: false });

  for (const candidate of candidates) {
    const content = readCertificateFromPath(candidate.path, candidate.logOnError);
    if (content) {
      return content;
    }
  }

  console.log("[tls] Falling back to built-in ISRG Root X1 certificate");
  return ISRG_ROOT_X1_CERT;
}

function getSupabaseFetch(): typeof globalThis.fetch {
  if (cachedFetch) {
    return cachedFetch;
  }

  try {
    const certificate = loadCaCertificate();
    if (certificate) {
      const dispatcher = new Agent({ connect: { ca: certificate } });
      const fetchWithAgent = ((
        input: Parameters<typeof undiciFetch>[0],
        init?: Parameters<typeof undiciFetch>[1],
      ) => {
        const nextInit = init ? { ...init, dispatcher } : { dispatcher };
        return undiciFetch(input, nextInit);
      }) as typeof globalThis.fetch;
      cachedFetch = fetchWithAgent;
      fetchUsesCustomCa = true;
      console.log("[tls] Custom fetch configured with additional CA trust store");
      return cachedFetch;
    }
  } catch (error) {
    console.error("[tls] Failed to configure custom CA for Supabase", error);
  }

  cachedFetch = globalThis.fetch.bind(globalThis);
  fetchUsesCustomCa = false;
  return cachedFetch;
}

function buildClientOptions(): SupabaseClientOptions<any, "public", any> {
  const options: SupabaseClientOptions<any, "public", any> = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  const fetchImpl = getSupabaseFetch();
  if (fetchUsesCustomCa) {
    options.global = {
      fetch: fetchImpl,
    };
  }

  return options;
}

function resolveSupabaseUrl(): string {
  const direct = readEnv("SUPABASE_URL");
  if (direct) {
    return direct;
  }

  const fromVite = readEnv("VITE_SUPABASE_URL");
  if (fromVite) {
    return fromVite;
  }

  throw new Error(
    "Supabase authentication requires SUPABASE_URL or VITE_SUPABASE_URL to be configured",
  );
}

function resolveAuthKey(): string {
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  const anonKey = readEnv("SUPABASE_ANON_KEY") ?? readEnv("VITE_SUPABASE_ANON_KEY");
  if (anonKey) {
    return anonKey;
  }

  throw new Error(
    "Supabase authentication requires SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY to be configured",
  );
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const url = resolveSupabaseUrl();
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  serviceClient = createClient(url, key, buildClientOptions());

  return serviceClient;
}

export function getSupabaseAuthClient(): SupabaseClient {
  if (authClient) {
    return authClient;
  }

  const url = resolveSupabaseUrl();
  const key = resolveAuthKey();

  authClient = createClient(url, key, buildClientOptions());

  return authClient;
}
