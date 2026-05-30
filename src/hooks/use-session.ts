/**
 * 会话管理 Hook
 *
 * 管理会话状态、创建新会话、加载历史会话。
 * 提供并发保护（isSwitching）和降级策略（临时 sessionId）。
 */

import { useState, useCallback, useRef } from "react";
import { requestJson } from "@/lib/api";
import { chatSessionCache } from "@/lib/session-storage";
import { generateTempSessionId } from "@/utils/session-utils";
import type { SessionCacheData, Message } from "@/types/api";

interface UseSessionOptions {
  /** 智能体 ID */
  agentId: string;
  /** 会话变更回调 */
  onSessionChange?: (sessionId: string) => void;
  /** 保存当前会话的函数（由外部提供） */
  saveCurrentSession?: () => Promise<void>;
}

export function useSession({
  agentId,
  onSessionChange,
  saveCurrentSession,
}: UseSessionOptions) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionCache, setSessionCache] = useState<Map<string, SessionCacheData>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // 使用 ref 追踪可变状态，避免闭包陷阱
  const isSwitchingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);

  const setHasUnsavedChangesSafe = useCallback((value: boolean) => {
    hasUnsavedChangesRef.current = value;
    setHasUnsavedChanges(value);
  }, []);

  /** 创建新会话 */
  const createNewSession = useCallback(async (shouldSaveCurrent = true) => {
    if (isSwitchingRef.current) {
      console.warn("[useSession] 正在切换会话，忽略创建请求");
      return null;
    }

    isSwitchingRef.current = true;
    setIsSwitching(true);
    try {
      // 自动保存当前会话
      if (shouldSaveCurrent && hasUnsavedChangesRef.current && saveCurrentSession) {
        console.log("[useSession] 自动保存当前会话");
        await saveCurrentSession();
      }

      console.log("[useSession] 创建新会话", { agentId });
      const { sessionId } = await requestJson<{ sessionId: string }>(
        "/api/v1/create_session",
        { method: "POST", body: JSON.stringify({ agentId }) }
      );

      setCurrentSessionId(sessionId);
      setHasUnsavedChangesSafe(false);
      setSessionCache(new Map());
      chatSessionCache.clear();

      console.log("[useSession] 新会话创建成功", { sessionId });
      onSessionChange?.(sessionId);
      return sessionId;
    } catch (error) {
      console.error("[useSession] 创建会话失败", error);
      const tempSessionId = generateTempSessionId();
      setCurrentSessionId(tempSessionId);
      setHasUnsavedChangesSafe(false);
      setSessionCache(new Map());
      chatSessionCache.clear();

      console.warn("[useSession] 使用临时会话 ID", { tempSessionId });
      onSessionChange?.(tempSessionId);
      return tempSessionId;
    } finally {
      isSwitchingRef.current = false;
      setIsSwitching(false);
    }
  }, [agentId, saveCurrentSession, onSessionChange, setHasUnsavedChangesSafe]);

  /** 加载历史会话 */
  const loadSession = useCallback(async (sessionId: string, messages: Message[]) => {
    if (isSwitchingRef.current) {
      console.warn("[useSession] 正在切换会话，忽略加载请求");
      return;
    }

    isSwitchingRef.current = true;
    setIsSwitching(true);
    try {
      // 自动保存当前会话
      if (hasUnsavedChangesRef.current && saveCurrentSession) {
        console.log("[useSession] 自动保存当前会话");
        await saveCurrentSession();
      }

      // 尝试从持久化缓存加载
      const cached = chatSessionCache.get(sessionId);
      if (cached) {
        console.log("[useSession] 缓存命中", { sessionId });
        setCurrentSessionId(sessionId);
        setHasUnsavedChangesSafe(false);
        setSessionCache((prev) => new Map(prev).set(sessionId, cached));
        onSessionChange?.(sessionId);
        return;
      }

      // 缓存未命中，正常加载
      setCurrentSessionId(sessionId);
      setHasUnsavedChangesSafe(false);

      const sessionData: SessionCacheData = {
        sessionId,
        agentId,
        agentName: "",
        messages,
        lastUpdateTime: Date.now(),
      };
      setSessionCache((prev) => new Map(prev).set(sessionId, sessionData));
      chatSessionCache.set(sessionId, sessionData);

      console.log("[useSession] 历史会话加载成功", { sessionId });
      onSessionChange?.(sessionId);
    } catch (error) {
      console.error("[useSession] 加载会话失败", error);
      throw error;
    } finally {
      isSwitchingRef.current = false;
      setIsSwitching(false);
    }
  }, [agentId, saveCurrentSession, onSessionChange, setHasUnsavedChangesSafe]);

  return {
    currentSessionId,
    hasUnsavedChanges,
    setHasUnsavedChanges: setHasUnsavedChangesSafe,
    isSwitching,
    sessionCache,
    createNewSession,
    loadSession,
  };
}
