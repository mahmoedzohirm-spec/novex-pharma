// ============================================
// ملف: src/contexts/AuthContext.tsx
// ============================================
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface AuthUser {
  id: number;
  role: "admin" | "pharmacy";
  username?: string;
  name?: string;
  email?: string;
  ownerName?: string;
  phone?: string;
  totalDebt?: string;
  totalPaid?: string;
  creditLimit?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; token?: string }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  isLoading: boolean;
}

interface RegisterData {
  phone: string;
  password: string;
  name: string;
  ownerName: string;
  email?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novex_user");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem("novex_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "خطأ في تسجيل الدخول" };
      }

      if (data.token) {
        localStorage.setItem("novex_token", data.token);
      }

      setUser(data.user);
      localStorage.setItem("novex_user", JSON.stringify(data.user));
      return { success: true, token: data.token };
    } catch {
      return { success: false, error: "خطأ في الاتصال بالخادم" };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, error: result.error || "فشل إنشاء الحساب" };
      }

      setUser(result.user);
      localStorage.setItem("novex_user", JSON.stringify(result.user));

      return { success: true };
    } catch {
      return { success: false, error: "خطأ في الاتصال بالخادم" };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("novex_user");
    localStorage.removeItem("novex_token");
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      const current = prev || ({} as AuthUser);
      const updated = { ...current, ...updates };
      localStorage.setItem("novex_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser, isLoading }}
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