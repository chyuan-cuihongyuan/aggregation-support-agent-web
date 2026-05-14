/**
 * 消息气泡组件
 *
 * 用户消息：红色背景气泡，右对齐
 * AI 消息：卡片式，左对齐，支持 Markdown 渲染
 */

"use client";

import { Bot, User } from "lucide-react";
import { marked } from "marked";
import { memo } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const MessageBubble = memo(({ role, content, isStreaming }: MessageBubbleProps) => {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} group`}>
      {/* 头像 */}
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold ${
          isUser
            ? "bg-[var(--brand-accent)] text-white"
            : "bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        {/* 发送者名称 */}
        <div className={`flex items-center gap-2 mb-1 text-[13px] font-semibold ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[var(--text-primary)]">
            {isUser ? "Admin" : "AI"}
          </span>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-[var(--brand-accent)] text-white rounded-[12px_12px_4px_12px]"
              : "bg-[var(--chat-ai-bubble)] border border-[var(--border-default)] dark:border-[#2a2a3a] text-[var(--chat-ai-text)]"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{content}</p>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) as string }}
            />
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current/50 animate-pulse ml-1" />
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
