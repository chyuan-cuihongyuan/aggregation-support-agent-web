/**
 * Next.js Proxy（路由守卫）
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
 * 验证结果类型
 * - valid: Token有效
 * - invalid: Token无效（明确返回401或验证失败）
 * - unavailable: 后端不可用（超时或网络错误）
 */
type VerifyResult = "valid" | "invalid" | "unavailable";

/**
 * 验证用户Token是否有效
 * @param token - 认证Token
 * @returns 验证结果
 */
async function verifyToken(token: string): Promise<VerifyResult> {
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
    });

    clearTimeout(timeoutId);

    // 明确返回401，Token无效
    if (response.status === 401) {
      return "invalid";
    }

    if (response.ok) {
      const result = await response.json();
      return result.code === "0000" ? "valid" : "invalid";
    }

    // 其他HTTP错误状态码，视为Token无效
    return "invalid";
  } catch (error) {
    // 超时或网络错误，后端不可用
    if (error instanceof DOMException && error.name === "AbortError") {
      return "unavailable";
    }
    // 网络错误等其他异常，后端不可用
    return "unavailable";
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const hasToken = !!token;

  // 已登录用户访问登录/注册页 → 验证后重定向到 /chat
  if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && hasToken) {
    const result = await verifyToken(token);
    if (result === "valid") {
      // Token有效，重定向到对话页
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    if (result === "invalid") {
      // Token无效，清除Cookie并继续到登录页
      const response = NextResponse.next();
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    // 后端不可用，允许继续访问登录页（降级策略）
    return NextResponse.next();
  }

  // 未登录用户访问受保护路由 → 重定向到 /login
  if (pathname.startsWith("/chat") || pathname.startsWith("/knowledge") || pathname.startsWith("/settings") || pathname.startsWith("/aiops") || pathname.startsWith("/admin")) {
    if (!hasToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const result = await verifyToken(token);
    if (result === "valid") {
      // Token有效，允许访问
      return NextResponse.next();
    }
    if (result === "invalid") {
      // Token无效，清除Cookie并重定向到登录页
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    // 后端不可用时不能确认 Token 有效性，受保护页面按未认证处理
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/knowledge/:path*", "/settings/:path*", "/aiops/:path*", "/admin/:path*", "/login", "/register"],
};
