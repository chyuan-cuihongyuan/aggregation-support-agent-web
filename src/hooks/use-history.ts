/**
 * 对话历史 Hook
 *
 * 管理对话历史的加载、保存、删除和视图切换
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useMemo } from "react";
import { requestJson } from "@/lib/api";
import type { ChatHistoryDTO, HistoryViewMode } from "@/types/api";
import { groupHistoriesByAgent, migrateLegacyHistory } from "@/utils/session-utils";

interface UseHistoryOptions {
  userId: string;
}

export function useHistory({ userId }: UseHistoryOptions) {
  const [histories, setHistories] = useState<ChatHistoryDTO[]>([]);
  const [viewMode, setViewMode] = useState<HistoryViewMode>("by-agent");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 按智能体分组的历史记录
  const groupedHistories = useMemo(() => {
    if (viewMode !== "by-agent") return {};

    return groupHistoriesByAgent(histories);
  }, [histories, viewMode]);

  // 加载历史记录
  const loadHistories = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await requestJson<ChatHistoryDTO[]>(
        `/api/v1/chat_history/query?userId=${userId}`
      );

      // 迁移旧数据（为没有 sessionId 的记录生成虚拟 ID）
      const migratedData = data.map(migrateLegacyHistory);
      setHistories(migratedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 保存对话历史
  const saveHistory = useCallback(
    async (history: Omit<ChatHistoryDTO, "id" | "createTime">) => {
      try {
        await requestJson("/api/v1/chat_history/save", {
          method: "POST",
          body: JSON.stringify(history),
        });
        await loadHistories();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    },
    [loadHistories]
  );

  // 删除历史记录
  const deleteHistory = useCallback(
    async (historyId: string) => {
      try {
        await requestJson(`/api/v1/chat_history/delete?userId=${userId}&id=${historyId}`, {
          method: "POST",
        });
        await loadHistories();
      } catch (err) {
        setError(err instanceof Error ? err.message : "删除失败");
      }
    },
    [loadHistories, userId]
  );

  // 清空所有历史记录
  const clearAllHistories = useCallback(async () => {
    try {
      await requestJson(`/api/v1/chat_history/delete?userId=${userId}`, {
        method: "POST",
      });
      setHistories([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空失败");
    }
  }, [userId]);

  // 初始加载
  useEffect(() => {
    loadHistories();
  }, [loadHistories]);

  return {
    histories,
    groupedHistories,
    viewMode,
    setViewMode,
    isLoading,
    error,
    loadHistories,
    saveHistory,
    deleteHistory,
    clearAllHistories,
  };
}
