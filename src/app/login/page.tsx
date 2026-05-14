/**
 * 登录页
 *
 * 左右两栏布局（1.3:0.7）：左侧品牌展示+功能特性，右侧登录表单
 * 深色毛玻璃风格，品牌渐变色 #62f6c7 / #5aa9ff
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserInfoDTO } from "@/types/api";

/** 功能特性列表 */
const FEATURES = [
  { title: "智能对话", description: "多智能体切换，SSE 流式响应" },
  { title: "知识库", description: "文档上传，向量/BM25 检索" },
  { title: "AIOps 分析", description: "一键告警分析，运维报告" },
  { title: "导出分享", description: "支持 Markdown / PDF / Word" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading: authLoading, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registeredNotice = searchParams.get("registered") === "true";

  // 已登录则跳转
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/chat");
    }
  }, [authLoading, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("请输入账号和密码");
      return;
    }
    setIsLoading(true);
    try {
      const user = await login({ username: username.trim(), password });
      // 验证用户信息
      if (!user || !user.id) {
        throw new Error("登录响应格式错误：用户信息无效");
      }
      // 使用硬跳转确保 Cookie 和页面状态同步
      window.location.href = "/chat";
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070a12] to-[#0b1022] text-white grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr]">
      {/* 左栏：品牌区 */}
      <div className="p-8 lg:p-10 flex flex-col gap-5">
        {/* Logo + 品牌名 */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#62f6c7]/90 to-[#5aa9ff]/90 flex items-center justify-center font-extrabold text-[#070a12] text-base">
            AI
          </div>
          <div>
            <div className="text-[15px] font-bold text-white/90">AI 智能体聚合平台</div>
            <div className="text-[11px] text-white/50">Aggregation Support Agent</div>
          </div>
        </div>

        {/* 标语 */}
        <div>
          <div className="text-[28px] font-extrabold text-white/95 leading-tight mb-2">
            智能对话 · 知识驱动<br />运维无忧
          </div>
          <div className="text-[13px] text-white/60 leading-relaxed max-w-[42ch]">
            集成多智能体对话、RAG 知识库检索、AIOps 告警分析的一站式 AI 工作台
          </div>
        </div>

        {/* 功能特性卡片 */}
        <div className="grid grid-cols-2 gap-2.5 mt-auto">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="border border-white/[0.08] bg-white/[0.04] rounded-xl p-3 flex gap-2.5 items-start"
            >
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#62f6c7] to-[#5aa9ff] mt-1.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white/90">{feature.title}</div>
                <div className="text-[11px] text-white/45 mt-0.5">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI 效果展示图占位 */}
        <div className="mt-2 rounded-[14px] overflow-hidden border border-white/10 bg-black/20 h-[120px] flex items-center justify-center text-white/15 text-xs">
          AI 效果展示图
        </div>
      </div>

      {/* 右栏：登录表单 */}
      <div className="p-8 flex flex-col justify-center gap-4">
        <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-xl font-bold text-white/95 mb-1">欢迎回来</div>
          <div className="text-xs text-white/50 mb-5">登录你的 AI 工作台账号</div>

          {registeredNotice && (
            <div className="text-sm text-[#62f6c7] bg-[#62f6c7]/10 p-3 rounded-lg mb-4">
              注册成功，请登录
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <div className="text-xs text-white/60 mb-1.5">账号</div>
              <Input
                id="username"
                type="text"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-10 text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            <div>
              <div className="text-xs text-white/60 mb-1.5">密码</div>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-10 text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            {/* 记住我 + 忘记密码 */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-[4px] border border-white/20 accent-[#62f6c7]"
                />
                记住我
              </label>
              <span className="text-xs text-[#5aa9ff] cursor-pointer hover:underline">忘记密码？</span>
            </div>

            {error && (
              <div className="text-sm text-[#ff5a7a] bg-[#ff5a7a]/10 p-3 rounded-lg">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#62f6c7] to-[#5aa9ff] text-[#070a12] font-bold rounded-[10px] h-10 hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>
        </div>

        <div className="text-center text-xs text-white/50">
          还没有账号？<a href="/register" className="text-[#62f6c7] font-semibold hover:underline">立即注册</a>
        </div>

        <div className="text-center text-[11px] text-white/30 mt-auto">© 2026 AI 智能体聚合平台</div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#070a12] text-white/50">
        加载中...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
