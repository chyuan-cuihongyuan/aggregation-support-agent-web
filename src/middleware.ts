/**
 * Next.js 中间件
 *
 * 保护需要认证的路由，未登录用户重定向到登录页
 * 已登录用户访问登录/注册页时重定向到对话页
 * 验证Token有效性，防止无效Token访问受保护路由
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cookie 名称 */
const COOKIE_NAME = "auth_token";

/** 后端 API 基础地址 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8091";

/** 验证超时时间（毫秒） */
const VERIFY_TIMEOUT = 5000;

/**
 * 验证用户Token是否有效
 * @param token - 认证Token
 * @returns Token是否有效
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT);

    const response = await fetch(`${API_BASE}/api/v1/user/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${COOKIE_NAME}=${token}`,
      },
      signal: controller.signal,
      // 不使用credentials: 'include'，因为我们手动传递Cookie
    });

    clearTimeout(timeoutId);

    // 检查响应状态
    if (response.status === 401) {
      return false;
    }

    if (response.ok) {
      const result = await response.json();
      return result.code === "0000";
    }

    return false;
  } catch (error) {
    // 网络错误、超时或其他错误都认为验证失败
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const hasToken = !!token;

  // 已登录用户访问登录/注册页 → 验证后重定向到 /chat
  if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && hasToken) {
    // 验证Token是否有效
    const isValid = await verifyToken(token);
    if (isValid) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    // Token无效，清除Cookie并继续到登录页
    const response = NextResponse.next();
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // 未登录用户访问受保护路由 → 重定向到 /login
  if (pathname.startsWith("/chat")) {
    if (!hasToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 有Token但需要验证有效性
    const isValid = await verifyToken(token);
    if (!isValid) {
      // Token无效，清除Cookie并重定向到登录页
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/register"],
};
