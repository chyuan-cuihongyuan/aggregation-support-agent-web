"use client";

import { useEffect } from "react";

interface UseSessionErrorHandlerOptions {
  currentSessionId: string | null;
  hasError: boolean;
  errorMessage: string;
}

/**
 * 会话错误处理 Hook
 *
 * 监控会话状态异常并通过 console 输出警告
 * 可接入项目后续的 toast 通知系统
 */
export function useSessionErrorHandler({
  currentSessionId,
  hasError,
  errorMessage,
}: UseSessionErrorHandlerOptions) {
  useEffect(() => {
    if (hasError && errorMessage) {
      console.error("[SessionErrorHandler]", errorMessage);
    }
  }, [hasError, errorMessage]);

  useEffect(() => {
    if (currentSessionId?.startsWith("temp_")) {
      console.warn("[SessionErrorHandler] 使用临时会话，部分功能可能受限");
    }
  }, [currentSessionId]);
}
