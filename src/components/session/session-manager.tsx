/**
 * 会话管理器 Hook
 *
 * 协调 useSession、useChat 和 useHistory 的交互，
 * 提供统一的会话管理接口。
 * onMessageComplete 的保存逻辑保持在 page.tsx 中处理。
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "@/hooks/use-session";
import { useChat } from "@/hooks/use-chat";
import { useHistory } from "@/hooks/use-history";
import { historyItemsToMessages } from "@/utils/session-utils";
import type { ChatHistoryDTO, Message } from "@/types/api";

interface UseSessionManagerOptions {
  /** 用户 ID */
  userId: string;
  /** 智能体 ID */
  agentId: string;
  /** 智能体名称 */
  agentName: string;
  /** 消息完成回调（由页面层处理保存逻辑） */
  onMessageComplete?: (message: Message, sessionId?: string, question?: string) => void;
}

export function useSessionManager({
  userId,
  agentId,
  onMessageComplete,
}: UseSessionManagerOptions) {
  // ---- 历史记录管理 ----
  const {
    histories,
    groupedHistories,
    viewMode,
    setViewMode,
    isLoading: historyLoading,
    saveHistory,
    deleteHistory,
    clearAllHistories,
  } = useHistory({ userId });

  // ---- 会话管理 ----
  const {
    currentSessionId,
    setHasUnsavedChanges,
    isSwitching,
    createNewSession,
    loadSession,
    adoptSessionId,
  } = useSession({
    userId,
    agentId,
  });

  // ---- 对话管理 ----
  const {
    messages,
    isStreaming,
    sendMessage,
    stopGeneration,
    clearMessages,
    loadConversation,
    sendAiOps,
  } = useChat({
    userId,
    agentId,
    sessionId: currentSessionId,
    setHasUnsavedChanges,
    onSessionId: adoptSessionId,
    onMessageComplete,
  });

  // 追踪上一次 agentId，用于检测智能体切换
  const prevAgentIdRef = useRef(agentId);

  // 创建新会话（清空消息）
  const handleNewChat = useCallback(async () => {
    await createNewSession(true);
    clearMessages();
  }, [createNewSession, clearMessages]);

  // 加载历史会话
  const handleLoadHistory = useCallback(
    async (history: ChatHistoryDTO) => {
      // 获取该会话的所有消息
      const sessionHistories = histories.filter(
        (h) => h.sessionId === history.sessionId
      );
      const historyItems = sessionHistories.map((h) => ({
        question: h.question,
        answer: h.answer,
      }));

      // 转换一次，避免重复转换
      const messages = historyItemsToMessages(historyItems);
      
      // 加载会话缓存
      await loadSession(history.sessionId, messages);
      // 加载消息到对话显示
      loadConversation(historyItems);
    },
    [histories, loadSession, loadConversation]
  );

  // 初始化时创建新会话（仅在 agentId 非空且用户已登录时）
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!currentSessionId && !isSwitching && agentId && !initializedRef.current) {
      initializedRef.current = true;
      createNewSession(false);
    }
  }, [currentSessionId, isSwitching, createNewSession, agentId]);

  // 智能体切换时创建新会话
  useEffect(() => {
    if (prevAgentIdRef.current && prevAgentIdRef.current !== agentId) {
      createNewSession(true);
      clearMessages();
    }
    prevAgentIdRef.current = agentId;
  }, [agentId, createNewSession, clearMessages]);

  return {
    // 会话状态
    currentSessionId,
    isSwitching,

    // 消息
    messages,
    isStreaming,
    sendMessage,
    stopGeneration,
    sendAiOps,

    // 历史
    histories,
    groupedHistories,
    viewMode,
    setViewMode,
    historyLoading,
    saveHistory,
    deleteHistory,
    clearAllHistories,

    // 操作
    handleNewChat,
    handleLoadHistory,
  };
}
