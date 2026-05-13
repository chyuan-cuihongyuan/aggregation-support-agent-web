/**
 * 注册页
 *
 * 左右两栏布局（1.3:0.7）：左侧品牌+利益点，右侧注册表单
 * 与登录页保持统一的深色毛玻璃风格
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** 为什么选择我们 */
const BENEFITS = [
  { icon: "✓", color: "from-[#62f6c7]/20 to-[#62f6c7]/10", textColor: "text-[#62f6c7]", label: "免费使用全部核心功能" },
  { icon: "✓", color: "from-[#5aa9ff]/20 to-[#5aa9ff]/10", textColor: "text-[#5aa9ff]", label: "支持多种 AI 模型智能体切换" },
  { icon: "✓", color: "from-[#ff5a7a]/20 to-[#ff5a7a]/10", textColor: "text-[#ff5a7a]", label: "数据安全加密，隐私保护" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /** 前端表单校验 */
  const validate = (): string | null => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return "账号需为 3-20 位字母、数字或下划线";
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return "请输入正确的 11 位手机号";
    }
    if (password.length < 6) {
      return "密码至少 6 位";
    }
    if (password !== confirmPassword) {
      return "两次输入的密码不一致";
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username,
        password,
        phone,
        email: email || undefined,
        nickname: nickname || undefined,
      });
      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
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
            加入我们<br />开启 AI 之旅
          </div>
          <div className="text-[13px] text-white/60 leading-relaxed max-w-[42ch]">
            注册账号即可体验多智能体对话、知识库管理、AIOps 告警分析等全部功能
          </div>
        </div>

        {/* 为什么选择我们 */}
        <div className="mt-auto p-5 bg-[#62f6c7]/[0.06] border border-[#62f6c7]/[0.12] rounded-[14px]">
          <div className="text-[13px] font-semibold text-[#62f6c7] mb-2.5">为什么选择我们？</div>
          <div className="flex flex-col gap-2.5">
            {BENEFITS.map((benefit) => (
              <div key={benefit.label} className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${benefit.color} flex items-center justify-center text-[13px] ${benefit.textColor}`}>
                  {benefit.icon}
                </div>
                <div className="text-xs text-white/70">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右栏：注册表单 */}
      <div className="p-8 flex flex-col justify-center gap-3.5">
        <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-xl font-bold text-white/95 mb-1">创建账号</div>
          <div className="text-xs text-white/50 mb-4.5">填写以下信息完成注册</div>

          <form onSubmit={handleRegister} className="space-y-3">
            {/* 账号 */}
            <div>
              <div className="text-xs text-white/60 mb-1">账号 <span className="text-[#ff5a7a]">*</span></div>
              <Input
                id="username"
                type="text"
                placeholder="3-20 位字母、数字或下划线"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-9 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            {/* 邮箱 */}
            <div>
              <div className="text-xs text-white/60 mb-1">邮箱 <span className="text-[#ff5a7a]">*</span></div>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-9 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            {/* 手机号 */}
            <div>
              <div className="text-xs text-white/60 mb-1">手机号 <span className="text-[#ff5a7a]">*</span></div>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-9 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            {/* 昵称 */}
            <div>
              <div className="text-xs text-white/60 mb-1">昵称</div>
              <Input
                id="nickname"
                type="text"
                placeholder="选填，默认与账号相同"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-9 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            {/* 密码 */}
            <div>
              <div className="text-xs text-white/60 mb-1">密码 <span className="text-[#ff5a7a]">*</span></div>
              <Input
                id="password"
                type="password"
                placeholder="至少 6 位，包含字母和数字"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-9 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            {/* 确认密码 */}
            <div>
              <div className="text-xs text-white/60 mb-1">确认密码 <span className="text-[#ff5a7a]">*</span></div>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-black/20 border-white/[0.14] rounded-[10px] h-9 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#62f6c7]/30 focus-visible:border-[#62f6c7]"
              />
            </div>

            {error && (
              <div className="text-sm text-[#ff5a7a] bg-[#ff5a7a]/10 p-3 rounded-lg">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#62f6c7] to-[#5aa9ff] text-[#070a12] font-bold rounded-[10px] h-10 hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </form>
        </div>

        <div className="text-center text-xs text-white/50">
          已有账号？<a href="/login" className="text-[#62f6c7] font-semibold hover:underline">返回登录</a>
        </div>

        <div className="text-center text-[11px] text-white/30 mt-auto">© 2026 AI 智能体聚合平台</div>
      </div>
    </div>
  );
}
