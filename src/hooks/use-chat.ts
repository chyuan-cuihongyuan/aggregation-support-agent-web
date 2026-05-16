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
  const displayedContentRef = useRef<string>("");
  const typewriterTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingChunksRef = useRef<string[]>([]);

  // 打字机效果：逐字显示内容
  const startTypewriter = useCallback((messageId: string) => {
    if (typewriterTimerRef.current) {
      return;
    }

    typewriterTimerRef.current = setInterval(() => {
      const displayed = displayedContentRef.current;
      const targetContent = streamingBufferRef.current;

      if (displayed.length >= targetContent.length) {
        if (displayed.length === targetContent.length) {
          if (typewriterTimerRef.current) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = undefined;
          }
        }
        return;
      }

      const nextChar = targetContent[displayed.length];
      displayedContentRef.current = displayed + nextChar;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: displayedContentRef.current }
            : msg
        )
      );
    }, 30);
  }, []);

  const processChunk = useCallback((chunk: string, messageId: string) => {
    streamingBufferRef.current += chunk;
    pendingChunksRef.current.push(chunk);

    if (!typewriterTimerRef.current) {
      startTypewriter(messageId);
    }
  }, [startTypewriter]);

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
      displayedContentRef.current = "";
      pendingChunksRef.current = [];

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

        // 流结束，等待打字机效果完成
        const waitForTypewriter = () => {
          return new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
              if (!typewriterTimerRef.current) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
          });
        };

        await waitForTypewriter();

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
    displayedContentRef.current = "";
    pendingChunksRef.current = [];

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

      const waitForTypewriter = () => {
        return new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!typewriterTimerRef.current) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      };

      await waitForTypewriter();

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
