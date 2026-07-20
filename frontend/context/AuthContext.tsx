"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../utils/api";
import { setCookie, getCookie, eraseCookie } from "../utils/cookies";

interface User {
  id: string;
  email: string;
  full_name: string;
  supabase_user_id: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  updateUser: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      const token = getCookie("access_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        // Token is invalid or expired, clear it
        eraseCookie("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, [pathname]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token } = res.data;
      setCookie("access_token", access_token, 7); // Save token for 7 days
      
      // Fetch user profile info
      const userRes = await api.get("/users/me");
      setUser(userRes.data);
      router.push("/dashboard");
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.response?.data?.detail || "Login failed");
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
      });
      const { access_token } = res.data;
      setCookie("access_token", access_token, 7);
      
      // Fetch user profile info
      const userRes = await api.get("/users/me");
      setUser(userRes.data);
      router.push("/dashboard");
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.response?.data?.detail || "Registration failed");
    }
  };

  const logout = () => {
    eraseCookie("access_token");
    setUser(null);
    api.post("/auth/logout").catch(() => {});
    router.push("/login");
  };

  const updateUser = (name: string) => {
    if (user) {
      setUser({ ...user, full_name: name });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
