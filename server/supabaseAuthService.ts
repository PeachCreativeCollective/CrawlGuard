import type { PublicUser, User } from "@shared/schema";
import { randomUUID } from "crypto";
import { getStorage } from "./storage";
import { hashPassword } from "./passwords";
import { getSupabaseServiceClient } from "./supabaseClient";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase() ?? null;

export type SafeUser = PublicUser;

function assertUser<T>(value: T | null | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

export function sanitizeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest as SafeUser;
}

export async function ensureLocalUser(email: string, options: { username?: string; password?: string } = {}): Promise<User> {
  const storage = getStorage();
  const normalizedEmail = email.trim().toLowerCase();
  const username = options.username?.trim() || normalizedEmail.split("@")[0];

  let user = await storage.getUserByEmail(normalizedEmail);

  if (!user) {
    const hashed = await hashPassword(options.password ?? randomUUID());
    user = await storage.createUser({
      username,
      email: normalizedEmail,
      password: hashed,
    });
  } else if (options.password) {
    await storage.updateUserPassword(user.id, options.password);
    user = assertUser(await storage.getUser(user.id), "Failed to refresh user after password update");
  }

  if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL && !user.isAdmin) {
    await storage.setUserAdminStatus(user.id, true);
    user = assertUser(await storage.getUser(user.id), "Failed to refresh user after admin promotion");
  }

  return user;
}

export async function signInWithSupabase(email: string, password: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Invalid email or password");
  }

  const localUser = await ensureLocalUser(email, {
    username: (data.user.user_metadata as Record<string, unknown> | null)?.username as string | undefined,
    password,
  });

  return {
    supabaseUser: data.user,
    session: data.session,
    localUser,
  };
}

export async function createSupabaseUser(email: string, password: string, username: string) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Unable to create user");
  }

  const localUser = await ensureLocalUser(email, { username, password });
  return {
    supabaseUser: data.user,
    localUser,
  };
}

export async function ensureSupabaseAdmin(email: string, password: string) {
  const supabase = getSupabaseServiceClient();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await supabase.auth.admin.getUserByEmail(normalizedEmail);

  if (!existing.data?.user) {
    const createResult = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { seeded: true },
    });

    if (createResult.error || !createResult.data.user) {
      throw new Error(createResult.error?.message || "Failed to seed admin user");
    }
  } else {
    const { id } = existing.data.user;
    const update = await supabase.auth.admin.updateUserById(id, {
      password,
      email_confirm: true,
    });

    if (update.error) {
      throw new Error(update.error.message);
    }
  }

  const localUser = await ensureLocalUser(normalizedEmail, {
    username: normalizedEmail.split("@")[0],
    password,
  });

  if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL && !localUser.isAdmin) {
    const storage = getStorage();
    await storage.setUserAdminStatus(localUser.id, true);
  }
}

export async function updateSupabasePassword(email: string, password: string) {
  const supabase = getSupabaseServiceClient();
  const normalizedEmail = email.trim().toLowerCase();
  const lookup = await supabase.auth.admin.getUserByEmail(normalizedEmail);

  if (!lookup.data?.user) {
    throw new Error("Supabase user not found");
  }

  const update = await supabase.auth.admin.updateUserById(lookup.data.user.id, {
    password,
  });

  if (update.error) {
    throw new Error(update.error.message);
  }

  await ensureLocalUser(normalizedEmail, {
    username: (lookup.data.user.user_metadata as Record<string, unknown> | null)?.username as string | undefined,
    password,
  });
}
