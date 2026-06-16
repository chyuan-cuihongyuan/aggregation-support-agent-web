/**
 * 聊天侧边栏
 *
 * 新建对话按钮 + 搜索框 + 视图切换 + 按日期/智能体分组的历史记录 + 底部设置入口
 */

"use client";

import { useState } from "react";
import { Plus, Search, MessageSquare, Settings, Trash2, BookOpen, Loader2, ChevronDown, ChevronRight, Plug, Circle, CircleCheck, CircleDot } from "lucide-react";
import { Button } from "@chyuan/ui-kit";
import { Input } from "@chyuan/ui-kit";
import { ScrollArea } from "@chyuan/ui-kit";
import { ViewToggle } from "@chyuan/ui-kit";
import { useRouter } from "next/navigation";
import { usePluginStatus } from "@chyuan/ui-kit";
import type { ChatHistoryDTO, HistoryViewMode } from "@/types/api";

interface ChatSidebarProps {
  /** 当前选中的会话 ID（用于高亮，向后兼容） */
  activeSessionId?: string;
  /** 当前会话 ID（由会话管理器提供） */
  currentSessionId?: string | null;
  /** 历史记录列表 */
  histories: ChatHistoryDTO[];
  /** 按智能体分组的历史记录 */
  groupedHistories?: Record<string, ChatHistoryDTO[]>;
  /** 视图模式 */
  viewMode?: HistoryViewMode;
  /** 视图模式切换 */
  onViewModeChange?: (mode: HistoryViewMode | ((prev: HistoryViewMode) => HistoryViewMode)) => void;
  /** 点击历史记录项 */
  onLoad: (history: ChatHistoryDTO) => void;
  /** 删除历史记录 */
  onDelete?: (id: string) => void;
  /** 新建对话 */
  onNewChat: () => void;
  /** 是否正在切换会话 */
  isSwitching?: boolean;
}

/** 按日期分组 */
function groupByDate(histories: ChatHistoryDTO[]): { label: string; items: ChatHistoryDTO[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups: { label: string; items: ChatHistoryDTO[] }[] = [
    { label: "今天", items: [] },
    { label: "昨天", items: [] },
    { label: "更早", items: [] },
  ];

  histories.forEach((h) => {
    const d = h.createTime ? new Date(h.createTime) : new Date(0);
    if (d >= today) groups[0].items.push(h);
    else if (d >= yesterday) groups[1].items.push(h);
    else groups[2].items.push(h);
  });

  return groups.filter((g) => g.items.length > 0);
}

/** 单条历史记录项组件 */
function HistoryItem({
  item,
  isActive,
  onLoad,
  onDelete,
}: {
  item: ChatHistoryDTO;
  isActive: boolean;
  onLoad: (history: ChatHistoryDTO) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#2a2a38] mb-0.5 ${
        isActive ? "bg-[#2a2a38]" : "text-[var(--text-primary)]"
      }`}
      onClick={() => onLoad(item)}
    >
      <MessageSquare className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
      <span className="flex-1 text-[13px] truncate">
        {item.question || "新对话"}
      </span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-[#fecaca] dark:hover:bg-red-900/30 text-[var(--text-muted)] hover:text-[#dc2626] transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function ChatSidebar({
  activeSessionId,
  currentSessionId,
  histories,
  groupedHistories,
  viewMode = "by-agent",
  onViewModeChange,
  onLoad,
  onDelete,
  onNewChat,
  isSwitching,
}: ChatSidebarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // 使用 currentSessionId 或向后兼容 activeSessionId
  const activeId = currentSessionId || activeSessionId;

  const filtered = search
    ? histories.filter((h) =>
        (h.question || "").toLowerCase().includes(search.toLowerCase())
      )
    : histories;

  // 按日期分组的结果
  const dateGroups = groupByDate(filtered);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--chat-sidebar-bg)] border-r border-[var(--chat-border)]">
      {/* 新建对话 */}
      <div className="shrink-0 p-4 border-b border-[var(--chat-border)]">
        <Button
          onClick={onNewChat}
          disabled={isSwitching}
          className="w-full h-10 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-lg text-[14px] font-medium gap-2 shadow-none"
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          新建对话
        </Button>
      </div>

      {/* 搜索框 + 视图切换 */}
      <div className="shrink-0 px-4 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索对话记录..."
            className="h-9 pl-9 bg-[var(--surface-main)] border border-[var(--chat-border)] rounded-lg text-[13px] placeholder:text-[var(--text-muted)]"
          />
        </div>
        {onViewModeChange && (
          <div className="flex items-center">
            <ViewToggle
              mode={viewMode}
              onModeChange={onViewModeChange}
              options={[
                { value: "by-agent", label: "按智能体" },
                { value: "all", label: "全部历史" },
              ]}
            />
          </div>
        )}
      </div>

      {/* 历史记录列表 */}
      <ScrollArea className="flex-1 min-h-0 px-2">
        <div className="py-1">
          {viewMode === "by-agent" && groupedHistories && Object.keys(groupedHistories).length > 0
            ? // 按智能体分组显示
              Object.entries(groupedHistories).map(([agentName, items]) => {
                // 搜索过滤
                const filteredItems = search
                  ? items.filter((h) =>
                      (h.question || "").toLowerCase().includes(search.toLowerCase())
                    )
                  : items;
                if (filteredItems.length === 0) return null;
                return (
                  <div key={agentName}>
                    <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                      {agentName}
                    </div>
                    {filteredItems.map((item) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        isActive={item.sessionId === activeId}
                        onLoad={onLoad}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                );
              })
            : // 按日期分组显示（全部模式）
              dateGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      isActive={item.sessionId === activeId}
                      onLoad={onLoad}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              ))}
          {histories.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">
              暂无对话记录
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 底部导航 */}
      <div className="shrink-0 border-t border-[var(--chat-border)]">
        <PluginListPanel />
        <div
          className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-[var(--text-secondary)] cursor-pointer hover:bg-[#2a2a38] transition-colors"
          onClick={() => router.push("/knowledge")}
        >
          <BookOpen className="w-4 h-4" />
          知识库管理
        </div>
        <div
          className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-[var(--text-secondary)] cursor-pointer hover:bg-[#2a2a38] transition-colors"
          onClick={() => router.push("/settings")}
        >
          <Settings className="w-4 h-4" />
          设置
        </div>
      </div>
    </div>
  );
}

/** 内置插件 ID → 中文名映射 */
const BUILTIN_PLUGIN_NAMES: Record<string, string> = {
  knowledge: "知识库",
  aiops: "AIOps",
  export: "导出",
  history: "历史",
};

/** 插件列表面板 */
function PluginListPanel() {
  const { status } = usePluginStatus();
  const [expanded, setExpanded] = useState(false);

  if (!status) return null;

  // 汇总插件数据
  const builtIn = Object.entries(status.builtIn).map(([id, s]) => ({
    id,
    name: BUILTIN_PLUGIN_NAMES[id] || id,
    enabled: s.enabled,
    available: s.available,
    type: "builtin" as const,
  }));
  const mcpServers = (status.mcpServers || []).map((s) => ({
    id: s.id,
    name: s.name,
    enabled: s.enabled,
    available: s.available,
    connected: s.connected,
    type: "mcp" as const,
  }));
  const customTools = (status.customTools || []).map((t) => ({
    id: t.id,
    name: t.name,
    enabled: t.enabled,
    available: t.available,
    type: "custom" as const,
  }));
  const allPlugins = [...builtIn, ...mcpServers, ...customTools];
  const enabledCount = allPlugins.filter((p) => p.enabled).length;

  return (
    <div>
      {/* 标题行 - 点击折叠/展开 */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-[#2a2a38] transition-colors select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        )}
        <Plug className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
        <span className="text-[13px] text-[var(--text-secondary)]">插件</span>
        <span className="ml-auto text-[11px] text-[var(--text-muted)] tabular-nums">
          {enabledCount}/{allPlugins.length}
        </span>
      </div>

      {/* 展开的插件列表 */}
      {expanded && (
        <div className="px-4 pb-2 space-y-0.5">
          {builtIn.length > 0 && (
            <>
              <div className="text-[11px] text-[var(--text-muted)] py-1 font-medium">内置插件</div>
              {builtIn.map((p) => (
                <PluginRow key={p.id} name={p.name} enabled={p.enabled} available={p.available} />
              ))}
            </>
          )}
          {mcpServers.length > 0 && (
            <>
              <div className="text-[11px] text-[var(--text-muted)] py-1 pt-2 font-medium">MCP 服务</div>
              {mcpServers.map((p) => (
                <PluginRow key={p.id} name={p.name} enabled={p.enabled} available={p.available} connected={p.connected} />
              ))}
            </>
          )}
          {customTools.length > 0 && (
            <>
              <div className="text-[11px] text-[var(--text-muted)] py-1 pt-2 font-medium">自定义工具</div>
              {customTools.map((p) => (
                <PluginRow key={p.id} name={p.name} enabled={p.enabled} available={p.available} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** 单个插件行 */
function PluginRow({
  name,
  enabled,
  available,
  connected,
}: {
  name: string;
  enabled: boolean;
  available: boolean;
  connected?: boolean;
}) {
  // 状态图标
  let StatusIcon: typeof CircleCheck;
  let statusColor: string;
  if (!available) {
    StatusIcon = Circle;
    statusColor = "text-[var(--text-muted)] opacity-40";
  } else if (connected !== undefined) {
    // MCP 插件
    StatusIcon = connected ? CircleCheck : CircleDot;
    statusColor = connected
      ? "text-[var(--status-success)]"
      : "text-[var(--status-warning)]";
  } else {
    StatusIcon = enabled ? CircleCheck : Circle;
    statusColor = enabled
      ? "text-[var(--status-success)]"
      : "text-[var(--text-muted)]";
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-1 text-[13px]">
      <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusColor}`} />
      <span className={`truncate ${enabled ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
        {name}
      </span>
    </div>
  );
}
