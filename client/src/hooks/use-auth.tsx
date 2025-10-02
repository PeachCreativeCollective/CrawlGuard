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
import { supabase } from "@/lib/supabaseClient";

const AUTH_STORAGE_KEY = "crawlguard_user";

type AuthContextType = {
  user: PublicUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<PublicUser | null, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<PublicUser | null, Error, InsertUser>;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    const res = await apiRequest("GET", "/api/user");
    return await res.json();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("401")) {
      return null;
    }
    throw error;
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

  const syncUser = React.useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setError(null);
      return currentUser;
    } catch (err) {
      setError(err as Error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      throw err;
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        await supabase.auth.getSession();
        if (!active) return;
        await syncUser();
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, _session) => {
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

    void init();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [syncUser]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return await syncUser();
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
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: InsertUser) => {
      const parsed = insertUserSchema.parse(payload);
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
      setUser(newUser);
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
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
