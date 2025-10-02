import { createContext, ReactNode, useContext } from "react";
import * as React from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, PublicUser, InsertUser, LoginUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: PublicUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<PublicUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<PublicUser, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Use localStorage for user persistence in serverless environment
  const [user, setUser] = React.useState<SelectUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('crawlguard_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const syncSession = async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        const currentUser = await res.json();
        if (!isActive) return;

        setUser(currentUser);
        localStorage.setItem('crawlguard_user', JSON.stringify(currentUser));
        setError(null);
      } catch (err) {
        if (!isActive) return;

        setUser(null);
        localStorage.removeItem('crawlguard_user');

        if (err instanceof Error && !err.message.startsWith("401")) {
          setError(err);
        } else {
          setError(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    syncSession();

    return () => {
      isActive = false;
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      setUser(user);
      localStorage.setItem('crawlguard_user', JSON.stringify(user));
      queryClient.invalidateQueries();
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      setUser(user);
      localStorage.setItem('crawlguard_user', JSON.stringify(user));
      toast({
        title: "Account created!",
        description: user.isAdmin
          ? "You are now the admin of this system."
          : "Your account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      setUser(null);
      localStorage.removeItem('crawlguard_user');
      // Clear all cached data on logout
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
