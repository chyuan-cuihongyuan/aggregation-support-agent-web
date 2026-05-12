/**
 * 消息气泡组件
 *
 * 显示用户或 AI 的消息内容
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
        isUser ? "bg-primary" : "bg-muted"
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-primary-foreground" />
        ) : (
          <Bot className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "flex flex-col items-end" : ""}`}>
        <div className={`rounded-lg px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
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
            <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-1" />
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
