"use client";

import { useEffect } from "react";

interface UseSessionErrorHandlerOptions {
  currentSessionId: string | null;
  hasError: boolean;
  errorMessage: string;
}

/**
 * 会话错误处理 Hook
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
