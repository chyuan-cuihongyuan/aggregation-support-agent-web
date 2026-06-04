/**
 * 会话标题栏
 *
 * 显示当前会话标题、模型信息和操作按钮
 */

"use client";

import { Download, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SessionHeaderProps {
  /** 会话标题 */
  title?: string;
  /** 模型信息 */
  modelInfo?: string;
  /** 会话 ID */
  sessionId?: string;
  /** 新建对话回调 */
  onNewChat?: () => void;
}

export function SessionHeader({ title, modelInfo, sessionId, onNewChat }: SessionHeaderProps) {
  const handleExportSummary = () => {
    const lines = [
      `Title: ${title || "Untitled session"}`,
      modelInfo ? `Model: ${modelInfo}` : null,
      sessionId ? `SessionId: ${sessionId}` : null,
      `ExportedAt: ${new Date().toISOString()}`,
    ].filter(Boolean);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sessionId || "session"}-summary.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("会话摘要已导出");
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    if (sessionId) {
      url.searchParams.set("sessionId", sessionId);
    }
    await navigator.clipboard.writeText(url.toString());
    toast.success("会话链接已复制");
  };

  return (
    <div className="px-6 py-3 border-b border-[var(--chat-border)] flex flex-wrap items-center justify-between relative z-10 gap-3">
      <div className="min-w-0 flex-1">
        {title && (
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{title}</h2>
        )}
        {modelInfo && (
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">{modelInfo}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center justify-end">
        {onNewChat && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            className="h-7 px-2 text-[12px] gap-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--chat-border)] bg-[var(--surface-card)] relative z-20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            新建对话
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportSummary}
          className="h-7 px-2 text-[12px] gap-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--chat-border)] bg-[var(--surface-card)] shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          导出
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="h-7 px-2 text-[12px] gap-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--chat-border)] bg-[var(--surface-card)] shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          分享
        </Button>
      </div>
    </div>
  );
}
