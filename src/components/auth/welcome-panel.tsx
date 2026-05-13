/**
 * 新会话欢迎面板
 *
 * 居中显示欢迎语和快捷操作卡片
 */

"use client";

import { useAuth } from "@/hooks/use-auth";

const QUICK_ACTIONS = [
  { icon: "💡", title: "快速问答", desc: "帮我总结一下今天的告警情况" },
  { icon: "🔍", title: "知识检索", desc: "从知识库中查找运维手册" },
  { icon: "📊", title: "AIOps 分析", desc: "分析当前活动告警生成报告" },
  { icon: "📝", title: "文档上传", desc: "上传文档到知识库" },
];

export function WelcomePanel() {
  const { user } = useAuth();
  const displayName = user?.nickname || user?.username || "用户";

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-6">
      <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-xl mb-3">
        🤖
      </div>
      <div className="text-lg font-semibold mb-1.5">你好，{displayName}！</div>
      <div className="text-sm text-muted-foreground mb-6">选择一个智能体，开始你的 AI 对话之旅</div>
      <div className="grid grid-cols-2 gap-2.5 max-w-md w-full">
        {QUICK_ACTIONS.map((action) => (
          <div
            key={action.title}
            className="border border-border/50 bg-card/50 rounded-xl p-3.5 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div className="text-sm font-semibold mb-1">{action.icon} {action.title}</div>
            <div className="text-xs text-muted-foreground">{action.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
