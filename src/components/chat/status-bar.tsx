/**
 * 连接状态栏
 *
 * 显示连接状态和插件加载进度
 */

"use client";

import { usePluginStatus } from "@/hooks/use-plugin-status";

export function StatusBar() {
  const { status: pluginStatus, isLoading } = usePluginStatus();

  const enabledCount = pluginStatus
    ? Object.values(pluginStatus.builtIn || {}).filter((p) => p.enabled).length +
      (pluginStatus.mcpServers || []).filter((s) => s.enabled).length +
      (pluginStatus.customTools || []).filter((t) => t.enabled).length
    : 0;

  const totalCount = pluginStatus
    ? Object.keys(pluginStatus.builtIn || {}).length +
      (pluginStatus.mcpServers || []).length +
      (pluginStatus.customTools || []).length
    : 0;

  return (
    <div className="px-6 py-2 bg-[var(--chat-status-bar-bg)] border-b border-[var(--chat-border)] flex items-center gap-2 text-[12px] text-[var(--chat-status-bar-text)]">
      <span className="w-[6px] h-[6px] rounded-full bg-[var(--status-success)]" />
      {isLoading ? "连接中..." : `已连接 · 插件已加载 ${enabledCount}/${totalCount}`}
    </div>
  );
}
