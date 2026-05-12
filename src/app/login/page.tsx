/**
 * 登录页
 *
 * 左右两栏布局：左侧展示品牌和功能特性，右侧为登录表单
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthCookie } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Cpu, Database, Network, Shield, Sparkles } from "lucide-react";

/** 功能特性列表 */
const FEATURES = [
  {
    icon: Sparkles,
    title: "智能对话",
    description: "支持多智能体选择，流式响应，Markdown 渲染",
  },
  {
    icon: Cpu,
    title: "工具调用",
    description: "强大的工具调用能力，执行复杂任务",
  },
  {
    icon: Database,
    title: "知识库",
    description: "文档上传向量化，支持多种检索方式",
  },
  {
    icon: Network,
    title: "AIOps 分析",
    description: "一键告警分析，提供运维建议",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 演示账号验证：admin/admin
    setTimeout(() => {
      if (username === "admin" && password === "admin") {
        setAuthCookie(username);
        router.push("/chat");
      } else {
        setError("用户名或密码错误（演示账号：admin/admin）");
        setIsLoading(false);
      }
    }, 500);
  };

  const fillDemoAccount = () => {
    setUsername("admin");
    setPassword("admin");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 左栏：品牌和功能特性 */}
      <div className="flex-1 bg-gradient-to-br from-primary/10 to-primary/5 p-8 lg:p-16 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto w-full">
          {/* 品牌 */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI 智能体聚合平台</h1>
              <p className="text-sm text-muted-foreground">智能对话 · 知识库 · AIOps</p>
            </div>
          </div>

          {/* 功能特性卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <feature.icon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 右栏：登录表单 */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Card className="border-border/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">登录</CardTitle>
              <CardDescription>输入您的账号信息以访问平台</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    用户名
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    密码
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "登录中..." : "登录"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={fillDemoAccount}
                  disabled={isLoading}
                >
                  填充演示账号（admin/admin）
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>演示环境：无需注册</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
