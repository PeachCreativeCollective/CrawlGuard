try {
  const hasServiceRole = Boolean(readEnv("SUPABASE_SERVICE_ROLE_KEY"));
  if (!hasServiceRole) {
    log("admin seed skipped: Supabase service role not configured");
  } else {
    let canSeed = true;
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`admin seed skipped: unable to reach Supabase admin API (${message})`);
      canSeed = false;
    }

    if (canSeed) {
      const { seedAdminFromEnv } = await import("./seed");
      await seedAdminFromEnv();
      log("admin seed completed");
    }
  }
} catch (e: any) {
  log(`admin seed skipped: ${e?.message || e}`);
}