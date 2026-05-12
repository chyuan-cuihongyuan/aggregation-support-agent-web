/**
 * 对话页布局
 *
 * 包含顶部栏、侧边栏和主内容区
 */

import { ReactNode } from "react";

export default function ChatLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
      {/* 顶部栏 */}
      <div id="topbar-container">{/* Topbar 将由子页面注入 */}</div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
}
