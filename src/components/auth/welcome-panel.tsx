/**
 * 新会话欢迎面板
 *
 * 居中显示欢迎语 + 快速操作卡片
 */

"use client";

import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Search, Activity, FileUp } from "lucide-react";

const QUICK_ACTIONS = [
  { title: "快速问答", desc: "总结今天的告警情况", icon: MessageSquare },
  { title: "知识检索", desc: "查找运维手册", icon: Search },
  { title: "AIOps 分析", desc: "分析活动告警生成报告", icon: Activity },
  { title: "文档上传", desc: "上传文档到知识库", icon: FileUp },
];

export function WelcomePanel() {
  const { user } = useAuth();
  const displayName = user?.nickname || user?.username || "用户";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        你好，{displayName}
      </h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8">
        有什么我可以帮你的？选择下方操作快速开始
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
        {QUICK_ACTIONS.map((action) => (
          <div
            key={action.title}
            className="border border-[var(--chat-border)] rounded-xl px-4 py-3 hover:bg-[var(--surface-card)] dark:hover:bg-[#22222e] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <action.icon className="w-4 h-4 text-[var(--brand-accent)]" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{action.title}</span>
            </div>
            <div className="text-[12px] text-[var(--text-muted)]">{action.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
