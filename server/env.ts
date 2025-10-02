declare const Netlify: undefined | { env?: { get(name: string): string | undefined } };

type EnvAccessor = {
  get(name: string): string | undefined;
};

function normalize(value: string | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "undefined" || trimmed === "null") {
    return undefined;
  }
  return trimmed;
}

function getNetlifyAccessor(): EnvAccessor | undefined {
  return typeof Netlify !== "undefined" ? Netlify?.env : undefined;
}

function readFromNetlify(name: string): string | undefined {
  const accessor = getNetlifyAccessor();
  const value = accessor?.get?.(name);
  return normalize(value ?? undefined);
}

function readFromProcess(name: string): string | undefined {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return undefined;
  }
  const value = Reflect.get(process.env, name) as string | undefined;
  return normalize(value ?? undefined);
}

const SENSITIVE_ENV_BACKUP_SYMBOL = Symbol.for("builder:sensitive-env-backup");

function readFromBackup(name: string): string | undefined {
  const globalThisAny = globalThis as Record<string | symbol, unknown>;
  const backup = globalThisAny[SENSITIVE_ENV_BACKUP_SYMBOL] as Record<string, unknown> | undefined;
  if (!backup) {
    return undefined;
  }
  const value = backup[name];
  return normalize(typeof value === "string" ? value : undefined);
}

export function readEnv(name: string): string | undefined {
  const valueFromNetlify = readFromNetlify(name);
  if (valueFromNetlify !== undefined) {
    return valueFromNetlify;
  }

  const fromProcess = readFromProcess(name);
  if (fromProcess !== undefined) {
    return fromProcess;
  }

  return readFromBackup(name);
}

export function readEnvOr(name: string, fallback: string): string {
  const value = readEnv(name);
  return value ?? fallback;
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (value === undefined) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}
