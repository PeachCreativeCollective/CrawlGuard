import type { SupabaseClient, User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { PublicUser, User } from "@shared/schema";
import { randomUUID } from "crypto";
import { getStorage, type IStorage } from "./storage";
import { hashPassword } from "./passwords";
import { getSupabaseAuthClient, getSupabaseServiceClient } from "./supabaseClient";
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

function sanitizeUsernameCandidate(candidate: string | undefined, email: string): string {
  const defaultBase = email.split("@")[0] ?? "user";
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");

  const fromCandidate = typeof candidate === "string" && candidate.trim().length > 0 ? normalize(candidate) : "";
  if (fromCandidate.length > 0) {
    return fromCandidate;
  }

  const fallback = normalize(defaultBase);
  return fallback.length > 0 ? fallback : "user";
}

async function ensureUniqueUsername(
  storage: IStorage,
  desired: string | undefined,
  email: string,
  currentUserId?: string,
): Promise<string> {
  const base = sanitizeUsernameCandidate(desired, email);
  let candidate = base;
  let attempt = 0;

  while (true) {
    const existing = await storage.getUserByUsername(candidate);
    if (!existing || existing.id === currentUserId) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

async function upsertLocalUserFromSupabase(supabaseUser: SupabaseAuthUser): Promise<User> {
  const storage = getStorage();
  const email = supabaseUser.email?.toLowerCase();

  if (!email) {
    throw new Error("Supabase user is missing an email address");
  }

  const metadata = (supabaseUser.user_metadata as Record<string, unknown> | null) ?? null;
  const desiredUsername = metadata?.username as string | undefined;

  let localUser = await storage.getUserByEmail(email);

  if (!localUser) {
    const hashed = await hashPassword(randomUUID());
    const usernameForInsert = await ensureUniqueUsername(storage, desiredUsername, email);
    localUser = await storage.createUser({
      username: usernameForInsert,
      email,
      password: hashed,
    });
  } else if (desiredUsername) {
    const uniqueUsername = await ensureUniqueUsername(storage, desiredUsername, email, localUser.id);
    if (uniqueUsername !== localUser.username) {
      await storage.updateUsername(localUser.id, uniqueUsername);
      localUser = (await storage.getUser(localUser.id))!;
    }
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
  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    const errorMsg = error?.message || "Invalid or expired token";
    console.warn("[supabaseAuthService] Token validation failed", {
      errorMsg,
      errorCode: error?.status,
      hasToken: !!token,
    });
    throw new Error(errorMsg);
  }

  try {
    const localUser = await upsertLocalUserFromSupabase(data.user);
    return {
      supabaseUser: data.user,
      localUser,
      safeUser: sanitizeUser(localUser),
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[supabaseAuthService] Failed to upsert user from Supabase", {
      error: errMsg,
      userEmail: data.user?.email,
    });
    throw err;
  }
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
