/**
 * 对话页布局
 *
 * 直接渲染子页面内容（Topbar + 侧边栏 + 主对话区）
 */

import { ReactNode } from "react";

export default function ChatLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <>{children}</>;
}
