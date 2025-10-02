import { getSupabaseServiceClient } from "./supabaseClient";
import { readEnv } from "./env";
import { findSupabaseUserByEmail, updateSupabasePassword } from "./supabaseAuthService";

export async function seedAdminFromEnv(): Promise<void> {
  const email = readEnv("ADMIN_EMAIL");
  const password = readEnv("ADMIN_PASSWORD");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!email || !password) {
    console.log("[seed] Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not configured");
    return;
  }

  if (!serviceRoleKey) {
    console.log("[seed] Skipping admin seed: SUPABASE_SERVICE_ROLE_KEY not configured");
    return;
  }

  try {
    const supabase = getSupabaseServiceClient();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await findSupabaseUserByEmail(supabase, normalizedEmail);

    if (!existingUser) {
      const createResult = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username: normalizedEmail.split("@")[0],
          isAdmin: true,
        },
        app_metadata: {
          roles: ["admin"],
        },
      });

      if (createResult.error) {
        throw new Error(createResult.error.message);
      }

      console.log("[seed] Admin user created in Supabase");
      return;
    }

    await updateSupabasePassword(normalizedEmail, password);
    console.log("[seed] Admin user password synchronized");
  } catch (error) {
    console.error("[seed] Failed to seed admin user:", error);
  }
}
