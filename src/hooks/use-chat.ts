/**
 * 对话 Hook
 *
 * 管理对话消息、SSE 流式响应和会话创建
 */

import { useState, useCallback, useRef } from "react";
import { requestJson, requestSSE } from "@/lib/api";
import type { Message } from "@/components/chat/message-list";

interface UseChatOptions {
  userId: string;
  agentId: string;
  onMessageComplete?: (message: Message) => void;
}

export function useChat({ userId, agentId, onMessageComplete }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
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
        const { sessionId: newSessionId } = await requestJson<{ sessionId: string }>("/api/v1/create_session", {
          method: "POST",
          body: JSON.stringify({ agentId, userId }),
        });
        setSessionId(newSessionId);

        // SSE 流式响应
        await requestSSE(
          "/api/v1/chat_stream",
          { agentId, userId, sessionId: newSessionId, message: content },
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

        // 对话历史保存已在页面层通过 onMessageComplete 回调实现
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
    const effectiveAgentId = aiOpsAgentId || agentId || "200002"; // 默认 AIOps 智能体 ID

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "请分析当前所有活动告警并生成运维报告",
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
      // SSE 流式响应
      await requestSSE(
        "/api/v1/ai_ops",
        {
          agentId: effectiveAgentId,
          userId,
          alertDescription: "请分析当前所有活动告警并生成运维报告",
        },
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
  }, [userId, agentId, onMessageComplete]);

  return {
    messages,
    isStreaming,
    sessionId,
    sendMessage,
    clearMessages,
    loadConversation,
    sendAiOps,
  };
}
