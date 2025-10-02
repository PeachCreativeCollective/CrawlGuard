import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const SENSITIVE_ENV_KEYS = [
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "ADMIN_PASSWORD",
  "ADMIN_EMAIL",
] as const;

type SensitiveEnvKey = (typeof SENSITIVE_ENV_KEYS)[number];

function scrubSensitiveEnvVars() {
  for (const key of SENSITIVE_ENV_KEYS) {
    process.env[key as SensitiveEnvKey] = undefined;
  }
}

function createSanitizedProcessEnv(mode: string) {
  const nodeEnv = process.env.NODE_ENV ?? (mode === "production" ? "production" : "development");
  return JSON.stringify({ NODE_ENV: nodeEnv });
}

export default defineConfig(async ({ mode }) => {
  scrubSensitiveEnvVars();

  const plugins = [react(), runtimeErrorOverlay()];

  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return {
    plugins,
    define: {
      "process.env": createSanitizedProcessEnv(mode),
      "process.env.DATABASE_URL": "undefined",
    },
    envPrefix: "VITE_",
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
