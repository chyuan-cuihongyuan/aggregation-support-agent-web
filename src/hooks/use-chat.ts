/**
 * 对话 Hook
 *
 * 管理对话消息、SSE 流式响应
 * 会话管理由 useSession Hook 负责
 */

import { useState, useCallback, useRef } from "react";
import { requestSSE } from "@/lib/api";
import type { Message } from "@/components/chat/message-list";

interface UseChatOptions {
  userId: string;
  agentId: string;
  /** 从 useSession 传入的会话 ID */
  sessionId?: string | null;
  /** 标记未保存状态 */
  setHasUnsavedChanges?: (value: boolean) => void;
  onMessageComplete?: (message: Message) => void;
}

export function useChat({
  userId,
  agentId,
  sessionId,
  setHasUnsavedChanges,
  onMessageComplete,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingBufferRef = useRef<string>("");

  const processChunk = useCallback((chunk: string, messageId: string) => {
    streamingBufferRef.current += chunk;
    // 直接更新消息内容，实现实时显示
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: streamingBufferRef.current }
          : msg
      )
    );
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);

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

      // 标记有未保存更改
      setHasUnsavedChanges?.(true);

      try {
        // SSE 流式响应（使用传入的 sessionId，不再每次创建新会话）
        await requestSSE(
          "/api/v1/chat_stream",
          { agentId, userId, sessionId, message: content },
          (chunk) => {
            processChunk(chunk, aiMessageId);
          }
        );

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
    [userId, agentId, sessionId, setHasUnsavedChanges, onMessageComplete, processChunk]
  );

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 加载历史对话
  const loadConversation = useCallback((historyItems: Array<{ question: string; answer: string }>) => {
    const loadedMessages: Message[] = [];
    historyItems.forEach((item, index) => {
      loadedMessages.push({
        id: `history-q-${index}-${Date.now()}`,
        role: "user",
        content: item.question,
      });
      loadedMessages.push({
        id: `history-a-${index}-${Date.now()}`,
        role: "assistant",
        content: item.answer,
      });
    });
    setMessages(loadedMessages);
  }, []);

  // 发送 AIOps 分析请求
  const sendAiOps = useCallback(async (aiOpsAgentId: string) => {
    const effectiveAgentId = aiOpsAgentId || agentId || "200002";

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "请分析当前所有活动告警并生成运维报告",
    };
    setMessages((prev) => [...prev, userMessage]);

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
      await requestSSE(
        "/api/v1/ai_ops",
        {
          agentId: effectiveAgentId,
          userId,
          alertDescription: "请分析当前所有活动告警并生成运维报告",
        },
        (chunk) => {
          processChunk(chunk, aiMessageId);
        }
      );

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

      return { question: "请分析当前所有活动告警并生成运维报告", answer: finalContent };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "AIOps 分析失败";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: `错误: ${errorMessage}`, isStreaming: false }
            : msg
        )
      );
      return null;
    } finally {
      setIsStreaming(false);
    }
  }, [userId, agentId, onMessageComplete, processChunk]);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
    loadConversation,
    sendAiOps,
  };
}
