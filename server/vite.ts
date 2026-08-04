import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const mode = process.env.NODE_ENV ?? "development";
  const resolvedConfig =
    typeof viteConfig === "function"
      ? await viteConfig({ command: "serve", mode })
      : await Promise.resolve(viteConfig);

  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...resolvedConfig.server,
      ...serverOptions,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(isKnownClientRoute(req.path) ? 200 : 404).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

const publicRoutes = new Set(["/", "/services", "/about", "/contact", "/gallery", "/auth", "/admin"]);
const serviceRoutes = new Set([
  "crawl-space-encapsulation",
  "basement-waterproofing",
  "mold-remediation",
  "sump-pump",
  "french-drain",
  "insulation-dehumidification",
]);

function isKnownClientRoute(urlPath: string) {
  const normalizedPath = urlPath.replace(/\/$/, "") || "/";
  if (publicRoutes.has(normalizedPath)) return true;
  const serviceId = normalizedPath.match(/^\/services\/([^/]+)$/)?.[1];
  return Boolean(serviceId && serviceRoutes.has(serviceId));
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    res.status(isKnownClientRoute(req.path) ? 200 : 404).sendFile(path.resolve(distPath, "index.html"));
  });
}
