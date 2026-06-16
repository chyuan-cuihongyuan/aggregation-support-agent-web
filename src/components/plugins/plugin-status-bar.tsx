/**
 * 插件状态栏组件
 *
 * 显示所有插件的状态，分组显示
 */

"use client";

import { useState } from "react";
import { Settings, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@chyuan/ui-kit";
import { Badge } from "@chyuan/ui-kit";
import { usePluginStatus } from "@chyuan/ui-kit";

interface PluginStatusBarProps {
  onOpenSettings: () => void;
}

export function PluginStatusBar({ onOpenSettings }: PluginStatusBarProps) {
  const { status } = usePluginStatus();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    builtin: true,
    mcp: false,
    custom: false,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const getStatusIcon = (enabled: boolean, available: boolean, connected?: boolean) => {
    if (!available) return "❌";
    if (connected !== undefined) return connected ? "✅" : "🔄";
    return enabled ? "✅" : "⭕";
  };

  if (!status) {
    return null;
  }

  const builtInPlugins = Object.entries(status.builtIn);
  const enabledBuiltInCount = builtInPlugins.filter((entry) => entry[1].enabled).length;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-2 border-t border-border/50">
      <div className="flex items-center justify-between py-2">
        {/* 内置插件组 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">内置:</span>
          <span className="text-xs">
            {builtInPlugins.map(([id, s]) => (
              <span key={id} className="mr-2">
                {getStatusIcon(s.enabled, s.available)} {getPluginName(id)}
              </span>
            ))}
          </span>
          <Badge variant="outline" className="text-xs">
            {enabledBuiltInCount}/{builtInPlugins.length}
          </Badge>
        </div>

        {/* 设置按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          className="h-7 text-xs"
        >
          <Settings className="w-3 h-3 mr-1" />
          设置
        </Button>
      </div>

      {/* MCP 服务组 */}
      {status.mcpServers.length > 0 && (
        <div className="flex items-center gap-2 py-1">
          <button
            onClick={() => toggleGroup("mcp")}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            {expandedGroups.mcp ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="ml-1">MCP:</span>
          </button>
          {expandedGroups.mcp && (
            <span className="text-xs">
              {status.mcpServers.map((server) => (
                <span key={server.id} className="mr-2">
                  {getStatusIcon(server.enabled, server.available, server.connected)} {server.name}
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {/* 自定义工具组 */}
      {status.customTools.length > 0 && (
        <div className="flex items-center gap-2 py-1">
          <button
            onClick={() => toggleGroup("custom")}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            {expandedGroups.custom ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="ml-1">工具:</span>
          </button>
          {expandedGroups.custom && (
            <span className="text-xs">
              {status.customTools.map((tool) => (
                <span key={tool.id} className="mr-2">
                  {getStatusIcon(tool.enabled, tool.available)} {tool.name}
                </span>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** 获取插件显示名称 */
function getPluginName(id: string): string {
  const names: Record<string, string> = {
    knowledge: "知识库",
    aiops: "AIOps",
    export: "导出",
    history: "历史",
  };
  return names[id] || id;
}
