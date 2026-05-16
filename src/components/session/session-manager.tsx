/**
 * 会话管理器
 *
 * 连接 useSession、useChat 和 useHistory，协调会话状态
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "@/hooks/use-session";
import { useChat } from "@/hooks/use-chat";
import { useHistory } from "@/hooks/use-history";
import type { Message } from "@/components/chat/message-list";
import type { ChatHistoryDTO } from "@/types/api";

interface UseSessionManagerOptions {
  userId: string;
  agentId: string;
  agentName: string;
  onMessageComplete?: () => void;
}

export function useSessionManager({ userId, agentId, agentName, onMessageComplete }: UseSessionManagerOptions) {
  const { histories, groupedHistories, viewMode, setViewMode, saveHistory, deleteHistory } = useHistory({ userId });

  // 用 ref 跟踪最新值，避免闭包问题
  const messagesRef = useRef<Message[]>([]);
  const currentSessionIdRef = useRef<string | null>(null);
  const pendingQuestionRef = useRef<string>("");
  const agentIdRef = useRef(agentId);
  const agentNameRef = useRef(agentName);
  const userIdRef = useRef(userId);
  const saveHistoryRef = useRef(saveHistory);
  const setHasUnsavedChangesRef = useRef<(value: boolean) => void>(() => {});

  // 在 effect 中同步 ref
  useEffect(() => { agentIdRef.current = agentId; }, [agentId]);
  useEffect(() => { agentNameRef.current = agentName; }, [agentName]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { saveHistoryRef.current = saveHistory; }, [saveHistory]);

  // 保存当前会话的实际实现
  const handleSaveCurrentSession = useCallback(async () => {
    const msgs = messagesRef.current;
    const sid = currentSessionIdRef.current;
    const question = pendingQuestionRef.current;

    if (!sid || msgs.length < 2 || !question) return;

    // 找到最后的 AI 回复
    const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    await saveHistoryRef.current({
      userId: userIdRef.current,
      agentId: agentIdRef.current,
      agentName: agentNameRef.current,
      sessionId: sid,
      question,
      answer: lastAssistant.content,
    });

    setHasUnsavedChangesRef.current(false);
    pendingQuestionRef.current = "";
  }, []);

  const {
    currentSessionId,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSwitching,
    createNewSession,
    loadSession,
  } = useSession({
    userId,
    agentId,
    saveCurrentSession: handleSaveCurrentSession,
  });

  // 同步 setHasUnsavedChanges ref
  useEffect(() => {
    setHasUnsavedChangesRef.current = setHasUnsavedChanges;
  }, [setHasUnsavedChanges]);

  // 同步 sessionId ref
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
    loadConversation,
    sendAiOps,
  } = useChat({
    userId,
    agentId,
    sessionId: currentSessionId,
    setHasUnsavedChanges,
    onMessageComplete: async (message) => {
      const question = pendingQuestionRef.current;
      if (question && message.role === "assistant") {
        await saveHistoryRef.current({
          userId: userIdRef.current,
          agentId: agentIdRef.current,
          agentName: agentNameRef.current,
          sessionId: currentSessionIdRef.current || "",
          question,
          answer: message.content,
        });
        setHasUnsavedChanges(false);
        pendingQuestionRef.current = "";
        onMessageComplete?.();
      }
    },
  });

  // 同步 messages ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 初始化时创建新会话
  useEffect(() => {
    if (!currentSessionId && !isSwitching) {
      createNewSession(false);
    }
  }, [currentSessionId, isSwitching, createNewSession]);

  // 新建对话
  const handleNewChat = useCallback(async () => {
    await createNewSession(true);
    clearMessages();
  }, [createNewSession, clearMessages]);

  // 发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    pendingQuestionRef.current = content;
    await sendMessage(content);
  }, [sendMessage]);

  // 加载历史会话
  const handleLoadHistory = useCallback(async (history: ChatHistoryDTO) => {
    const sessionHistories = histories.filter(
      (h) => h.sessionId === history.sessionId
    );

    if (sessionHistories.length > 0) {
      const historyItems = sessionHistories.map((h) => ({
        question: h.question,
        answer: h.answer,
      }));
      loadConversation(historyItems);
    } else {
      loadConversation([{ question: history.question, answer: history.answer }]);
    }

    await loadSession(history.sessionId);
  }, [histories, loadConversation, loadSession]);

  return {
    // 会话状态
    currentSessionId,
    hasUnsavedChanges,
    isSwitching,

    // 消息状态
    messages,
    isStreaming,

    // 历史状态
    histories,
    groupedHistories,
    viewMode,
    setViewMode,

    // 方法
    handleNewChat,
    handleSendMessage,
    handleLoadHistory,
    sendAiOps,
    deleteHistory,
  };
}
