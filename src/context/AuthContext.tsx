import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, setStoredToken } from "../lib/api";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "USER";
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        setStoredToken(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    const onUnauthorized = () => {
      setUser(null);
      setStoredToken(null);
    };
    window.addEventListener("magline:unauthorized", onUnauthorized);
    return () => window.removeEventListener("magline:unauthorized", onUnauthorized);
  }, [loadSession]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      let data: { error?: string; token?: string; user?: AuthUser } = {};
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          return "Server error. Please try again.";
        }
      }

      if (!res.ok) return data.error ?? "Login failed";
      if (!data.token || !data.user) return "Invalid server response.";
      setStoredToken(data.token);
      setUser(data.user);
      return null;
    } catch {
      return "Could not reach the server. Check your connection and try again.";
    }
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isSuperAdmin: user?.role === "SUPER_ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
