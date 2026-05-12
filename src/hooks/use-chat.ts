/**
 * 对话 Hook
 *
 * 管理对话消息、SSE 流式响应和会话创建
 */

import { useState, useCallback, useRef } from "react";
import { requestJson, requestSSE } from "@/lib/api";
import { marked } from "marked";
import type { Message } from "@/components/chat/message-list";

interface UseChatOptions {
  userId: string;
  agentId: string;
  onMessageComplete?: (message: Message) => void;
}

export function useChat({ userId, agentId, onMessageComplete }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingBufferRef = useRef<string>("");
  const rafRef = useRef<number | undefined>(undefined);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);

      // 创建 AI 消息占位符
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };
      setMessages((prev) => [...prev, aiMessage]);

      setIsStreaming(true);
      streamingBufferRef.current = "";

      try {
        // 创建会话
        const { sessionId } = await requestJson<{ sessionId: string }>("/api/v1/create_session", {
          method: "POST",
          body: JSON.stringify({ agentId, userId }),
        });

        // SSE 流式响应
        await requestSSE(
          "/api/v1/chat_stream",
          { agentId, userId, sessionId, message: content },
          (chunk) => {
            streamingBufferRef.current += chunk;

            // 使用 requestAnimationFrame 节流渲染
            if (rafRef.current) {
              cancelAnimationFrame(rafRef.current);
            }
            rafRef.current = requestAnimationFrame(() => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: streamingBufferRef.current }
                    : msg
                )
              );
            });
          }
        );

        // 流结束，最终渲染
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        const finalContent = streamingBufferRef.current;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: finalContent, isStreaming: false }
              : msg
          )
        );

        const finalMessage: Message = {
          id: aiMessageId,
          role: "assistant",
          content: finalContent,
        };
        onMessageComplete?.(finalMessage);

        // TODO: 保存对话历史
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "发送失败";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: `错误: ${errorMessage}`, isStreaming: false }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [userId, agentId, onMessageComplete]
  );

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  };
}
