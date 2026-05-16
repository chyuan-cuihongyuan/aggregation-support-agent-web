/**
 * 会话管理 Hook
 *
 * 管理会话状态、创建新会话、加载历史会话
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { requestJson } from "@/lib/api";
import { generateTempSessionId } from "@/utils/session-utils";

interface UseSessionOptions {
  /** 用户 ID */
  userId: string;
  /** 智能体 ID */
  agentId: string;
  /** 会话变更回调 */
  onSessionChange?: (sessionId: string) => void;
  /** 保存当前会话的函数（由外部提供） */
  saveCurrentSession?: () => Promise<void>;
}

export function useSession({
  userId,
  agentId,
  onSessionChange,
  saveCurrentSession,
}: UseSessionOptions) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // 用 ref 跟踪状态，避免闭包问题
  const isSwitchingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const saveCurrentSessionRef = useRef(saveCurrentSession);

  // 在 effect 中同步 ref，避免 React 19 的渲染期间更新 ref 警告
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);
  useEffect(() => {
    saveCurrentSessionRef.current = saveCurrentSession;
  }, [saveCurrentSession]);

  const setHasUnsavedChangesSafe = useCallback((value: boolean) => {
    setHasUnsavedChanges(value);
    hasUnsavedChangesRef.current = value;
  }, []);

  // 创建新会话
  const createNewSession = useCallback(async (shouldSaveCurrent = true) => {
    if (isSwitchingRef.current) return null;

    isSwitchingRef.current = true;
    setIsSwitching(true);
    try {
      // 自动保存当前会话
      if (shouldSaveCurrent && hasUnsavedChangesRef.current && saveCurrentSessionRef.current) {
        await saveCurrentSessionRef.current();
      }

      // 调用后端创建新会话
      const { sessionId } = await requestJson<{ sessionId: string }>("/api/v1/create_session", {
        method: "POST",
        body: JSON.stringify({ agentId, userId }),
      });

      setCurrentSessionId(sessionId);
      setHasUnsavedChangesSafe(false);

      onSessionChange?.(sessionId);
      return sessionId;
    } catch {
      // 降级策略：生成临时会话 ID
      const tempSessionId = generateTempSessionId();
      setCurrentSessionId(tempSessionId);
      setHasUnsavedChangesSafe(false);

      onSessionChange?.(tempSessionId);
      return tempSessionId;
    } finally {
      isSwitchingRef.current = false;
      setIsSwitching(false);
    }
  }, [userId, agentId, onSessionChange, setHasUnsavedChangesSafe]);

  // 加载历史会话
  const loadSession = useCallback(async (sessionId: string) => {
    if (isSwitchingRef.current) return;

    isSwitchingRef.current = true;
    setIsSwitching(true);
    try {
      // 自动保存当前会话
      if (hasUnsavedChangesRef.current && saveCurrentSessionRef.current) {
        await saveCurrentSessionRef.current();
      }

      setCurrentSessionId(sessionId);
      setHasUnsavedChangesSafe(false);

      onSessionChange?.(sessionId);
    } finally {
      isSwitchingRef.current = false;
      setIsSwitching(false);
    }
  }, [onSessionChange, setHasUnsavedChangesSafe]);

  return {
    currentSessionId,
    hasUnsavedChanges,
    setHasUnsavedChanges: setHasUnsavedChangesSafe,
    isSwitching,
    createNewSession,
    loadSession,
  };
}
