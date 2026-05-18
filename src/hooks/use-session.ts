/**
 * 会话管理 Hook
 *
 * 管理会话状态、创建新会话、加载历史会话。
 * 提供并发保护（isSwitching）和降级策略（临时 sessionId）。
 */

import { useState, useCallback } from "react";
import { requestJson } from "@/lib/api";
import { sessionStorage } from "@/lib/session-storage";
import { generateTempSessionId } from "@/utils/session-utils";
import type { SessionCacheData, Message } from "@/types/api";

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
  // 当前会话 ID
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 会话缓存
  const [sessionCache, setSessionCache] = useState<Map<string, SessionCacheData>>(new Map());

  // 是否有未保存的更改
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 是否正在切换会话（并发保护）
  const [isSwitching, setIsSwitching] = useState(false);

  /**
   * 创建新会话
   *
   * 1. 检查并发保护
   * 2. 自动保存当前会话（如果有未保存更改）
   * 3. 调用后端 API 创建新会话
   * 4. 失败时降级为临时 sessionId
   *
   * @param shouldSaveCurrent - 是否自动保存当前会话，默认 true
   * @returns 新会话 ID，失败时返回临时 sessionId
   */
  const createNewSession = useCallback(async (shouldSaveCurrent = true) => {
    if (isSwitching) {
      console.warn("[useSession] 正在切换会话，忽略创建请求");
      return null;
    }

    setIsSwitching(true);
    try {
      // 1. 自动保存当前会话
      if (shouldSaveCurrent && hasUnsavedChanges && saveCurrentSession) {
        console.log("[useSession] 自动保存当前会话");
        await saveCurrentSession();
      }

      // 2. 调用后端创建新会话
      console.log("[useSession] 创建新会话", { agentId, userId });
      const { sessionId } = await requestJson<{ sessionId: string }>(
        "/api/v1/create_session",
        {
          method: "POST",
          body: JSON.stringify({ agentId, userId }),
        }
      );

      // 3. 更新状态
      setCurrentSessionId(sessionId);
      setHasUnsavedChanges(false);
      setSessionCache(new Map());
      sessionStorage.clear(); // 清空持久化缓存

      console.log("[useSession] 新会话创建成功", { sessionId });
      onSessionChange?.(sessionId);

      return sessionId;
    } catch (error) {
      console.error("[useSession] 创建会话失败", error);

      // 降级策略：生成临时会话 ID
      const tempSessionId = generateTempSessionId();
      setCurrentSessionId(tempSessionId);
      setHasUnsavedChanges(false);
      setSessionCache(new Map());
      sessionStorage.clear(); // 清空持久化缓存

      console.warn("[useSession] 使用临时会话 ID", { tempSessionId });
      onSessionChange?.(tempSessionId);

      return tempSessionId;
    } finally {
      setIsSwitching(false);
    }
  }, [userId, agentId, hasUnsavedChanges, isSwitching, saveCurrentSession, onSessionChange]);

  /**
   * 加载历史会话
   *
   * 1. 检查并发保护
   * 2. 自动保存当前会话（如果有未保存更改）
   * 3. 恢复历史会话状态
   * 4. 更新会话缓存
   *
   * @param sessionId - 要加载的会话 ID
   * @param messages - 历史消息列表
   */
  const loadSession = useCallback(async (sessionId: string, messages: Message[]) => {
    if (isSwitching) {
      console.warn("[useSession] 正在切换会话，忽略加载请求");
      return;
    }

    setIsSwitching(true);
    try {
      // 1. 自动保存当前会话
      if (hasUnsavedChanges && saveCurrentSession) {
        console.log("[useSession] 自动保存当前会话");
        await saveCurrentSession();
      }

      // 2. 尝试从持久化缓存加载
      const cached = sessionStorage.get(sessionId);
      if (cached) {
        // 缓存命中，直接使用缓存数据，跳过重新加载
        console.log("[useSession] 缓存命中，使用缓存数据", { sessionId });
        setCurrentSessionId(sessionId);
        setHasUnsavedChanges(false);
        setSessionCache((prev) => new Map(prev).set(sessionId, cached));
        onSessionChange?.(sessionId);
        return;
      }

      // 3. 缓存未命中，正常加载并保存到缓存
      setCurrentSessionId(sessionId);
      setHasUnsavedChanges(false);

      const sessionData: SessionCacheData = {
        sessionId,
        agentId,
        agentName: "",
        messages,
        lastUpdateTime: Date.now(),
      };
      setSessionCache((prev) => new Map(prev).set(sessionId, sessionData));

      // 保存到持久化缓存
      sessionStorage.set(sessionId, sessionData);

      console.log("[useSession] 历史会话加载成功", { sessionId });
      onSessionChange?.(sessionId);
    } catch (error) {
      console.error("[useSession] 加载会话失败", error);
      throw error;
    } finally {
      setIsSwitching(false);
    }
  }, [agentId, hasUnsavedChanges, isSwitching, saveCurrentSession, onSessionChange]);

  return {
    // 状态
    currentSessionId,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSwitching,
    sessionCache,

    // 方法
    createNewSession,
    loadSession,
  };
}
