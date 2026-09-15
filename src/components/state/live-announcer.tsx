"use client";

import { useEffect, useRef, useState } from "react";

import { A11Y_ANNOUNCE_EVENT } from "@/lib/announce";

/**
 * 常驻屏幕阅读器公告区（SELFLOOP4 loop-422，工单 0642/0643）。
 *
 * 挂载于根布局：视觉隐藏（sr-only）+ aria-live="polite" + role="status"。
 * 先于任何 announce() 存在于 DOM，规避「挂载即公告」的 screen reader 失效模式。
 * 收到公告先清空再下一帧写入——连续两次相同消息也能触发重读。
 */
export function LiveAnnouncer() {
  const [message, setMessage] = useState("");
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (!detail) {
        return;
      }
      setMessage("");
      frameRef.current = window.requestAnimationFrame(() => setMessage(detail));
    };
    window.addEventListener(A11Y_ANNOUNCE_EVENT, onAnnounce);
    return () => {
      window.removeEventListener(A11Y_ANNOUNCE_EVENT, onAnnounce);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {message}
    </div>
  );
}
