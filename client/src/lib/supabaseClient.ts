import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getRuntimeConfig(): Record<string, string | null> | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any).__RUNTIME_CONFIG as Record<string, string | null> | undefined;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? getRuntimeConfig()?.VITE_SUPABASE_URL ?? null;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? getRuntimeConfig()?.VITE_SUPABASE_ANON_KEY ?? null;

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    "Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication."
  );
}

export function hasSupabaseConfig(): boolean {
  return Boolean(supabaseClient);
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error("Supabase credentials are not configured");
  }
  return supabaseClient;
}
