/**
 * Next.js 中间件
 *
 * 保护需要认证的路由，未登录用户重定向到登录页
 * 已登录用户访问登录/注册页时重定向到对话页
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cookie 名称 */
const COOKIE_NAME = "auth_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = !!request.cookies.get(COOKIE_NAME)?.value;

  // 已登录用户访问登录/注册页 → 重定向到 /chat
  if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && hasToken) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  // 未登录用户访问受保护路由 → 重定向到 /login
  if (pathname.startsWith("/chat") && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/register"],
};
