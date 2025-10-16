import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getRuntimeConfig(): Record<string, string | null> | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any).__RUNTIME_CONFIG as Record<string, string | null> | undefined;
}

let supabaseClient: SupabaseClient | null = null;

function resolveSupabaseVars(): { url: string | null; anonKey: string | null } {
  const urlFromBuild = import.meta.env.VITE_SUPABASE_URL ?? null;
  const anonFromBuild = import.meta.env.VITE_SUPABASE_ANON_KEY ?? null;
  if (urlFromBuild || anonFromBuild) {
    return { url: urlFromBuild, anonKey: anonFromBuild };
  }
  const runtime = getRuntimeConfig();
  return {
    url: runtime?.VITE_SUPABASE_URL ?? null,
    anonKey: runtime?.VITE_SUPABASE_ANON_KEY ?? null,
  };
}

function initSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const { url, anonKey } = resolveSupabaseVars();
  if (url && anonKey) {
    supabaseClient = createClient(url, anonKey);
    return supabaseClient;
  }
  return null;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(initSupabaseClient());
}

export function getSupabaseClient(): SupabaseClient {
  const client = initSupabaseClient();
  if (!client) {
    throw new Error("Supabase credentials are not configured");
  }
  return client;
}
