/**
 * 对话主页面
 *
 * 整合顶部栏、侧边栏和主对话区
 */

"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/topbar";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { SessionInfo } from "@/components/sidebar/session-info";
import { HistoryPanel } from "@/components/sidebar/history-panel";
import { KnowledgeTab } from "@/components/sidebar/knowledge-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getAuthCookie } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/api";
import { useChat } from "@/hooks/use-chat";
import { useHistory } from "@/hooks/use-history";
import type { AgentConfig, ChatHistoryDTO } from "@/types/api";

const USER_ID = "admin"; // 演示环境固定用户 ID

export default function ChatPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("session");
  const [pendingQuestion, setPendingQuestion] = useState<string>("");

  const { messages, isStreaming, sessionId, sendMessage, loadConversation, sendAiOps } = useChat({
    userId: USER_ID,
    agentId: selectedAgentId,
    onMessageComplete: async (message) => {
      // 保存对话历史
      if (pendingQuestion && message.role === "assistant") {
        await saveHistory({
          userId: USER_ID,
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

  const { histories, saveHistory, clearAllHistories } = useHistory({
    userId: USER_ID,
  });

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

    // 检查登录状态
    if (!getAuthCookie()) {
      router.push("/login");
    }
  }, [router]);

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
    // 加载单条历史记录到对话区
    loadConversation([{ question: history.question, answer: history.answer }]);
  };

  const handleAiOpsClick = async () => {
    const result = await sendAiOps(selectedAgentId);
    if (result) {
      // 保存 AIOps 对话历史
      await saveHistory({
        userId: USER_ID,
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
      <TabsList className="grid w-full grid-cols-3 m-2">
        <TabsTrigger value="session" className="text-xs">
          会话
        </TabsTrigger>
        <TabsTrigger value="history" className="text-xs">
          历史
        </TabsTrigger>
        <TabsTrigger value="knowledge" className="text-xs">
          知识库
        </TabsTrigger>
      </TabsList>

      <TabsContent value="session" className="flex-1 overflow-auto p-4">
        <SessionInfo
          userId={USER_ID}
          agentId={selectedAgentId}
          agentName={selectedAgentName}
          sessionId={sessionId}
        />
      </TabsContent>

      <TabsContent value="history" className="flex-1 overflow-auto">
        <HistoryPanel
          histories={histories}
          onLoad={handleLoadHistory}
          onClearAll={clearAllHistories}
        />
      </TabsContent>

      <TabsContent value="knowledge" className="flex-1 overflow-hidden">
        <KnowledgeTab userId={USER_ID} />
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      <Topbar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={handleAgentChange}
        onAiOpsClick={handleAiOpsClick}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-80 border-r border-border/40">
        {sidebarContent}
      </aside>

      {/* 移动端侧边栏（浮层） */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* 主对话区 */}
      <main className="flex-1 flex flex-col min-w-0">
        <MessageList messages={messages} />
        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
      </main>
    </>
  );
}
