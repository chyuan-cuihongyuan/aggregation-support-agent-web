/**
 * SSE 流式代理：对话流式接口
 *
 * 直接透传后端 SSE 响应，避免 Next.js rewrite 缓冲整个流
 */

import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8091";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const cookie = request.headers.get("cookie") || "";

  const backendRes = await fetch(`${API_BASE}/api/v1/chat_stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body,
  });

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
