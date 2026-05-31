/**
 * 通用 API 代理路由
 *
 * 拦截所有未匹配具体 API 路由的 /api/* 请求，
 * 显式转发 Cookie 到后端，解决 Next.js rewrite 不转发 Cookie 导致 401 的问题。
 * 不转发浏览器 Origin；这是服务端代理到后端的内部请求，透传 Origin 会触发后端 CORS 拒绝。
 *
 * 已有具体路由的接口（如 chat_stream、ai_ops）优先匹配，不受此影响。
 */

import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8091";

async function proxyRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = `${API_BASE}${pathname}${search}`;
  const method = request.method;

  const headers: Record<string, string> = {};
  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  // 显式转发 Cookie（核心：解决 rewrite 不转发的问题）
  const cookie = request.headers.get("cookie");
  if (cookie) headers["cookie"] = cookie;

  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 0) body = buffer;
  }

  try {
    const backendRes = await fetch(url, { method, headers, body });

    const resHeaders = new Headers();
    const resContentType = backendRes.headers.get("content-type");
    if (resContentType) resHeaders.set("Content-Type", resContentType);

    // 转发 Set-Cookie（登录等场景需要）
    for (const sc of backendRes.headers.getSetCookie()) {
      resHeaders.append("set-cookie", sc);
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json(
      { code: "A0002", info: `后端服务不可用: ${message}`, data: null },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}
