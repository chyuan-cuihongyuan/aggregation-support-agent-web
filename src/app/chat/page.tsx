/**
 * 对话主页面
 *
 * 新布局：顶栏 + 左侧边栏 + 主聊天区
 * 集成多会话上下文管理
 */

"use client";

import { useState, useEffect } from "react";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput, type InputMode } from "@/components/chat/chat-input";
import { ChatTopbar } from "@/components/chat/chat-topbar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { StatusBar } from "@/components/chat/status-bar";
import { SessionHeader } from "@/components/chat/session-header";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/hooks/use-auth";
import { WelcomePanel } from "@/components/auth/welcome-panel";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/api";
import { useSessionManager } from "@/components/session/session-manager";
import type { AgentConfig, HistoryViewMode } from "@/types/api";

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("chat");

  const userId = user?.username || "default";

  const {
    currentSessionId,
    isSwitching,
    messages,
    isStreaming,
    histories,
    groupedHistories,
    viewMode,
    setViewMode,
    handleNewChat,
    handleSendMessage,
    handleLoadHistory,
    sendAiOps,
    deleteHistory,
  } = useSessionManager({
    userId,
    agentId: selectedAgentId,
    agentName: selectedAgentName,
  });

  // 未登录则跳转
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // 加载智能体列表
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await requestJson<AgentConfig[]>("/api/v1/query_ai_agent_config_list");
        setAgents(data);
        if (data.length > 0) {
          setSelectedAgentId(data[0].agentId);
          setSelectedAgentName(data[0].agentName);
        }
      } catch {
        // 静默失败
      }
    };
    loadAgents();
  }, []);

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find((a) => a.agentId === agentId);
    if (agent) {
      setSelectedAgentId(agentId);
      setSelectedAgentName(agent.agentName);
      // 切换智能体时创建新会话（handleNewChat 已在 session-manager 内部处理）
    }
  };

  const handleAiOpsClick = async () => {
    await sendAiOps(selectedAgentId);
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--chat-main-bg)]">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen min-h-0 bg-[var(--chat-main-bg)]">
      {/* 顶栏 */}
      <ChatTopbar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={handleAgentChange}
        onAiOpsClick={handleAiOpsClick}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {/* 主内容区 */}
      <div className="grid flex-1 overflow-hidden min-h-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* 左侧边栏 - 桌面端 */}
        <aside className="hidden lg:block h-full">
          <ChatSidebar
            activeSessionId={currentSessionId || undefined}
            histories={histories}
            groupedHistories={groupedHistories}
            viewMode={viewMode}
            onViewModeChange={(m) => setViewMode(m as HistoryViewMode)}
            onLoad={handleLoadHistory}
            onDelete={deleteHistory}
            onNewChat={handleNewChat}
            isSwitching={isSwitching}
          />
        </aside>

        {/* 主聊天区 */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* 状态栏 */}
          <StatusBar />

          {/* 会话标题 */}
          <SessionHeader
            title={messages.length > 0 ? "对话中" : "新对话"}
            modelInfo={`${selectedAgentName || "AI 智能助手"} · 会话 #${currentSessionId?.slice(0, 8) || "新"}`}
            onNewChat={handleNewChat}
          />

          {/* 消息列表或欢迎面板 */}
          {messages.length === 0 ? (
            <WelcomePanel />
          ) : (
            <MessageList messages={messages} />
          )}

          {/* 输入框 */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming || !currentSessionId}
            agents={agents}
            selectedAgentId={selectedAgentId}
            onAgentChange={handleAgentChange}
            activeMode={inputMode}
            onModeChange={setInputMode}
          />
        </main>
      </div>

      {/* 移动端侧边栏浮层 */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <VisuallyHidden>
            <SheetTitle>侧边栏</SheetTitle>
            <SheetDescription>历史记录和导航</SheetDescription>
          </VisuallyHidden>
          <ChatSidebar
            activeSessionId={currentSessionId || undefined}
            histories={histories}
            groupedHistories={groupedHistories}
            viewMode={viewMode}
            onViewModeChange={(m) => setViewMode(m as HistoryViewMode)}
            onLoad={(history) => {
              handleLoadHistory(history);
              setSidebarOpen(false);
            }}
            onDelete={deleteHistory}
            onNewChat={() => {
              handleNewChat();
              setSidebarOpen(false);
            }}
            isSwitching={isSwitching}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
