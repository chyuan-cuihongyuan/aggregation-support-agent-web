/**
 * 认证工具函数
 *
 * 通过后端 API 管理登录状态，Token 存储在 HttpOnly Cookie
 */

import { requestJson } from "./api";
import type { UserInfoDTO, LoginRequest, RegisterRequest, UpdateUserRequest } from "@/types/api";

/** 获取当前用户信息（从后端验证 Cookie） */
export async function getCurrentUser(): Promise<UserInfoDTO | null> {
  try {
    return await requestJson<UserInfoDTO>("/api/v1/user/info");
  } catch {
    return null;
  }
}

/** 登录 */
export async function login(data: LoginRequest): Promise<UserInfoDTO> {
  return requestJson<UserInfoDTO>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** 注册 */
export async function register(data: RegisterRequest): Promise<UserInfoDTO> {
  return requestJson<UserInfoDTO>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** 登出 */
export async function logout(): Promise<void> {
  await requestJson<boolean>("/api/v1/auth/logout", { method: "POST" });
}

/** 更新用户信息 */
export async function updateUser(data: UpdateUserRequest): Promise<boolean> {
  return requestJson<boolean>("/api/v1/user/update", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** 检查是否已登录 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
