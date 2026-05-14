/**
 * 智能体选择器组件
 *
 * 居中显示在主对话区顶部
 */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentConfig } from "@/types/api";

interface AgentSelectorProps {
  agents: AgentConfig[];
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
}

export function AgentSelector({
  agents,
  selectedAgentId,
  onAgentChange,
}: AgentSelectorProps) {
  return (
    <div className="w-full max-w-3xl px-4 py-3 flex justify-center">
      <Select value={selectedAgentId} onValueChange={onAgentChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="选择智能体" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
