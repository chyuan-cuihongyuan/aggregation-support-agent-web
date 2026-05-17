/**
 * 新会话欢迎面板
 *
 * 居中显示欢迎语 + 快速操作卡片
 * 带渐变光晕背景装饰
 */

"use client";

import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Search, Activity, FileUp } from "lucide-react";

const QUICK_ACTIONS = [
  { title: "快速问答", desc: "总结今天的告警情况", icon: MessageSquare, gradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20" },
  { title: "知识检索", desc: "查找运维手册", icon: Search, gradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20" },
  { title: "AIOps 分析", desc: "分析活动告警生成报告", icon: Activity, gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20" },
  { title: "文档上传", desc: "上传文档到知识库", icon: FileUp, gradient: "from-orange-500/10 to-amber-500/10 dark:from-orange-500/20 dark:to-amber-500/20" },
];

export function WelcomePanel() {
  const { user } = useAuth();
  const displayName = user?.nickname || user?.username || "用户";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
      {/* 中心光晕 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(102,126,234,0.08)_0%,rgba(118,75,162,0.04)_40%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(102,126,234,0.12)_0%,rgba(118,75,162,0.06)_40%,transparent_70%)] rounded-full pointer-events-none" />

      {/* Logo */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] opacity-30 blur-xl scale-150" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] flex items-center justify-center shadow-lg shadow-purple-500/20">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        你好，{displayName}
      </h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8">
        有什么我可以帮你的？选择下方操作快速开始
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-sm w-full relative z-10">
        {QUICK_ACTIONS.map((action) => (
          <div
            key={action.title}
            className={`relative overflow-hidden border border-[var(--chat-border)] rounded-xl px-4 py-3 hover:bg-[var(--surface-card)] dark:hover:bg-[#22222e] transition-all duration-200 cursor-pointer group hover:scale-[1.02] hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <action.icon className="w-4 h-4 text-[var(--brand-accent)]" />
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">{action.title}</span>
              </div>
              <div className="text-[12px] text-[var(--text-muted)]">{action.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
