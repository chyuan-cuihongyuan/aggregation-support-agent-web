/**
 * 对话 Hook
 *
 * 管理对话消息、SSE 流式响应
 * 会话 ID 由外部（useSession）传入，不再内部创建
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { announce } from "@/lib/announce";
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
  /** 后端确认真实会话 ID 时回调 */
  onSessionId?: (sessionId: string) => void;
  onMessageComplete?: (message: Message, sessionId?: string, question?: string) => void;
}

/**
 * 逐字打字渲染器
 *
 * - 累积全部已接收文本到 buffer
 * - 使用 requestAnimationFrame 逐步推进可见光标
 * - 恒定速度推进：每帧固定步长，无论后端是真流式增量还是一次性整段返回，
 *   前端都按统一节奏逐字显示
 * - 仅当积压过多（buffer 远超光标）时按比例加速，避免长响应拖尾过久
 */
function useTypingRenderer(setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const bufferRef = useRef("");
  const cursorRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const advanceRef = useRef<((messageId: string) => void) | null>(null);

  /** 推进光标，逐字显示 */
  const advance = useCallback(
    (messageId: string) => {
      const buffer = bufferRef.current;
      const pending = buffer.length - cursorRef.current;

      if (pending <= 0) {
        rafRef.current = null;
        return;
      }

      // 恒定速度：每帧固定推进 CHARS_PER_FRAME 个字符（约 60fps → ~120 字/秒）。
      // 仅当积压超过 BACKLOG_THRESHOLD 时按比例追赶，防止一次性整段返回时拖尾过久。
      const CHARS_PER_FRAME = 2;
      const BACKLOG_THRESHOLD = 120;
      const step = pending > BACKLOG_THRESHOLD ? Math.ceil(pending / 30) : CHARS_PER_FRAME;
      cursorRef.current = Math.min(cursorRef.current + step, buffer.length);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: buffer.substring(0, cursorRef.current) } : msg
        )
      );

      rafRef.current = requestAnimationFrame(() => advanceRef.current?.(messageId));
    },
    [setMessages]
  );

  // 更新 advanceRef
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  /** 追加数据并启动动画 */
  const append = useCallback(
    (text: string, messageId: string) => {
      if (!text) return;
      bufferRef.current += text;
      if (!rafRef.current) {
        // 使用 advanceRef.current 确保引用最新的 advance 函数
        rafRef.current = requestAnimationFrame(() => advanceRef.current?.(messageId));
      }
    },
    [] // 不依赖 advance，通过 advanceRef 引用
  );

  /** 完成渲染：立即显示全部剩余文本 */
  const finish = useCallback(
    (messageId: string) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      cursorRef.current = bufferRef.current.length;
      const fullContent = bufferRef.current;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content: fullContent } : msg))
      );
      return fullContent;
    },
    [setMessages]
  );

  /** 重置状态，准备下一次流式渲染 */
  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    bufferRef.current = "";
    cursorRef.current = 0;
  }, []);

  /** 组件卸载时清理 RAF */
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { append, finish, reset };
}

export function useChat({
  userId,
  agentId,
  sessionId,
  setHasUnsavedChanges,
  onSessionId,
  onMessageComplete,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const typer = useTypingRenderer(setMessages);

  // 组件卸载时中断在途流请求（SELFLOOP2 loop-221：此前只清打字机 RAF，
  // 在途 SSE 会继续消耗网络并在卸载后 setState）
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      typer.reset();
    }
  }, [typer]);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      // 检查 sessionId 是否可用
      if (!sessionId) {
        // 显示错误消息而不是静默失败
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "会话未就绪，请稍后再试或点击「新对话」创建会话",
        };
        setMessages((prev) => [...prev, errorMessage]);
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
      typer.reset();

      // 创建新的 AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      let effectiveSessionId = sessionId;

      try {
        // SSE 流式响应（使用传入的 sessionId）
        await requestSSE(
          "/api/v1/chat_stream",
          { agentId, userId, sessionId, message: content },
          {
            onChunk: (chunk) => {
              typer.append(chunk, aiMessageId);
            },
            onSession: (session) => {
              const nextSessionId =
                typeof session === "string"
                  ? session
                  : (session as { sessionId?: string })?.sessionId;
              if (nextSessionId) {
                effectiveSessionId = nextSessionId;
                onSessionId?.(nextSessionId);
              }
            },
          },
          abortController.signal
        );

        // 如果不是被取消的，立即显示全部剩余内容
        if (!abortController.signal.aborted) {
          const finalContent = typer.finish(aiMessageId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, content: finalContent, isStreaming: false } : msg
            )
          );

          const finalMessage: Message = {
            id: aiMessageId,
            role: "assistant",
            content: finalContent,
          };
          onMessageComplete?.(finalMessage, effectiveSessionId || undefined, content);
        }
      } catch (error) {
        // 如果是取消操作，不显示错误
        if (abortController.signal.aborted) {
          const stoppedContent = typer.finish(aiMessageId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: stoppedContent + "\n\n[已停止生成]", isStreaming: false }
                : msg
            )
          );
        } else {
          typer.finish(aiMessageId);
          // 屏幕阅读器公告（loop-422/J1）：生成完成对辅助技术可见
          announce("回复生成完成");
          const errorMessage = error instanceof Error ? error.message : "发送失败";
          announce("回复生成失败");
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
    [userId, agentId, sessionId, setHasUnsavedChanges, onSessionId, onMessageComplete, typer]
  );

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // 加载历史对话
  const loadConversation = useCallback(
    (historyItems: Array<{ question: string; answer: string }>) => {
      const loadedMessages = historyItemsToMessages(historyItems);
      setMessages(loadedMessages);
    },
    []
  );

  // 发送 AIOps 分析请求
  const sendAiOps = useCallback(
    async (aiOpsAgentId: string) => {
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
      typer.reset();

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
            typer.append(chunk, aiMessageId);
          },
          abortController.signal
        );

        // 如果不是被取消的，立即显示全部剩余内容
        if (!abortController.signal.aborted) {
          const finalContent = typer.finish(aiMessageId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, content: finalContent, isStreaming: false } : msg
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
          const stoppedContent = typer.finish(aiMessageId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: stoppedContent + "\n\n[已停止生成]", isStreaming: false }
                : msg
            )
          );
        } else {
          typer.finish(aiMessageId);
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
    },
    [userId, agentId, onMessageComplete, typer]
  );

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
