import * as React from "react";
import {
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  insertUserSchema,
  PublicUser,
  InsertUser,
  LoginUser,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { setAccessToken, getAccessToken } from "@/lib/authTokenStore";

const AUTH_STORAGE_KEY = "crawlguard_user";

let lastProfileFetchDiagnostic: string | null = null;

function setLastProfileFetchDiagnostic(message: string | null) {
  lastProfileFetchDiagnostic = message ?? null;
}

function getLastProfileFetchDiagnostic(): string | null {
  return lastProfileFetchDiagnostic;
}

type AuthContextType = {
  user: PublicUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<PublicUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<PublicUser | null, Error, InsertUser>;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    const res = await apiRequest("GET", "/api/user");
    setLastProfileFetchDiagnostic(null);
    const data = await res.json();
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fullError = error instanceof Error ? error : new Error(message);

    setLastProfileFetchDiagnostic(message);

    if (message.includes("401")) {
      console.warn("[auth] Profile request returned 401", {
        message,
        errorName: fullError.name,
      });
      return null;
    }

    console.error("[auth] Profile request failed with error", {
      message,
      errorName: fullError.name,
    });
    throw fullError;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = React.useState<PublicUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      return savedUser ? (JSON.parse(savedUser) as PublicUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const lastProfileErrorRef = React.useRef<string | null>(null);

  const syncUser = React.useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      lastProfileErrorRef.current = getLastProfileFetchDiagnostic();
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      if (!currentUser && lastProfileErrorRef.current) {
        console.warn("[auth] No user returned during sync", {
          diagnostic: lastProfileErrorRef.current,
        });
      }
      setError(null);
      return currentUser;
    } catch (err) {
      lastProfileErrorRef.current = getLastProfileFetchDiagnostic();
      console.error("[auth] Failed to synchronize user profile", err);
      setError(err as Error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      throw err;
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      const { ensureSupabaseConfig, getSupabaseClient } = await import("@/lib/supabaseClient");
      const hasConfig = await ensureSupabaseConfig();
      if (!hasConfig) {
        if (!active) return;
        setError(
          new Error(
            "Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication."
          )
        );
        setIsLoading(false);
        return;
      }

      const supabase = getSupabaseClient();

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setAccessToken(session?.access_token ?? null);
        try {
          await syncUser();
        } catch (err) {
          if (err instanceof Error && err.message.startsWith("401")) {
            setError(null);
          } else {
            setError(err as Error);
          }
        }
      });

      unsubscribe = () => listener.subscription.unsubscribe();

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!active) return;
        setAccessToken(session?.access_token ?? null);
        await syncUser();
      } catch (err) {
        if (active) {
          setError(err as Error);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void setup();

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [syncUser]);

  const loginMutation = useMutation<PublicUser, Error, LoginUser>({
    mutationFn: async (credentials: LoginUser) => {
      const { ensureSupabaseConfig, getSupabaseClient } = await import("@/lib/supabaseClient");
      const hasConfig = await ensureSupabaseConfig();
      if (!hasConfig) {
        throw new Error(
          "Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication."
        );
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setAccessToken(data.session?.access_token ?? null);
      const currentUser = await syncUser();

      if (!currentUser) {
        const diagnostic = lastProfileErrorRef.current;
        console.warn("[auth] Login completed without server profile", {
          diagnostic,
          hasToken: !!getAccessToken(),
        });

        // If profile sync failed due to 401 (server couldn't validate token), attempt
        // to read the user from the Supabase client as a soft-fallback so the UI remains usable.
        if (diagnostic && diagnostic.includes("401")) {
          try {
            const { getSupabaseClient } = await import("@/lib/supabaseClient");
            const supabase = getSupabaseClient();
            const token = getAccessToken();
            const { data, error } = await supabase.auth.getUser(token ?? undefined);
            if (!error && data.user) {
              const u = data.user;
              const fallback: PublicUser = {
                id: u.id,
                username: (u.user_metadata as any)?.username ?? (u.email ? u.email.split("@")[0] : "user"),
                email: u.email ?? "",
                isAdmin: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              console.info("[auth] Using client-side Supabase user fallback due to server 401");
              setUser(fallback);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
              return fallback;
            }
          } catch (err) {
            console.warn("[auth] Client-side supabase fallback failed", err);
          }
        }

        const baseMessage = "Login succeeded but user profile is unavailable.";
        const detail = diagnostic ? ` Server error: ${diagnostic}` : " Please try again.";
        throw new Error(baseMessage + detail);
      }

      return currentUser;
    },
    onSuccess: (currentUser) => {
      queryClient.invalidateQueries();
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      setUser(currentUser);
    },
    onError: (err: Error) => {
      console.error("[auth] Login failed", err);
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: InsertUser) => {
      const { ensureSupabaseConfig, getSupabaseClient } = await import("@/lib/supabaseClient");
      const hasConfig = await ensureSupabaseConfig();
      if (!hasConfig) {
        throw new Error(
          "Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication."
        );
      }

      const parsed = insertUserSchema.parse(payload);
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          data: { username: parsed.username },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return await syncUser();
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries();
      toast({
        title: "Account created!",
        description: newUser?.isAdmin
          ? "You are now the admin of this system."
          : "Your account has been created successfully.",
      });
      setUser(newUser ?? null);
    },
    onError: (err: Error) => {
      toast({
        title: "Registration failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { ensureSupabaseConfig, getSupabaseClient } = await import("@/lib/supabaseClient");
      const hasConfig = await ensureSupabaseConfig();
      if (!hasConfig) {
        // If Supabase isn't configured, just clear local state client-side
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAccessToken(null);
        return;
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Logout failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
