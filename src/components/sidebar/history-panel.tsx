/**
 * 历史记录标签页组件
 *
 * 显示按智能体/时间分组的对话历史，支持加载和清空
 */

"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { MessageSquare, Trash2, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatHistoryDTO } from "@/types/api";

interface HistoryPanelProps {
  histories: ChatHistoryDTO[];
  onLoad: (history: ChatHistoryDTO) => void;
  onClearAll: () => void;
}

// 按智能体分组
type GroupedHistories = Record<string, ChatHistoryDTO[]>;

function groupHistories(histories: ChatHistoryDTO[]): GroupedHistories {
  return histories.reduce((acc, h) => {
    if (!acc[h.agentName]) {
      acc[h.agentName] = [];
    }
    acc[h.agentName].push(h);
    return acc;
  }, {} as GroupedHistories);
}

export function HistoryPanel({ histories, onLoad, onClearAll }: HistoryPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const keyword = filter.trim().toLowerCase();
  // 客户端过滤：按问题与智能体名大小写不敏感匹配（SELFLOOP3 loop-307，工单 0412/0413）
  const filtered = keyword
    ? histories.filter(
        (h) =>
          (h.question ?? "").toLowerCase().includes(keyword) ||
          (h.agentName ?? "").toLowerCase().includes(keyword)
      )
    : histories;
  const grouped = groupHistories(filtered);
  // 过滤态命中分组一律展开（override 折叠态）；清空关键词恢复手动展开状态
  const effectiveExpanded = keyword ? new Set(Object.keys(grouped)) : expandedGroups;

  const toggleGroup = (agentName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(agentName)) {
      newExpanded.delete(agentName);
    } else {
      newExpanded.add(agentName);
    }
    setExpandedGroups(newExpanded);
  };

  if (histories.length === 0) {
    return <div className="text-center text-sm text-muted-foreground py-8">暂无历史记录</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">历史记录 ({filtered.length})</h3>
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          <Trash2 className="w-3 h-3 mr-1" />
          清空
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="搜索历史记录..."
          className="h-8 pl-7 text-xs"
          aria-label="搜索历史记录"
        />
      </div>

      {keyword && filtered.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8">无匹配历史记录</div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {Object.entries(grouped).map(([agentName, items]) => (
              <div key={agentName}>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 h-8"
                  onClick={() => toggleGroup(agentName)}
                >
                  {effectiveExpanded.has(agentName) ? (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm">{agentName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </Button>

                {effectiveExpanded.has(agentName) && (
                  <div className="ml-4 space-y-1">
                    {items.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => onLoad(h)}
                        className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{h.question}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(h.createTime), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
