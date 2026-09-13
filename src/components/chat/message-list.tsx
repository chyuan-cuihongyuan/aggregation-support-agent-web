/**
 * 消息列表组件
 *
 * ChatGPT 风格：居中显示，最大宽度 3xl
 */

"use client";

import { MessageBubble } from "./message-bubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAutoScroll } from "@/hooks/use-auto-scroll";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  // 跟随滚动（SELFLOOP2 loop-243）：贴底才自动滚，上翻阅读不拉回
  const { containerRef, bottomRef, handleScroll } = useAutoScroll([messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">开始对话</p>
          <p className="text-sm">选择一个智能体并发送消息</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div ref={containerRef} onScroll={handleScroll} className="w-full max-w-3xl mx-auto">
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              id={message.id}
              role={message.role}
              content={message.content}
              isStreaming={message.isStreaming}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </ScrollArea>
  );
}
