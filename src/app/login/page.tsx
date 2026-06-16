/**
 * 登录页
 *
 * 居中卡片布局，浅色/深色双主题支持
 * 浅色：白色背景 + 装饰渐变圆 + 网格
 * 深色：#0f0f14 背景 + 微光效果
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@chyuan/ui-kit";
import { Button } from "@chyuan/ui-kit";
import { Input } from "@chyuan/ui-kit";

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
      if (!user || !user.id) {
        throw new Error("登录响应格式错误：用户信息无效");
      }
      window.location.href = "/chat";
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--surface-bg)] dark:bg-[#0f0f14] overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* 浅色模式装饰 */}
        <div className="block dark:hidden">
          <div className="bg-orb bg-orb-1 w-[600px] h-[600px] -top-[200px] -right-[200px] bg-[rgba(102,126,234,0.08)]" />
          <div className="bg-orb bg-orb-2 w-[500px] h-[500px] -bottom-[150px] -left-[150px] bg-[rgba(230,57,70,0.06)]" />
          <div className="bg-orb bg-orb-3 w-[300px] h-[300px] top-[50%] left-[30%] bg-[rgba(118,75,162,0.05)]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>
        {/* 深色模式装饰 */}
        <div className="hidden dark:block">
          <div className="bg-orb bg-orb-1 w-[600px] h-[600px] -top-[200px] -right-[200px] bg-[rgba(102,126,234,0.1)]" />
          <div className="bg-orb bg-orb-2 w-[500px] h-[500px] -bottom-[150px] -left-[150px] bg-[rgba(230,57,70,0.08)]" />
          <div className="bg-orb bg-orb-3 w-[350px] h-[350px] top-[45%] left-[25%] bg-[rgba(118,75,162,0.06)]" />
          <div className="absolute inset-0 bg-dot-pattern text-[var(--text-muted)] opacity-[0.02]" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6">
        {/* Logo 区域 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] shadow-lg shadow-purple-500/25 mb-5">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI 智能体聚合平台</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">统一管理 · 智能对话 · 知识赋能</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-[var(--surface-main)] dark:bg-[#1a1a24] rounded-2xl p-8 shadow-lg border border-[var(--border-default)] dark:border-[#2a2a3a]">
          {registeredNotice && (
            <div className="text-sm text-[var(--status-success)] bg-[var(--status-success)]/10 p-3 rounded-lg mb-4">
              注册成功，请登录
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-[var(--text-primary)] mb-2">用户名</label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]/20 focus-visible:border-[var(--brand-accent)]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[var(--text-primary)] mb-2">密码</label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]/20 focus-visible:border-[var(--brand-accent)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--brand-accent)]"
                />
                记住我
              </label>
              <a href="#" className="text-[13px] text-[var(--brand-accent)] font-medium hover:underline">忘记密码？</a>
            </div>

            {error && (
              <div className="text-sm text-[var(--status-error)] bg-[var(--status-error)]/10 p-3 rounded-lg">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-[15px] font-semibold bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-xl shadow-none disabled:opacity-50"
            >
              {isLoading ? "登录中..." : "登 录"}
            </Button>
          </form>

          {/* 分割线 */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border-default)] dark:bg-[#2a2a3a]" />
            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">其他登录方式</span>
            <div className="flex-1 h-px bg-[var(--border-default)] dark:bg-[#2a2a3a]" />
          </div>

          {/* 社交登录 */}
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 h-11 flex items-center justify-center gap-2 text-[13px] font-medium bg-[var(--surface-card)] dark:bg-[#22222e] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>
            <button
              type="button"
              className="flex-1 h-11 flex items-center justify-center gap-2 text-[13px] font-medium bg-[var(--surface-card)] dark:bg-[#22222e] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              SSO 登录
            </button>
          </div>

          {/* 演示账号提示 */}
          <div className="text-center mt-5 p-3 bg-red-50 dark:bg-[#e63946]/10 rounded-lg border border-red-100 dark:border-[#e63946]/20">
            <span className="text-xs text-red-800 dark:text-red-300">
              演示账号：<code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">admin</code> / <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">admin</code>
            </span>
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center mt-8 text-xs text-[var(--text-muted)]">
          <span>还没有账号？</span>
          <a href="/register" className="text-[var(--brand-accent)] font-semibold hover:underline ml-1">立即注册</a>
        </div>
        <div className="text-center mt-4 text-[11px] text-[var(--text-muted)]">
          © 2026 AI 智能体聚合平台 · <a href="#" className="hover:underline">隐私政策</a> · <a href="#" className="hover:underline">使用条款</a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-bg)] dark:bg-[#0f0f14]">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
