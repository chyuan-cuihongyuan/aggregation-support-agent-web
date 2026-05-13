/**
 * 顶部导航栏
 *
 * 包含品牌、智能体选择、用户信息、主题切换、退出和 AIOps 按钮
 */

"use client";

import { Activity, Menu, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import type { AgentConfig } from "@/types/api";
import { UserMenu } from "@/components/auth/user-menu";

interface TopbarProps {
  agents: AgentConfig[];
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
  onAiOpsClick: () => void;
  onMenuClick: () => void;
}

export function Topbar({
  agents,
  selectedAgentId,
  onAgentChange,
  onAiOpsClick,
  onMenuClick,
}: TopbarProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <header className="h-14 border-b border-white/[0.1] bg-[#0b1022]/76 backdrop-blur-[14px] flex items-center justify-between px-4 lg:px-5">
      {/* 左侧：品牌和菜单按钮 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden text-white/70 hover:text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-[#62f6c7]/90 to-[#5aa9ff]/90 flex items-center justify-center font-extrabold text-[#070a12] text-[13px]">
            AI
          </div>
          <span className="text-[13px] font-bold text-white/90 hidden sm:inline-block">AI 智能体对话</span>
        </div>
        <Select value={selectedAgentId} onValueChange={onAgentChange}>
          <SelectTrigger className="w-[160px] ml-3 bg-black/20 border-white/[0.14] rounded-[10px] text-xs text-white/70 h-9">
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

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2.5">
        {user?.role === "admin" && (
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")}
            className="border-white/[0.14] text-white/70 hover:bg-white/10 hover:text-white">
            <Users className="w-4 h-4 mr-2" />
            用户管理
          </Button>
        )}
        <Button
          size="sm"
          onClick={onAiOpsClick}
          className="bg-gradient-to-r from-[#62f6c7] to-[#5aa9ff] text-[#070a12] font-bold rounded-[10px] px-3.5 h-8 text-xs hover:opacity-90"
        >
          <Activity className="w-3.5 h-3.5 mr-1.5" />
          AIOps 分析
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
