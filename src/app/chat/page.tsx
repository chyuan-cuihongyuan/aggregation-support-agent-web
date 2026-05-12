/**
 * 对话主页面
 *
 * 包含侧边栏（会话信息/历史记录/知识库）和主对话区
 */

"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/topbar";
import { requestJson } from "@/lib/api";
import type { AgentConfig } from "@/types/api";

export default function ChatPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  useEffect(() => {
    // 加载智能体列表
    requestJson<AgentConfig[]>("/api/v1/query_ai_agent_config_list")
      .then((data) => {
        setAgents(data);
        if (data.length > 0) {
          setSelectedAgentId(data[0].agentId);
        }
      })
      .catch(() => {
        // 静默失败，使用空列表
      });
  }, []);

  const handleAiOpsClick = () => {
    // TODO: 打开 AIOps 对话
  };

  const handleMenuClick = () => {
    // TODO: 打开/关闭移动端侧边栏
  };

  return (
    <>
      <Topbar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={setSelectedAgentId}
        onAiOpsClick={handleAiOpsClick}
        onMenuClick={handleMenuClick}
      />

      {/* 侧边栏占位 */}
      <aside className="w-80 border-r border-border/40 hidden lg:block">
        <div className="p-4 text-muted-foreground text-sm">
          侧边栏：会话信息 / 历史记录 / 知识库
        </div>
      </aside>

      {/* 主对话区占位 */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>对话区域 - 将在后续任务中实现</p>
        </div>
      </main>
    </>
  );
}
