/**
 * RAG 追踪 Hook（管理员）
 *
 * 管理 RAG 追踪记录的加载、筛选和分页
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { requestJson } from "@/lib/api";
import type { RagTraceEntity, RagTraceListResponse, RagTraceQueryParams } from "@/types/api";

interface UseRagTraceOptions {
  /** 初始筛选条件 */
  initialFilters?: RagTraceQueryParams;
  /** 每页条数 */
  pageSize?: number;
  /** 是否自动加载 */
  autoLoad?: boolean;
}

export function useRagTrace(options: UseRagTraceOptions = {}) {
  const { initialFilters = {}, pageSize = 20, autoLoad = true } = options;

  const [traces, setTraces] = useState<RagTraceEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<RagTraceQueryParams>(initialFilters);

  // 避免重复加载
  const initialLoadDoneRef = useRef(false);

  const loadTraces = useCallback(
    async (targetPage?: number) => {
      const currentPage = targetPage ?? page;
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (filters.userId) params.set("userId", filters.userId);
        if (filters.agentId) params.set("agentId", filters.agentId);
        if (filters.startTime) params.set("startTime", filters.startTime);
        if (filters.endTime) params.set("endTime", filters.endTime);
        params.set("page", String(currentPage));
        params.set("pageSize", String(pageSize));

        const data = await requestJson<RagTraceListResponse>(
          `/api/v1/rag_trace/admin/list?${params.toString()}`
        );
        setTraces(data.list ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? currentPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, page, pageSize]
  );

  // 更新筛选条件
  const updateFilters = useCallback((newFilters: Partial<RagTraceQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  // 翻页
  const goToPage = useCallback(
    (targetPage: number) => {
      setPage(targetPage);
    },
    []
  );

  // 刷新
  const refresh = useCallback(() => {
    loadTraces(page);
  }, [loadTraces, page]);

  // 筛选条件变化时自动加载
  useEffect(() => {
    if (autoLoad) {
      loadTraces(1);
    }
  }, [filters, autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  // page 变化时加载（非筛选触发）
  useEffect(() => {
    if (initialLoadDoneRef.current) {
      loadTraces(page);
    }
    initialLoadDoneRef.current = true;
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    traces,
    total,
    page,
    pageSize,
    isLoading,
    error,
    filters,
    setFilters: updateFilters,
    goToPage,
    refresh,
    loadTraces,
  };
}
