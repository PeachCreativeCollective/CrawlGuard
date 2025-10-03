import { createClient, type SupabaseClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import { readEnv, requireEnv } from "./env";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import tls from "node:tls";
import { Agent, setGlobalDispatcher } from "undici";

let serviceClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

let cachedFetch: typeof globalThis.fetch | null = null;
let fetchUsesCustomCa = false;
let customDispatcher: Agent | null = null;
let globalDispatcherConfigured = false;
let httpsAgentConfigured = false;

const GTS_ROOT_R4_CERT = `-----BEGIN CERTIFICATE-----
MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX
MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx
NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube
Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e
WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN
l8qJUC99BM00qP/8/UswNgYIKwYBBQUHAQEEKjAoMCYGCCsGAQUFBzAChhpodHRw
Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v
Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG
SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ
odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY
+SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs
kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep
8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1
vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl
-----END CERTIFICATE-----`;

const ISRG_ROOT_X1_CERT = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oYi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`;

const DEFAULT_CA_BUNDLE = [GTS_ROOT_R4_CERT, ISRG_ROOT_X1_CERT].join("\n");

function normalizeMultiline(value: string): string {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function readCertificateFromPath(path: string, logOnError: boolean): string | null {
  try {
    let resolvedPath = path;
    if (path.startsWith("file://")) {
      resolvedPath = fileURLToPath(new URL(path));
    } else if (!isAbsolute(path)) {
      resolvedPath = resolve(process.cwd(), path);
    }

    if (!existsSync(resolvedPath)) {
      if (logOnError) {
        console.warn("[tls] CA certificate file not found", { path: resolvedPath });
      }
      return null;
    }

    const content = readFileSync(resolvedPath, "utf8");
    console.log("[tls] Loaded CA certificate from file", { path: resolvedPath });
    return content;
  } catch (error) {
    if (logOnError) {
      console.error("[tls] Failed to read CA certificate", {
        path,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  }
}

function splitCertificateBundle(bundle: string): string[] {
  return bundle
    .split(/(?=-----BEGIN CERTIFICATE-----)/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

function dedupeCertificates(certificates: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const certificate of certificates) {
    const trimmed = certificate.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }

  return result;
}

function configureGlobalUndiciDispatcher(agent: Agent) {
  if (globalDispatcherConfigured) {
    return;
  }

  try {
    setGlobalDispatcher(agent);
    globalDispatcherConfigured = true;
    console.log("[tls] Global undici dispatcher configured with custom CA bundle");
  } catch (error) {
    console.warn("[tls] Unable to configure global undici dispatcher", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function configureHttpsGlobalAgent(bundle: string) {
  if (httpsAgentConfigured) {
    return;
  }

  try {
    const extras = dedupeCertificates(splitCertificateBundle(bundle));
    if (extras.length === 0) {
      httpsAgentConfigured = true;
      return;
    }

    const agent = https.globalAgent;
    const existingCa = agent.options.ca;
    let baseCertificates: string[];

    if (Array.isArray(existingCa)) {
      baseCertificates = existingCa.map((entry) =>
        typeof entry === "string" ? entry : entry.toString(),
      );
    } else if (existingCa) {
      baseCertificates = [
        typeof existingCa === "string" ? existingCa : existingCa.toString(),
      ];
    } else {
      baseCertificates = [...tls.rootCertificates];
    }

    let updated = false;
    for (const cert of extras) {
      if (!baseCertificates.includes(cert)) {
        baseCertificates.push(cert);
        updated = true;
      }
    }

    if (updated) {
      agent.options.ca = baseCertificates;
      console.log("[tls] https global agent CA bundle extended", {
        totalCertificates: baseCertificates.length,
      });
    } else {
      console.log("[tls] https global agent already includes supplied CA certificates");
    }
  } catch (error) {
    console.error("[tls] Failed to extend https global agent", {
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    httpsAgentConfigured = true;
  }
}

function ensureCustomDispatcher(bundle: string): Agent {
  if (!customDispatcher) {
    customDispatcher = new Agent({ connect: { ca: bundle } });
    console.log("[tls] Custom undici agent created for Supabase requests");
  }
  configureHttpsGlobalAgent(bundle);
  configureGlobalUndiciDispatcher(customDispatcher);
  return customDispatcher;
}

function loadCaCertificate(): string {
  const direct = readEnv("SUPABASE_CA_CERT");
  if (direct) {
    console.log("[tls] Using CA certificate from SUPABASE_CA_CERT environment variable");
    const fragments = dedupeCertificates(
      splitCertificateBundle(normalizeMultiline(direct)),
    );
    return fragments.join("\n");
  }

  const fragments: string[] = [];
  const addCertificatesFromContent = (content: string | null) => {
    if (!content) {
      return;
    }
    fragments.push(...splitCertificateBundle(normalizeMultiline(content)));
  };

  const explicitPath = readEnv("SUPABASE_CA_CERT_PATH") ?? readEnv("NODE_EXTRA_CA_CERTS");
  if (explicitPath) {
    addCertificatesFromContent(readCertificateFromPath(explicitPath, true));
  }

  const moduleDir = fileURLToPath(new URL(".", import.meta.url));
  const moduleCandidates = [
    resolve(moduleDir, "../certs/gts-root-r4.pem"),
    resolve(moduleDir, "../certs/isrg-root-x1.pem"),
  ];
  const workingDirCandidates = [
    resolve(process.cwd(), "certs/gts-root-r4.pem"),
    resolve(process.cwd(), "certs/isrg-root-x1.pem"),
  ];

  for (const candidate of [...moduleCandidates, ...workingDirCandidates]) {
    addCertificatesFromContent(readCertificateFromPath(candidate, false));
  }

  const unique = dedupeCertificates(fragments);
  if (unique.length > 0) {
    console.log("[tls] Using CA bundle from filesystem", { certificates: unique.length });
    return unique.join("\n");
  }

  console.log("[tls] Falling back to built-in CA bundle (GTS Root R4 + ISRG Root X1)");
  return DEFAULT_CA_BUNDLE;
}

function getSupabaseFetch(): typeof globalThis.fetch {
  if (cachedFetch) {
    return cachedFetch;
  }

  try {
    const certificateBundle = loadCaCertificate();
    ensureCustomDispatcher(certificateBundle);
    cachedFetch = globalThis.fetch.bind(globalThis);
    fetchUsesCustomCa = true;
    console.log("[tls] Global fetch ensured to use custom CA trust store");
    return cachedFetch;
  } catch (error) {
    console.error("[tls] Failed to configure custom CA for Supabase", error);
  }

  cachedFetch = globalThis.fetch.bind(globalThis);
  fetchUsesCustomCa = false;
  return cachedFetch;
}

function buildClientOptions(): SupabaseClientOptions<any> {
  const options: SupabaseClientOptions<any> = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  const fetchImpl = getSupabaseFetch();
  if (fetchUsesCustomCa) {
    options.global = {
      fetch: fetchImpl,
    };
  }

  return options;
}

function resolveSupabaseUrl(): string {
  const direct = readEnv("SUPABASE_URL");
  if (direct) {
    return direct;
  }

  const fromVite = readEnv("VITE_SUPABASE_URL");
  if (fromVite) {
    return fromVite;
  }

  throw new Error(
    "Supabase authentication requires SUPABASE_URL or VITE_SUPABASE_URL to be configured",
  );
}

function resolveAuthKey(): string {
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  const anonKey = readEnv("SUPABASE_ANON_KEY") ?? readEnv("VITE_SUPABASE_ANON_KEY");
  if (anonKey) {
    return anonKey;
  }

  throw new Error(
    "Supabase authentication requires SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY to be configured",
  );
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const url = resolveSupabaseUrl();
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  serviceClient = createClient(url, key, buildClientOptions());

  return serviceClient;
}

export function getSupabaseAuthClient(): SupabaseClient {
  if (authClient) {
    return authClient;
  }

  const url = resolveSupabaseUrl();
  const key = resolveAuthKey();

  authClient = createClient(url, key, buildClientOptions());

  return authClient;
}
