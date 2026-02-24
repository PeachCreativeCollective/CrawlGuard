import type { RequestHandler } from "express";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { SafeUser } from "./supabaseAuthService";
import { getSupabaseUserFromToken, sanitizeUser } from "./supabaseAuthService";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      supabaseUser?: SupabaseAuthUser | null;
      accessToken?: string | null;
      supabaseResolutionError?: string | null;
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

function isTlsVerificationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (typeof message !== "string" || message.length === 0) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("self signed certificate") ||
    normalized.includes("self-signed certificate") ||
    normalized.includes("unable to verify the first certificate") ||
    normalized.includes("certificate verify failed") ||
    normalized.includes("certificate chain")
  );
}

export const attachUser: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (authHeader && !token) {
    const [headerPrefix] = authHeader.split(" ");
    console.warn("[auth] Malformed Authorization header received", {
      headerPrefix,
      headerLength: authHeader.length,
    });
  }

  req.accessToken = token ?? null;

  if (!token) {
    req.user = undefined as any;
    req.supabaseUser = null;
    return next();
  }

  try {
    const { supabaseUser, safeUser } = await getSupabaseUserFromToken(token);
    req.user = safeUser;
    req.supabaseUser = supabaseUser;
    return next();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const tokenPreview = token ? `${token.slice(0, 10)}…` : "none";

    if (isTlsVerificationError(error)) {
      console.error("[auth] TLS error while resolving Supabase user; continuing anonymously", {
        message,
        tokenPreview,
      });
    } else {
      console.warn("[auth] Failed to resolve Supabase user; proceeding anonymously", {
        message,
        tokenPreview,
        errorName: error instanceof Error ? error.name : "unknown",
      });
    }

    req.user = undefined as any;
    req.supabaseUser = null;
    req.supabaseResolutionError = message || null;
    req.accessToken = null;
    return next();
  }
};

function isLocalhost(host: string | undefined): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0]; // Remove port if present
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Allow requests from localhost OR authenticated users
// This is a pragmatic solution for development and production:
// - In development: localhost requests work without auth
// - In production: only authenticated requests work
export const requireAuthOrLocal: RequestHandler = (req, res, next) => {
  const isLocal = isLocalhost(req.get("host"));
  const isAuthenticated = !!req.user;

  if (!isLocal && !isAuthenticated) {
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
