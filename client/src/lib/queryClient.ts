import { QueryClient, type QueryFunction } from "@tanstack/react-query";
import { getSupabaseClient, hasSupabaseConfig } from "./supabaseClient";
import { getAccessToken, setAccessToken } from "./authTokenStore";

async function throwIfResNotOk(res: Response) {
  if (res.ok) {
    return;
  }

  let message = res.statusText || "Request failed";

  if (!res.bodyUsed) {
    try {
      const clone = res.clone();
      const contentType = clone.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await clone.json();
        if (typeof data === "string") {
          message = data;
        } else if (data && typeof data === "object") {
          const { message: dataMessage } = data as { message?: unknown };
          if (typeof dataMessage === "string" && dataMessage.trim().length > 0) {
            message = dataMessage;
          } else {
            message = JSON.stringify(data);
          }
        }
      } else {
        const text = await clone.text();
        if (text.trim().length > 0) {
          message = text;
        }
      }
    } catch (error) {
      message = res.statusText || "Request failed";
    }
  }

  throw new Error(`${res.status}: ${message}`);
}

async function buildAuthHeaders(hasBody: boolean): Promise<Record<string, string>> {
  const headers: Record<string, string> = hasBody ? { "Content-Type": "application/json" } : {};
  if (!hasSupabaseConfig()) {
    return headers;
  }

  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = await buildAuthHeaders(Boolean(data));
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = await buildAuthHeaders(false);
    const res = await fetch(queryKey.join("/") as string, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
