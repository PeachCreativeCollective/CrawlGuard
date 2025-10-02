let cachedAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  cachedAccessToken = token ?? null;
}

export function getAccessToken(): string | null {
  return cachedAccessToken;
}
