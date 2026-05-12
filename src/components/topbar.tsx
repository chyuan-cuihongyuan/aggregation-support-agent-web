/**
 * 顶部导航栏
 *
 * 包含品牌、智能体选择、用户信息、主题切换、退出和 AIOps 按钮
 */

"use client";

import { Bot, LogOut, Activity, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearAuthCookie } from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { AgentConfig } from "@/types/api";

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

  const handleLogout = () => {
    clearAuthCookie();
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 lg:px-6">
      {/* 左侧：品牌和菜单按钮 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold hidden sm:inline-block">AI 智能体平台</span>
        </div>
      </div>

      {/* 中间：智能体选择 */}
      <div className="flex-1 max-w-md mx-4">
        <Select value={selectedAgentId} onValueChange={onAgentChange}>
          <SelectTrigger className="w-full">
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
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onAiOpsClick}>
          <Activity className="w-4 h-4 mr-2" />
          AIOps
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
