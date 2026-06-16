/**
 * 插件状态管理 Hook
 *
 * 轮询获取插件状态，接口不可用时停止轮询
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { requestJson } from "@chyuan/ui-kit";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unavailableRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!enabled || unavailableRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await requestJson<PluginStatusResponse>("/api/v1/plugins/status");
      setStatus(data);
    } catch (err) {
      // 接口不可用时标记，停止后续轮询
      unavailableRef.current = true;
      setError(err instanceof Error ? err : new Error("获取插件状态失败"));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // 使用 useRef 避免在 effect 中直接调用 fetchStatus
  const initialFetchDoneRef = useRef(false);
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchStatus();
    }

    if (!enabled || unavailableRef.current) return;

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
