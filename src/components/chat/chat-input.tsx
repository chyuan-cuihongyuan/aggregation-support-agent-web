/**
 * 对话输入框组件
 *
 * ChatGPT 风格：大圆角、阴影、居中布局
 */

"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
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
      <div className="flex items-end gap-2">
        {/* 预留插件按钮位置 */}
        <div className="w-10 h-10 flex-shrink-0" />

        {/* 输入框 */}
        <div className="flex-1 rounded-3xl border border-border/50 shadow-sm bg-background">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
            className="min-h-[48px] max-h-[200px] resize-none border-0 focus-visible:ring-0 rounded-3xl px-4"
            disabled={disabled}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="flex-shrink-0 rounded-full h-12 w-12"
          size="icon"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
