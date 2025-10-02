import { ensureSupabaseAdmin } from "./supabaseAuthService";

export async function seedAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  await ensureSupabaseAdmin(email, password);
}
