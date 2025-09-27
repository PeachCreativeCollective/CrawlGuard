import serverlessHttp from "serverless-http";
import serverlessHttp from "serverless-http";
import { createApp } from "../../server/app";

const FUNCTION_PREFIX = "/.netlify/functions/api";

let cachedHandler: ReturnType<typeof serverlessHttp> | null = null;

async function getHandler() {
  if (!cachedHandler) {
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
