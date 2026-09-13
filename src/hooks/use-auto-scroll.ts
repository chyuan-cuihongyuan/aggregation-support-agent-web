"use client";

import { useCallback, useEffect, useRef } from "react";

/** 距底部小于该阈值视为「贴底」 */
const STICKY_THRESHOLD_PX = 80;

/**
 * 聊天跟随滚动（SELFLOOP2 loop-243，L03：借鉴 vercel/ai-chatbot isAtBottom 模式）。
 * 用户贴底时随消息流自动滚动；上翻阅读时不再拉回；滚回底部恢复跟随。
 *
 * @param deps 跟随依赖（如消息数组），变化且贴底时自动滚到底
 */
export function useAutoScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stuckRef.current = distance <= STICKY_THRESHOLD_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    stuckRef.current = true;
  }, []);

  useEffect(() => {
    if (stuckRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, bottomRef, handleScroll, scrollToBottom };
}
