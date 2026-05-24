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

  try {
    const backendRes = await fetch(`${API_BASE}/api/v1/chat_stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body,
    });

    // 检查后端响应状态码
    if (backendRes.status === 401) {
      return Response.json(
        { code: "A0004", info: "登录已过期，请重新登录", data: null },
        { status: 401 }
      );
    }

    if (!backendRes.ok) {
      return Response.json(
        { code: "A0001", info: `后端请求失败: HTTP ${backendRes.status}`, data: null },
        { status: backendRes.status }
      );
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // 网络错误或后端不可用
    const message = error instanceof Error ? error.message : "未知错误";
    return Response.json(
      { code: "A0002", info: `后端服务不可用: ${message}`, data: null },
      { status: 502 }
    );
  }
}
