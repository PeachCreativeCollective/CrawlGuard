import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { registerRoutes } from "./routes";
import { log } from "./logger";
import { readEnv } from "./env";

let adminSeedPromise: Promise<void> | null = null;

async function ensureAdminSeeded() {
  if (adminSeedPromise) {
    return adminSeedPromise;
  }

  adminSeedPromise = (async () => {
    try {
      const hasServiceRole = Boolean(readEnv("SUPABASE_SERVICE_ROLE_KEY"));
      if (!hasServiceRole) {
        log("admin seed skipped: Supabase service role not configured");
        return;
      }

      const { ensureDatabase, getPool } = await import("./db");
      if (!ensureDatabase()) {
        log("skipping admin seed: no DB pool");
        return;
      }

      const pool = getPool();
      if (pool) {
        await pool.query("select 1");
      }
      const { seedAdminFromEnv } = await import("./seed");
      await seedAdminFromEnv();
      log("admin seed completed");
    } catch (error: any) {
      log(`admin seed skipped: ${error?.message || error}`);
    }
  })();

  return adminSeedPromise;
}

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    } as typeof res.json;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  registerRoutes(app);

  await ensureAdminSeeded();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  return app;
}
