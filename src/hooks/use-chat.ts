/**
 * 对话 Hook
 *
 * 管理对话消息、SSE 流式响应
 * 会话 ID 由外部（useSession）传入，不再内部创建
 */

import { useState, useCallback, useRef } from "react";
import { requestSSE } from "@/lib/api";
import type { Message } from "@/types/api";
import { historyItemsToMessages } from "@/utils/session-utils";

interface UseChatOptions {
  userId: string;
  agentId: string;
  /** 当前会话 ID（由 useSession 管理） */
  sessionId?: string | null;
  /** 标记未保存状态的回调 */
  setHasUnsavedChanges?: (value: boolean) => void;
  onMessageComplete?: (message: Message) => void;
}

export function useChat({ userId, agentId, sessionId, setHasUnsavedChanges, onMessageComplete }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingBufferRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      // 检查 sessionId 是否可用
      if (!sessionId) {
        console.warn("[useChat] 无可用的 sessionId，请先创建会话");
        return;
      }

      // 检查消息是否为空
      if (!content.trim()) return;

      // 标记未保存状态
      setHasUnsavedChanges?.(true);

      // 添加用户消息
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

      // 创建新的 AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 标记有未保存更改
      setHasUnsavedChanges?.(true);

      try {
        // SSE 流式响应（使用传入的 sessionId）
        await requestSSE(
          "/api/v1/chat_stream",
          { agentId, userId, sessionId, message: content },
          (chunk) => {
            processChunk(chunk, aiMessageId);
          },
          abortController.signal
        );

        // 如果不是被取消的，更新最终内容
        if (!abortController.signal.aborted) {
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
        }
      } catch (error) {
        // 如果是取消操作，不显示错误
        if (abortController.signal.aborted) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: streamingBufferRef.current + "\n\n[已停止生成]", isStreaming: false }
                : msg
            )
          );
        } else {
          const errorMessage = error instanceof Error ? error.message : "发送失败";
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: `错误: ${errorMessage}`, isStreaming: false }
                : msg
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
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
    const loadedMessages = historyItemsToMessages(historyItems);
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

    // 创建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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
        },
        abortController.signal
      );

      // 如果不是被取消的，更新最终内容
      if (!abortController.signal.aborted) {
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
      }
      return null;
    } catch (error) {
      // 如果是取消操作，不显示错误
      if (abortController.signal.aborted) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: streamingBufferRef.current + "\n\n[已停止生成]", isStreaming: false }
              : msg
          )
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : "AIOps 分析失败";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: `错误: ${errorMessage}`, isStreaming: false }
              : msg
          )
        );
      }
      return null;
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [userId, agentId, onMessageComplete, processChunk]);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopGeneration,
    clearMessages,
    loadConversation,
    sendAiOps,
  };
}
