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
  /** 智能体切换回调（由页面层处理状态更新） */
  onAgentChange?: (agentId: string, agentName: string) => void;
}

export function useSessionManager({
  userId,
  agentId,
  onMessageComplete,
  onAgentChange,
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
  // 标志位：加载历史对话触发智能体切换时，跳过自动创建新会话的副作用
  const skipAgentEffectRef = useRef(false);

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

      // 检查历史对话的智能体是否与当前不同，自动切换
      const needAgentSwitch = history.agentId && history.agentId !== agentId;
      if (needAgentSwitch && onAgentChange) {
        // 设置标志位，防止智能体切换 effect 创建新会话并清空消息
        skipAgentEffectRef.current = true;
        // 同步更新 prevAgentIdRef，让 effect 检测不到"变化"
        prevAgentIdRef.current = history.agentId;
        // 通知父组件切换智能体（这会导致 agentId prop 更新）
        onAgentChange(history.agentId, history.agentName);
      }

      // 加载会话缓存
      await loadSession(history.sessionId, messages);
      // 加载消息到对话显示
      loadConversation(historyItems);
    },
    [histories, loadSession, loadConversation, agentId, onAgentChange]
  );

  // 初始化时创建新会话（仅在 agentId 非空且用户已登录时）
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!currentSessionId && !isSwitching && agentId && !initializedRef.current) {
      initializedRef.current = true;
      createNewSession(false);
    }
  }, [currentSessionId, isSwitching, createNewSession, agentId]);

  // 智能体切换时创建新会话（加载历史对话触发的切换除外）
  useEffect(() => {
    // 加载历史对话触发的智能体切换，跳过创建新会话
    if (skipAgentEffectRef.current) {
      skipAgentEffectRef.current = false;
      prevAgentIdRef.current = agentId;
      return;
    }
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
