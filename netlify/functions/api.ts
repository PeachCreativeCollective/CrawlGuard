import serverlessHttp from "serverless-http";

const FUNCTION_PREFIX = "/.netlify/functions/api";

let cachedHandler: ReturnType<typeof serverlessHttp> | null = null;

type NetlifyEnv = {
  get(name: string): string | undefined;
};

declare const Netlify: undefined | { env?: NetlifyEnv };

function hydrateProcessEnvFromNetlify() {
  if (typeof Netlify === "undefined" || !Netlify?.env?.get) {
    return;
  }

  const keys = ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "SESSION_SECRET"] as const;
  for (const key of keys) {
    const value = Netlify.env.get(key);
    if (value && value !== "undefined" && (!process.env[key] || process.env[key] === "")) {
      process.env[key] = value;
    }
  }
}

async function getHandler() {
  if (!cachedHandler) {
    hydrateProcessEnvFromNetlify();
    const { createApp } = await import("../../server/app");
    const app = await createApp();
    cachedHandler = serverlessHttp(app);
  }
  return cachedHandler;
}

type NetlifyEvent = {
  path?: string | null;
  rawUrl?: string;
  rawPath?: string;
  [key: string]: any;
};

interface NetlifyContext {
  callbackWaitsForEmptyEventLoop: boolean;
  [key: string]: any;
}

function normalizeEvent(event: NetlifyEvent): NetlifyEvent {
  const normalized = { ...event };
  if (normalized.path?.startsWith(FUNCTION_PREFIX)) {
    const suffix = normalized.path.slice(FUNCTION_PREFIX.length) || "";
    normalized.path = `/api${suffix}`;
  }

  if (typeof normalized.rawUrl === "string" && normalized.rawUrl.includes(FUNCTION_PREFIX)) {
    normalized.rawUrl = normalized.rawUrl.replace(FUNCTION_PREFIX, "/api");
  }

  if ("rawPath" in normalized && typeof normalized.rawPath === "string" && normalized.rawPath.startsWith(FUNCTION_PREFIX)) {
    const suffix = normalized.rawPath.slice(FUNCTION_PREFIX.length) || "";
    normalized.rawPath = `/api${suffix}`;
  }

  return normalized;
}

export const handler = async (event: NetlifyEvent, context: NetlifyContext) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const normalizedEvent = normalizeEvent(event);
  const handler = await getHandler();
  return handler(normalizedEvent, context);
};

export const config = {
  path: "/api/*",
};
