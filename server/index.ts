import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { log } from "./logger";
import { readEnv } from "./env";
import { getSupabaseServiceClient } from "./supabaseClient";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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

(async () => {
  registerRoutes(app);
  const server = createServer(app);

  // Seed admin user from environment after DB is ready
  try {
    const hasServiceRole = Boolean(readEnv("SUPABASE_SERVICE_ROLE_KEY"));
    if (!hasServiceRole) {
      log("admin seed skipped: Supabase service role not configured");
    } else {
      try {
        const supabase = getSupabaseServiceClient();
        await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`admin seed skipped: unable to reach Supabase admin API (${message})`);
        throw error;
      }

      const { seedAdminFromEnv } = await import("./seed");
      await seedAdminFromEnv();
      log("admin seed completed");
    }
  } catch (e: any) {
    log(`admin seed skipped: ${e?.message || e}`);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
