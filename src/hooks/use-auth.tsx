/**
 * 认证状态 Hook
 *
 * 提供全局认证状态，避免多个组件重复调用 getCurrentUser
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getCurrentUser, login as authLogin, logout as authLogout, register as authRegister } from "@/lib/auth";
import type { UserInfoDTO, LoginRequest, RegisterRequest } from "@/types/api";

interface AuthState {
  user: UserInfoDTO | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfoDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (data: LoginRequest) => {
    const u = await authLogin(data);
    setUser(u);
  };

  const register = async (data: RegisterRequest) => {
    const u = await authRegister(data);
    setUser(u);
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch {
      // 即使后端登出失败也清除本地状态
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
