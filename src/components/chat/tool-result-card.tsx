/**
 * 工具调用结果卡片
 *
 * 用于 AI 消息中展示工具调用结果（SSH 命令输出等）
 */

import { Terminal } from "lucide-react";

interface ToolResultCardProps {
  /** 工具名称，如 "ssh_shell" */
  toolName: string;
  /** 目标/服务器，可选 */
  target?: string;
  /** 代码内容 */
  content: string;
  /** 执行状态 */
  status?: "completed" | "running" | "error";
}

export function ToolResultCard({
  toolName,
  target,
  content,
  status = "completed",
}: ToolResultCardProps) {
  return (
    <div className="mt-3 rounded-[10px] overflow-hidden border border-[var(--chat-border)]">
      {/* 卡片头部 */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--surface-card)] border-b border-[var(--chat-border)]">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
          <Terminal className="w-3.5 h-3.5" />
          工具调用 · {toolName}
          {target && <span className="text-[var(--text-muted)]">· {target}</span>}
        </span>
        {status === "completed" && (
          <span className="flex items-center gap-1 text-[12px] text-[var(--status-success)]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            完成
          </span>
        )}
      </div>
      {/* 代码内容 */}
      <div className="p-3.5 bg-[#1e1e2e] text-[#cdd6f4] font-mono text-[12.5px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
