/**
 * 插件状态管理 Hook
 *
 * 轮询获取插件状态，支持自动刷新
 */

import { useState, useEffect, useCallback } from "react";
import { requestJson } from "@/lib/api";
import type { PluginStatusResponse } from "@/types/plugin";

interface UsePluginStatusOptions {
  /** 轮询间隔（毫秒），默认 30 秒 */
  pollingInterval?: number;
  /** 是否启用轮询，默认 true */
  enabled?: boolean;
}

export function usePluginStatus({
  pollingInterval = 30000,
  enabled = true,
}: UsePluginStatusOptions = {}) {
  const [status, setStatus] = useState<PluginStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await requestJson<PluginStatusResponse>("/api/v1/plugins/status");
      setStatus(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("获取插件状态失败");
      setError(error);
      console.error("获取插件状态失败:", err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchStatus();

    if (!enabled) return;

    const interval = setInterval(fetchStatus, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollingInterval, enabled]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
