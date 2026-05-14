/**
 * 会话标题栏
 *
 * 显示当前会话标题、模型信息和操作按钮
 */

"use client";

import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionHeaderProps {
  /** 会话标题 */
  title?: string;
  /** 模型信息 */
  modelInfo?: string;
  /** 会话 ID */
  sessionId?: string;
}

export function SessionHeader({ title, modelInfo, sessionId }: SessionHeaderProps) {
  if (!title && !sessionId) return null;

  return (
    <div className="px-6 py-3 border-b border-[var(--chat-border)] flex items-center justify-between">
      <div>
        {title && (
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h2>
        )}
        {modelInfo && (
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{modelInfo}</p>
        )}
      </div>
      <div className="flex gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px] gap-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        >
          <Download className="w-3.5 h-3.5" />
          导出
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px] gap-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        >
          <Share2 className="w-3.5 h-3.5" />
          分享
        </Button>
      </div>
    </div>
  );
}
