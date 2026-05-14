/**
 * 对话主页面
 *
 * ChatGPT 风格布局：居中主对话区
 */

"use client";

import { useState, useEffect } from "react";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { SessionInfo } from "@/components/sidebar/session-info";
import { HistoryPanel } from "@/components/sidebar/history-panel";
import { KnowledgeTab } from "@/components/sidebar/knowledge-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAuth } from "@/hooks/use-auth";
import { WelcomePanel } from "@/components/auth/welcome-panel";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/api";
import { useChat } from "@/hooks/use-chat";
import { useHistory } from "@/hooks/use-history";
import { AgentSelector } from "@/components/topbar/agent-selector";
import { PluginStatusBar } from "@/components/plugins/plugin-status-bar";
import { PluginSettingsDialog } from "@/components/plugins/plugin-settings-dialog";
import type { AgentConfig, ChatHistoryDTO } from "@/types/api";

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [pendingQuestion, setPendingQuestion] = useState<string>("");
  const [pluginSettingsOpen, setPluginSettingsOpen] = useState(false);

  const userId = user?.username || "default";

  const { messages, isStreaming, sessionId, sendMessage, loadConversation, sendAiOps } = useChat({
    userId,
    agentId: selectedAgentId,
    onMessageComplete: async (message) => {
      if (pendingQuestion && message.role === "assistant") {
        await saveHistory({
          userId,
          agentId: selectedAgentId,
          agentName: selectedAgentName,
          sessionId: sessionId,
          question: pendingQuestion,
          answer: message.content,
        });
        setPendingQuestion("");
      }
    },
  });

  const { histories, saveHistory, clearAllHistories } = useHistory({ userId });

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

  const handleLoadHistory = (history: ChatHistoryDTO) => {
    loadConversation([{ question: history.question, answer: history.answer }]);
  };

  const handleAiOpsClick = async () => {
    const result = await sendAiOps(selectedAgentId);
    if (result) {
      await saveHistory({
        userId,
        agentId: selectedAgentId,
        agentName: `${selectedAgentName} (AIOps)`,
        sessionId: "",
        question: result.question,
        answer: result.answer,
      });
    }
  };

  const sidebarContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 m-2">
        <TabsTrigger value="history" className="text-xs">历史</TabsTrigger>
        <TabsTrigger value="knowledge" className="text-xs">知识库</TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="flex-1 overflow-auto">
        <HistoryPanel histories={histories} onLoad={handleLoadHistory} onClearAll={clearAllHistories} />
      </TabsContent>

      <TabsContent value="session" className="flex-1 overflow-auto p-4">
        <SessionInfo userId={userId} agentId={selectedAgentId} agentName={selectedAgentName} sessionId={sessionId} />
      </TabsContent>

      <TabsContent value="knowledge" className="flex-1 overflow-hidden">
        <KnowledgeTab userId={userId} />
      </TabsContent>
    </Tabs>
  );

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* 侧边栏 */}
      <aside className="hidden lg:flex w-[260px] flex-col border-r border-border/50 bg-[var(--chat-sidebar-bg)]">
        {sidebarContent}
      </aside>

      {/* 主对话区 */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--chat-main-bg)]">
        {/* 智能体选择器 */}
        <AgentSelector
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentChange={handleAgentChange}
        />

        {/* 消息列表或欢迎面板 */}
        {messages.length === 0 ? (
          <WelcomePanel />
        ) : (
          <MessageList messages={messages} />
        )}

        {/* 输入框 */}
        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />

        {/* 插件状态栏 */}
        <PluginStatusBar onOpenSettings={() => setPluginSettingsOpen(true)} />
      </main>

      {/* 插件设置对话框 */}
      <PluginSettingsDialog
        open={pluginSettingsOpen}
        onOpenChange={setPluginSettingsOpen}
      />

      {/* 移动端侧边栏浮层 */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <VisuallyHidden>
            <SheetTitle>侧边栏</SheetTitle>
            <SheetDescription>历史记录和知识库</SheetDescription>
          </VisuallyHidden>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}
