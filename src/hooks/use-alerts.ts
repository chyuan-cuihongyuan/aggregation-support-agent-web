/**
 * 告警管理 Hook
 *
 * 管理告警数据的加载、过滤和状态更新
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { requestJson } from "@/lib/api";
import type { AlertDTO, AlertListResponse } from "@/types/api";

interface UseAlertsOptions {
  /** 是否自动加载 */
  autoLoad?: boolean;
  /** 默认过滤条件 */
  defaultSeverity?: string;
}

export function useAlerts({ autoLoad = true, defaultSeverity = "all" }: UseAlertsOptions = {}) {
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [counts, setCounts] = useState({ critical: 0, warning: 0, info: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState(defaultSeverity);

  // 加载告警列表
  const loadAlerts = useCallback(async (filterSeverity?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const severityParam = filterSeverity || severity;
      const params = severityParam && severityParam !== "all" ? `?severity=${severityParam}` : "";
      const data = await requestJson<AlertListResponse>(`/api/v1/alerts/list${params}`);
      setAlerts(data.alerts || []);
      setCounts(data.counts || { critical: 0, warning: 0, info: 0, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载告警失败");
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [severity]);

  // 确认告警
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await requestJson<boolean>(`/api/v1/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      await loadAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "确认告警失败");
    }
  }, [loadAlerts]);

  // 解决告警
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await requestJson<boolean>(`/api/v1/alerts/${alertId}/resolve`, {
        method: "POST",
      });
      await loadAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "解决告警失败");
    }
  }, [loadAlerts]);

  // 获取告警详情
  const getAlertDetail = useCallback(async (alertId: string) => {
    try {
      return await requestJson<AlertDTO>(`/api/v1/alerts/${alertId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取告警详情失败");
      return null;
    }
  }, []);

  // 切换过滤条件
  const changeSeverity = useCallback((newSeverity: string) => {
    setSeverity(newSeverity);
    loadAlerts(newSeverity);
  }, [loadAlerts]);

  // 初始加载 - 使用 useRef 避免重复加载
  const initialLoadDoneRef = useRef(false);
  useEffect(() => {
    if (autoLoad && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      loadAlerts();
    }
  }, [autoLoad, loadAlerts]);

  return {
    alerts,
    counts,
    isLoading,
    error,
    severity,
    loadAlerts,
    acknowledgeAlert,
    resolveAlert,
    getAlertDetail,
    changeSeverity,
  };
}
