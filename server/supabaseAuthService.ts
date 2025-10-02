import type { SupabaseClient, User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { PublicUser, User } from "@shared/schema";
import { randomUUID } from "crypto";
import { getStorage } from "./storage";
import { hashPassword } from "./passwords";
import { getSupabaseServiceClient } from "./supabaseClient";
import { readEnv } from "./env";

export type SafeUser = PublicUser;

export function sanitizeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest as SafeUser;
}

function getConfiguredAdminEmail(): string | null {
  const value = readEnv("ADMIN_EMAIL");
  return value ? value.toLowerCase() : null;
}

function shouldMarkAsAdmin(email: string, supabaseUser: SupabaseAuthUser): boolean {
  const adminEmail = getConfiguredAdminEmail();
  if (adminEmail && email === adminEmail) {
    return true;
  }

  const roles = (supabaseUser.app_metadata?.roles || []) as string[];
  if (Array.isArray(roles) && roles.includes("admin")) {
    return true;
  }

  const isAdminFlag = Boolean((supabaseUser.user_metadata as Record<string, unknown> | null)?.isAdmin);
  return isAdminFlag;
}

async function upsertLocalUserFromSupabase(supabaseUser: SupabaseAuthUser): Promise<User> {
  const storage = getStorage();
  const email = supabaseUser.email?.toLowerCase();

  if (!email) {
    throw new Error("Supabase user is missing an email address");
  }

  const username = (supabaseUser.user_metadata as Record<string, unknown> | null)?.username as string | undefined;
  let localUser = await storage.getUserByEmail(email);

  if (!localUser) {
    const hashed = await hashPassword(randomUUID());
    localUser = await storage.createUser({
      username: username || email.split("@")[0],
      email,
      password: hashed,
    });
  }

  if (username && localUser.username !== username) {
    await storage.updateUsername(localUser.id, username);
    localUser = (await storage.getUser(localUser.id))!;
  }

  const shouldBeAdmin = shouldMarkAsAdmin(email, supabaseUser);
  if (localUser.isAdmin !== shouldBeAdmin) {
    await storage.setUserAdminStatus(localUser.id, shouldBeAdmin);
    localUser = (await storage.getUser(localUser.id))!;
  }

  return localUser;
}

export async function getSupabaseUserFromToken(token: string): Promise<{
  supabaseUser: SupabaseAuthUser;
  localUser: User;
  safeUser: SafeUser;
}> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error(error?.message || "Invalid or expired token");
  }

  const localUser = await upsertLocalUserFromSupabase(data.user);
  return {
    supabaseUser: data.user,
    localUser,
    safeUser: sanitizeUser(localUser),
  };
}

export async function updateSupabasePassword(email: string, password: string) {
  const supabase = getSupabaseServiceClient();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findSupabaseUserByEmail(supabase, normalizedEmail);

  if (!user) {
    throw new Error("Supabase user not found");
  }

  const update = await supabase.auth.admin.updateUserById(user.id, {
    password,
  });

  if (update.error) {
    throw new Error(update.error.message);
  }
}

export async function findSupabaseUserByEmail(
  client: SupabaseClient,
  email: string,
): Promise<SupabaseAuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}
