/**
 * Next.js 中间件
 *
 * 保护需要认证的路由，未登录用户重定向到登录页
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cookie 名称 */
const COOKIE_NAME = "auth_token";

/** 需要认证的路径 */
const PROTECTED_PATHS = ["/chat", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保护指定路径
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get(COOKIE_NAME);

    if (!token) {
      // 未登录，重定向到登录页
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/admin/:path*"],
};
