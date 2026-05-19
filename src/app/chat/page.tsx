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
import type { AgentConfig, ChatHistoryDTO } from "@/types/api";

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("chat");
  const [pendingQuestion, setPendingQuestion] = useState("");

  const userId = user?.username || "default";

  const {
    currentSessionId,
    messages,
    isStreaming,
    sendMessage,
    stopGeneration,
    sendAiOps,
    histories,
    groupedHistories,
    viewMode,
    setViewMode,
    saveHistory,
    deleteHistory,
    handleNewChat,
    handleLoadHistory,
  } = useSessionManager({
    userId,
    agentId: selectedAgentId,
    agentName: selectedAgentName,
    onMessageComplete: async (message) => {
      // 消息完成回调：保存对话历史
      if (pendingQuestion && message.role === "assistant") {
        await saveHistory({
          userId,
          agentId: selectedAgentId,
          agentName: selectedAgentName,
          sessionId: currentSessionId || "",
          question: pendingQuestion,
          answer: message.content,
        });
        setPendingQuestion("");
      }
    },
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
    }
  };

  const handleSendMessage = async (content: string) => {
    setPendingQuestion(content);
    await sendMessage(content);
  };

  const onLoadHistory = (history: ChatHistoryDTO) => {
    handleLoadHistory(history);
    setSidebarOpen(false);
  };

  const handleAiOpsClick = async () => {
    const result = await sendAiOps(selectedAgentId);
    if (result) {
      await saveHistory({
        userId,
        agentId: selectedAgentId,
        agentName: `${selectedAgentName} (AIOps)`,
        sessionId: currentSessionId || "",
        question: result.question,
        answer: result.answer,
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--chat-main-bg)] relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="bg-orb bg-orb-1 w-[500px] h-[500px] -top-[100px] -right-[100px] bg-[rgba(102,126,234,0.06)] dark:bg-[rgba(102,126,234,0.08)]" />
          <div className="bg-orb bg-orb-2 w-[400px] h-[400px] -bottom-[80px] -left-[80px] bg-[rgba(230,57,70,0.04)] dark:bg-[rgba(230,57,70,0.06)]" />
        </div>
        <div className="relative z-10 text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen min-h-0 bg-[var(--chat-main-bg)] relative overflow-hidden">
      {/* 背景装饰层 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* 渐变光晕 */}
        <div className="bg-orb bg-orb-1 w-[600px] h-[600px] -top-[150px] -right-[150px] bg-[rgba(102,126,234,0.05)] dark:bg-[rgba(102,126,234,0.07)]" />
        <div className="bg-orb bg-orb-2 w-[450px] h-[450px] top-[40%] -left-[100px] bg-[rgba(118,75,162,0.04)] dark:bg-[rgba(118,75,162,0.06)]" />
        <div className="bg-orb bg-orb-3 w-[350px] h-[350px] -bottom-[80px] right-[20%] bg-[rgba(230,57,70,0.03)] dark:bg-[rgba(230,57,70,0.05)]" />
        {/* 点阵图案 */}
        <div className="absolute inset-0 bg-dot-pattern text-[var(--text-muted)] opacity-[0.04] dark:opacity-[0.03]" />
      </div>

      {/* 顶栏 */}
      <div className="relative z-10 shrink-0">
      <ChatTopbar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={handleAgentChange}
        onAiOpsClick={handleAiOpsClick}
        onMenuClick={() => setSidebarOpen(true)}
      />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 grid flex-1 overflow-hidden min-h-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* 左侧边栏 - 桌面端 */}
        <aside className="hidden lg:block h-full overflow-hidden">
          <ChatSidebar
            activeSessionId={currentSessionId || undefined}
            histories={histories}
            groupedHistories={groupedHistories}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onLoad={onLoadHistory}
            onDelete={deleteHistory}
            onNewChat={handleNewChat}
            currentSessionId={currentSessionId}
          />
        </aside>

        {/* 主聊天区 */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* 状态栏 */}
          <StatusBar />

          {/* 会话标题 */}
          <SessionHeader
            title={messages.length > 0 ? (pendingQuestion || "新对话") : "新对话"}
            modelInfo={`${selectedAgentName || "AI 智能助手"} · 会话 #${currentSessionId?.slice(0, 8) || "新"}`}
            onNewChat={handleNewChat}
          />

          {/* 消息列表或欢迎面板 */}
          {messages.length === 0 ? (
            <WelcomePanel onQuickAction={handleSendMessage} />
          ) : (
            <MessageList messages={messages} />
          )}

          {/* 输入框 */}
          <ChatInput
            onSend={handleSendMessage}
            onStop={stopGeneration}
            disabled={!currentSessionId}
            isStreaming={isStreaming}
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
            onViewModeChange={setViewMode}
            onLoad={onLoadHistory}
            onDelete={deleteHistory}
            onNewChat={handleNewChat}
            currentSessionId={currentSessionId}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
