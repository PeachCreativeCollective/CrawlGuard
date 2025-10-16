import { createRoot } from "react-dom/client";
import "./index.css";

async function loadRuntimeConfig() {
  try {
    const resp = await fetch("/api/runtime-config");
    if (resp.ok) {
      const cfg = await resp.json();
      (window as any).__RUNTIME_CONFIG = cfg || {};
    } else {
      (window as any).__RUNTIME_CONFIG = {};
    }
  } catch {
    (window as any).__RUNTIME_CONFIG = {};
  }
}

(async () => {
  await loadRuntimeConfig();
  const { default: App } = await import("./App");
  createRoot(document.getElementById("root")!).render(<App />);
})();
