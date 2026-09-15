"use client";

/**
 * 屏幕阅读器公告总线（SELFLOOP4 loop-422，工单 0642/0643）。
 *
 * announce() 在任意客户端代码可调（SSE 完成/错误等异步事件），
 * 由根布局挂载的 <LiveAnnouncer /> 常驻 aria-live 区域播报。
 * live region 必须先于内容变更存在于 DOM（Sara Soueidan / MDN 惯例），
 * 因此组件常驻 layout，而非随事件挂载。
 */

export const A11Y_ANNOUNCE_EVENT = "a11y-announce";

export function announce(message: string): void {
  if (typeof window === "undefined" || !message) {
    return;
  }
  window.dispatchEvent(new CustomEvent<string>(A11Y_ANNOUNCE_EVENT, { detail: message }));
}
