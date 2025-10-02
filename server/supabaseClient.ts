import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readEnv, requireEnv } from "./env";

let serviceClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
} as const;

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

  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  serviceClient = createClient(url, key, clientOptions);

  return serviceClient;
}

export function getSupabaseAuthClient(): SupabaseClient {
  if (authClient) {
    return authClient;
  }

  const url = requireEnv("SUPABASE_URL");
  const key = resolveAuthKey();

  authClient = createClient(url, key, clientOptions);

  return authClient;
}
