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
  const displayedContentRef = useRef<string>("");
  const typewriterTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingChunksRef = useRef<string[]>([]);

  // 打字机效果：逐字显示内容
  const startTypewriter = useCallback((messageId: string) => {
    // 如果已经存在定时器，则不重复启动
    if (typewriterTimerRef.current) {
      return;
    }

    // 启动定时器，每 30ms 显示一个字符
    typewriterTimerRef.current = setInterval(() => {
      const displayed = displayedContentRef.current;
      const targetContent = streamingBufferRef.current;

      // 如果当前显示的内容已经达到或超过目标内容，则停止
      if (displayed.length >= targetContent.length) {
        // 检查是否还有新的数据正在到达（通过比较 buffer 和 displayed）
        // 如果相等，说明没有新数据了，停止打字机效果
        if (displayed.length === targetContent.length) {
          if (typewriterTimerRef.current) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = undefined;
          }
        }
        return;
      }

      // 添加下一个字符
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

  // 处理新的数据块
  const processChunk = useCallback((chunk: string, messageId: string) => {
    streamingBufferRef.current += chunk;
    pendingChunksRef.current.push(chunk);

    // 如果打字机效果未启动，则启动它
    if (!typewriterTimerRef.current) {
      startTypewriter(messageId);
    }
  }, [startTypewriter]);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      // 检查 sessionId 是否可用
      if (!sessionId) {
        console.warn("[useChat] 无可用的 sessionId，请先创建会话");
        return;
      }

      // 标记未保存状态
      setHasUnsavedChanges?.(true);

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
      displayedContentRef.current = "";
      pendingChunksRef.current = [];

      try {
        // SSE 流式响应（使用传入的 sessionId）
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

        // 最终渲染
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
    displayedContentRef.current = "";
    pendingChunksRef.current = [];

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

      // 最终渲染
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
