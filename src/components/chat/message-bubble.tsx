/**
 * 消息气泡组件
 *
 * ChatGPT 风格：用户消息有背景，AI 消息透明背景
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
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* 头像 */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
        isUser ? "bg-emerald-500 dark:bg-emerald-600" : "bg-muted"
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-emerald-500 dark:bg-emerald-600/90 text-white"
            : "bg-transparent text-zinc-800 dark:text-zinc-100"
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
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
