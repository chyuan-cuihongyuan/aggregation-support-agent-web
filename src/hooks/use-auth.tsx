/**
 * 认证状态 Hook
 *
 * 提供全局认证状态，避免多个组件重复调用 getCurrentUser
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getCurrentUser, login as authLogin, logout as authLogout, register as authRegister, updateUser as authUpdateUser } from "@/lib/auth";
import type { UserInfoDTO, LoginRequest, RegisterRequest, UpdateUserRequest } from "@/types/api";

interface AuthState {
  user: UserInfoDTO | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<UserInfoDTO>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (data: UpdateUserRequest) => Promise<boolean>;
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

  // 修复React Hooks违规问题 - 避免在useEffect中直接调用setState
  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const u = await getCurrentUser();
        if (isMounted) {
          setUser(u);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []); // 移除refresh依赖，避免级联渲染

  // 监听 API 层的 401 事件，统一处理认证失效
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      // 只在非登录页时跳转，避免无限循环
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (data: LoginRequest): Promise<UserInfoDTO> => {
    const u = await authLogin(data);
    setUser(u);
    return u;
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

  const updateUser = async (data: UpdateUserRequest): Promise<boolean> => {
    try {
      const result = await authUpdateUser(data);
      // 更新成功后刷新用户信息
      await refresh();
      return result;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateUser }}>
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
