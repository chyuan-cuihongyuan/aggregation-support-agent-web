/**
 * 消息气泡组件
 *
 * 用户消息：红色背景气泡，右对齐
 * AI 消息：卡片式，左对齐，支持 Markdown 渲染
 * 新增：时间戳、工具调用结果卡片、代码块语法高亮
 */

"use client";

import { Bot, User, Terminal, Activity, Copy, Check } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportActions } from "./export-actions";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
}

/** 工具调用结果卡片 */
function ToolResultCard({ toolName, command, result }: { toolName: string; command?: string; result: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 bg-[var(--surface-card)] border border-[var(--chat-border)] rounded-lg overflow-hidden">
      {/* 工具标签 */}
      <div className="px-3 py-2 border-b border-[var(--chat-border)] flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-hover)] px-2 py-1 rounded">
          <Terminal className="w-3 h-3" />
          工具调用 · {toolName}
        </span>
        {command && (
          <span className="truncate text-[11px] text-[var(--text-muted)] font-mono">
            {command}
          </span>
        )}
      </div>

      {/* 结果内容 */}
      <div className="relative">
        <pre className="p-3 text-[13px] font-mono leading-relaxed text-[var(--text-primary)] bg-[#0d0d15] dark:bg-[#0d0d15] overflow-x-auto">
          <code>{result}</code>
        </pre>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-6 px-2 text-[11px] gap-1 bg-[var(--surface-main)] hover:bg-[var(--surface-hover)] border border-[var(--chat-border)]"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
    </div>
  );
}

/** 系统指标分析卡片 */
function AnalysisCard() {
  return (
    <div className="mt-3 bg-[var(--surface-card)] border border-[var(--chat-border)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-[var(--brand-accent)]" />
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">系统指标概览</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="CPU 使用率" value="87.3%" status="danger" change="+12%" />
        <MetricCard label="内存使用" value="74.3%" status="warning" change="+5%" />
        <MetricCard label="磁盘 I/O" value="23.1%" status="normal" change="-3%" />
      </div>
    </div>
  );
}

/** 单个指标卡片 */
function MetricCard({ label, value, status, change }: { label: string; value: string; status: "danger" | "warning" | "normal"; change: string }) {
  const statusColors = {
    danger: "text-[var(--status-error)]",
    warning: "text-[var(--status-warning)]",
    normal: "text-[var(--status-success)]",
  };

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--chat-border)] rounded-lg p-3">
      <div className="text-[11px] text-[var(--text-muted)] mb-1">{label}</div>
      <div className={`text-[20px] font-bold ${statusColors[status]}`}>{value}</div>
      <div className="text-[11px] text-[var(--text-muted)] mt-1">{change} 较昨日</div>
    </div>
  );
}

export const MessageBubble = memo(({ id, role, content, isStreaming, timestamp }: MessageBubbleProps) => {
  const isUser = role === "user";
  const now = timestamp || new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex gap-3 px-6 py-4 hover:bg-[rgba(255,255,255,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors ${isUser ? "flex-row-reverse" : ""} group`}>
      {/* 头像 */}
      <div
        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold ${
          isUser
            ? "bg-[var(--brand-accent)] text-white"
            : "bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[800px] ${isUser ? "flex flex-col items-end" : ""}`}>
        {/* 发送者名称和时间 */}
        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">
            {isUser ? "Admin" : "Claude"}
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">{now}</span>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-[var(--brand-accent)] text-white rounded-[12px_12px_4px_12px]"
              : "border border-[var(--chat-border)] text-[var(--chat-ai-text)]"
          }`}
          style={
            !isUser
              ? { background: "var(--chat-ai-bubble)", color: "var(--chat-ai-text)" }
              : undefined
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{content}</p>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed [&_pre]:bg-[#0d0d15] [&_pre]:text-[#cdd6f4] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-[var(--chat-border)] [&_code]:text-[#f0abfc] [&_code]:bg-[var(--surface-card)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content, { async: false, gfm: true, breaks: true }) as string) }}
            />
          )}
          {isStreaming && (
            <span className="inline-block w-[3px] h-[18px] bg-[var(--brand-accent)] animate-pulse ml-0.5 rounded-sm align-text-bottom" />
          )}
        </div>

        {/* 示例：如果是 AI 消息且包含工具调用，显示工具结果卡片 */}
        {!isUser && content.includes("SSH") && content.includes("top") && (
          <ToolResultCard
            toolName="ssh_shell"
            result="$ top -bn1 | head -20
top - 14:23:01 up 45 days, 3:21
Tasks: 186 total, 3 running
%Cpu(s): 87.3 us, 4.2 sy
MiB Mem: 32768.0 total

PID  USER   %CPU  %MEM  COMMAND
2847 java    78.2  12.1  app-server.jar
3192 node    5.4   3.2   worker.js"
          />
        )}

        {/* 示例：系统指标分析 */}
        {!isUser && content.includes("性能") && content.includes("CPU") && (
          <AnalysisCard />
        )}

        {/* 导出操作 - 仅 AI 消息且非流式状态时显示 */}
        {!isUser && !isStreaming && content && (
          <ExportActions content={content} messageId={id} />
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
