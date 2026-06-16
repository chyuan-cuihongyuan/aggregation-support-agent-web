/**
 * 聊天页顶栏
 *
 * 包含 Logo、智能体选择器、插件状态、操作按钮、用户头像
 */

"use client";

import { BookOpen, Menu, Monitor } from "lucide-react";
import { Button } from "@chyuan/ui-kit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@chyuan/ui-kit";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { usePluginStatus } from "@chyuan/ui-kit";
import type { AgentConfig } from "@/types/api";

interface ChatTopbarProps {
  agents: AgentConfig[];
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
  onAiOpsClick: () => void;
  onMenuClick: () => void;
}

export function ChatTopbar({
  agents,
  selectedAgentId,
  onAgentChange,
  onAiOpsClick,
  onMenuClick,
}: ChatTopbarProps) {
  const router = useRouter();
  const { status: pluginStatus } = usePluginStatus();

  // 计算已启用插件数
  const pluginStats = pluginStatus
    ? {
      enabled: Object.values(pluginStatus.builtIn || {}).filter((p) => p.enabled).length +
        (pluginStatus.mcpServers || []).filter((s) => s.enabled).length +
        (pluginStatus.customTools || []).filter((t) => t.enabled).length,
      total: Object.keys(pluginStatus.builtIn || {}).length +
        (pluginStatus.mcpServers || []).length +
        (pluginStatus.customTools || []).length,
    }
    : { enabled: 0, total: 0 };

  return (
    <header className="h-14 border-b border-[var(--chat-border)] bg-[var(--surface-main)] flex flex-wrap items-center justify-between px-5 shrink-0 gap-3">
      {/* 左侧 */}
      <div className="flex flex-wrap items-center gap-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-card)] border border-[var(--chat-border)] lg:hidden"
          onClick={onMenuClick}
          title="打开菜单"
        >
          <Menu className="w-[18px] h-[18px]" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)] hidden sm:inline">AgentHub</span>
        </div>

        {/* 智能体选择器 */}
        <div className="min-w-0">
          <Select value={selectedAgentId} onValueChange={onAgentChange}>
            <SelectTrigger className="w-[180px] h-9 bg-[var(--surface-card)] border border-[var(--chat-border)] rounded-lg text-[13px] font-medium text-[var(--text-primary)] min-w-[120px]">
              <SelectValue placeholder="选择智能体" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.agentId} value={agent.agentId} className="text-[13px]">
                  {agent.agentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 插件状态 */}
        {pluginStats.total > 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
            <div className="flex gap-[3px]">
              {Array.from({ length: Math.min(pluginStats.total, 5) }).map((_, i) => (
                <span
                  key={i}
                  className={`w-[6px] h-[6px] rounded-full ${i < pluginStats.enabled ? "bg-[var(--status-success)]" : "bg-[var(--text-muted)]"
                    }`}
                />
              ))}
            </div>
            插件 {pluginStats.enabled}/{pluginStats.total}
          </div>
        )}
      </div>

      {/* 右侧 */}
      <div className="flex flex-wrap items-center gap-2 justify-end min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-card)] border border-[var(--chat-border)]"
          onClick={() => router.push("/knowledge")}
          title="知识库"
        >
          <BookOpen className="w-[18px] h-[18px]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-card)] border border-[var(--chat-border)]"
          onClick={onAiOpsClick}
          title="AIOps 分析"
        >
          <Monitor className="w-[18px] h-[18px]" />
        </Button>

        <ThemeToggle />

        <UserMenu />
      </div>
    </header>
  );
}
