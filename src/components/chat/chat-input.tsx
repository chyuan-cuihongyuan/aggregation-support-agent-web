/**
 * 对话输入框组件
 *
 * 底部居中浮动，带标签栏（对话/SSH/本地执行/AIOps）
 */

"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentConfig } from "@/types/api";

/** 输入模式 */
export type InputMode = "chat" | "ssh" | "local" | "aiops";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  agents: AgentConfig[];
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
  /** 当前输入模式 */
  activeMode?: InputMode;
  /** 模式切换 */
  onModeChange?: (mode: InputMode) => void;
}

const MODES: { key: InputMode; label: string }[] = [
  { key: "chat", label: "对话" },
  { key: "ssh", label: "SSH" },
  { key: "local", label: "本地执行" },
  { key: "aiops", label: "AIOps" },
];

export function ChatInput({
  onSend,
  disabled,
  agents,
  selectedAgentId,
  onAgentChange,
  activeMode = "chat",
  onModeChange,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div className="rounded-2xl border border-[var(--chat-border)] bg-[var(--surface-main)] overflow-hidden shadow-lg shadow-black/[0.03] dark:shadow-black/20 focus-within:border-[var(--brand-accent)] focus-within:ring-2 focus-within:ring-[var(--brand-accent)]/10 transition-all">
        {/* 输入区域 */}
        <div className="flex items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，按 Enter 发送..."
            className="min-h-[52px] max-h-[200px] resize-none border-0 focus-visible:ring-0 rounded-t-2xl px-4 py-3 text-[14px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            disabled={disabled}
          />
          <Button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="shrink-0 rounded-xl h-10 w-10 mr-2 mb-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white shadow-none disabled:opacity-40"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--chat-border)] bg-[var(--surface-card)]">
          <div className="flex items-center gap-1.5">
            {MODES.map((mode) => (
              <button
                key={mode.key}
                onClick={() => onModeChange?.(mode.key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeMode === mode.key
                    ? "bg-[var(--brand-accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* 智能体选择器 */}
          <Select value={selectedAgentId} onValueChange={onAgentChange}>
            <SelectTrigger className="h-7 w-auto min-w-[120px] max-w-[200px] border-0 bg-transparent hover:bg-[var(--surface-hover)] text-[12px] gap-1 px-2 shadow-none focus:ring-0 text-[var(--text-secondary)]">
              <SelectValue placeholder="选择智能体" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.agentId} value={agent.agentId} className="text-[12px]">
                  {agent.agentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 快捷键提示 */}
        <div className="text-center text-[11px] text-[var(--text-muted)]">
          <span className="text-[var(--text-muted)]">Ctrl + Enter</span>
          <span className="mx-1">·</span>
          <span className="text-[var(--text-muted)]">Shift + Enter</span>
          <span className="mx-1">·</span>
          <span className="text-[var(--text-muted)]">AI 可能产生不准确的信息，请注意甄别</span>
        </div>
      </div>
    </div>
  );
}
