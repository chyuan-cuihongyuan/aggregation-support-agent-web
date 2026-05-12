/**
 * 根页面
 *
 * 重定向到登录页或对话页
 * HttpOnly Cookie 无法在前端 JS 读取，页面采用简单的重定向逻辑
 * 中间件已经做了路径保护
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    isAuthenticated().then((authenticated) => {
      if (authenticated) {
        router.replace("/chat");
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

  // 显示加载状态
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">加载中...</div>
    </div>
  );
}
