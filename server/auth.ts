import type { RequestHandler } from "express";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { SafeUser } from "./supabaseAuthService";
import { getSupabaseUserFromToken, sanitizeUser } from "./supabaseAuthService";

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: SupabaseAuthUser | null;
      accessToken?: string | null;
    }

    interface User extends SafeUser {}
  }
}

function extractBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export const attachUser: RequestHandler = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    req.user = undefined as any;
    req.supabaseUser = null;
    req.accessToken = null;
    return next();
  }

  try {
    const { supabaseUser, safeUser } = await getSupabaseUserFromToken(token);
    req.user = safeUser;
    req.supabaseUser = supabaseUser;
    req.accessToken = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message || "Invalid or expired token" });
  }
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
};
