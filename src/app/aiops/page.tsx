/**
 * AIOps 告警中心页面
 *
 * 深色主题专用，左侧告警列表 + 右侧分析面板
 * 使用真实后端数据，支持告警查询、过滤和AI分析
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAlerts } from "@/hooks/use-alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, RefreshCw, ChevronLeft, Search, Terminal, Zap, Loader2 } from "lucide-react";
import { requestJson, requestSSE } from "@/lib/api";
import type { AlertDTO } from "@/types/api";

export default function AIOpsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    alerts,
    counts,
    isLoading,
    error,
    severity,
    loadAlerts,
    acknowledgeAlert,
    resolveAlert,
    changeSeverity,
  } = useAlerts({ autoLoad: true });

  const [activeAlert, setActiveAlert] = useState<AlertDTO | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // 设置默认选中的告警
  useEffect(() => {
    if (alerts.length > 0 && !activeAlert) {
      setActiveAlert(alerts[0]);
    }
  }, [alerts, activeAlert]);

  // 刷新告警列表
  const handleRefresh = useCallback(() => {
    loadAlerts();
  }, [loadAlerts]);

  // AI分析告警
  const handleAiAnalysis = useCallback(async (alertId?: string) => {
    if (!activeAlert && !alertId) return;

    setIsAnalyzing(true);
    setAiAnalysis("");

    try {
      const targetAlert = alertId
        ? alerts.find(a => a.id === alertId)
        : activeAlert;

      if (!targetAlert) return;

      const alertDescription = `告警名称: ${targetAlert.name}
告警摘要: ${targetAlert.summary}
告警主机: ${targetAlert.host}
严重程度: ${targetAlert.severity}
${targetAlert.metrics ? `指标数据: ${JSON.stringify(targetAlert.metrics)}` : ''}
${targetAlert.description ? `详细描述: ${targetAlert.description}` : ''}

请分析这个告警的根本原因，并提供处置建议。`;

      await requestSSE(
        "/api/v1/ai_ops",
        {
          agentId: "200002",
          userId: user?.username || "default",
          alertDescription,
        },
        (chunk) => {
          setAiAnalysis(prev => prev + chunk);
        }
      );
    } catch (err) {
      setAiAnalysis(`分析失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeAlert, alerts, user]);

  // 提交问题
  const handleAskQuestion = useCallback(async () => {
    if (!question.trim() || !activeAlert) return;

    setIsAnalyzing(true);
    setAiAnalysis("");

    try {
      const alertContext = `告警信息:
- 名称: ${activeAlert.name}
- 摘要: ${activeAlert.summary}
- 主机: ${activeAlert.host}
- 严重程度: ${activeAlert.severity}

用户问题: ${question}`;

      await requestSSE(
        "/api/v1/ai_ops",
        {
          agentId: "200002",
          userId: user?.username || "default",
          alertDescription: alertContext,
        },
        (chunk) => {
          setAiAnalysis(prev => prev + chunk);
        }
      );

      setQuestion("");
    } catch (err) {
      setAiAnalysis(`分析失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [question, activeAlert, user]);

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-[#0f0f14] text-[#55556a]">加载中...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f14] text-[#e4e4ef]">
      {/* 顶栏 */}
      <header className="h-14 border-b border-[#2a2a3a] bg-[#1a1a24] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")} className="h-8 w-8 text-[#8888a0] hover:bg-[#22222e]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Activity className="w-5 h-5 text-[#ef4444]" />
          <span className="text-sm font-bold">AIOps 告警中心</span>
          {counts.total > 0 && (
            <span className="w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#8888a0] hover:bg-[#22222e] border border-[#2a2a3a]"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧告警列表 */}
        <aside className="w-[340px] bg-[#1a1a24] border-r border-[#2a2a3a] flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-[#2a2a3a]">
            <span className="text-[13px] text-[#8888a0]">
              活跃告警 <strong className="text-[#ef4444]">{counts.total}</strong>
            </span>
          </div>

          {/* 过滤标签 */}
          <div className="flex gap-1 p-3 border-b border-[#2a2a3a]">
            {[
              { key: "all", label: "全部", count: counts.total },
              { key: "critical", label: "严重", count: counts.critical },
              { key: "warning", label: "警告", count: counts.warning },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => changeSeverity(tab.key)}
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-md border transition-colors ${
                  severity === tab.key
                    ? tab.key === "critical"
                      ? "bg-[#ef4444] border-[#ef4444] text-white"
                      : tab.key === "warning"
                        ? "bg-[#f59e0b] border-[#f59e0b] text-white"
                        : "bg-[#6366f1] border-[#6366f1] text-white"
                    : "border-[#2a2a3a] text-[#8888a0] hover:bg-[#22222e]"
                }`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>

          {/* 告警列表 */}
          <ScrollArea className="flex-1 px-2 py-1">
            {isLoading && alerts.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-[#55556a]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                加载中...
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#55556a]">
                <Activity className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-[13px]">暂无告警</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setActiveAlert(alert)}
                  className={`p-3.5 rounded-[10px] cursor-pointer mb-1.5 border transition-colors ${
                    activeAlert?.id === alert.id
                      ? "bg-[#22222e] border-[#e63946]"
                      : "border-transparent hover:bg-[#22222e]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      alert.severity === "critical" ? "bg-[#ef4444] shadow-[0_0_8px_#ef4444]" :
                      alert.severity === "warning" ? "bg-[#f59e0b]" : "bg-[#6366f1]"
                    }`} />
                    <span className="text-[13px] font-semibold truncate flex-1">{alert.name}</span>
                    <span className="text-[11px] text-[#55556a] shrink-0">{alert.time}</span>
                  </div>
                  <div className="text-[12px] text-[#8888a0] leading-relaxed line-clamp-2">{alert.summary}</div>
                  <div className="flex gap-1 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a38] text-[#8888a0]">{alert.host}</span>
                    {alert.severity === "critical" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/15 text-[#ef4444]">严重</span>
                    )}
                    {alert.status === "acknowledged" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f59e0b]/15 text-[#f59e0b]">已确认</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </aside>

        {/* 右侧分析 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeAlert ? (
            <>
              {/* 分析头部 */}
              <div className="px-7 py-5 border-b border-[#2a2a3a]">
                <h2 className="text-[18px] font-bold flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    activeAlert.severity === "critical" ? "bg-[#ef4444]" :
                    activeAlert.severity === "warning" ? "bg-[#f59e0b]" : "bg-[#6366f1]"
                  }`} />
                  {activeAlert.name}
                </h2>
                <div className="flex gap-4 mt-2 text-[12px] text-[#55556a]">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> {activeAlert.host}</span>
                  <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {activeAlert.time}</span>
                  <span className="flex items-center gap-1">
                    状态: {activeAlert.status === "active" ? "活跃" : activeAlert.status === "acknowledged" ? "已确认" : "已解决"}
                  </span>
                </div>
              </div>

              <ScrollArea className="flex-1 px-7 py-5">
                {/* 告警摘要 */}
                <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5 mb-5">
                  <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-[18px] h-[18px] text-[#8888a0]" />
                    告警摘要
                  </h3>
                  <p className="text-[13px] text-[#8888a0] leading-relaxed">{activeAlert.summary}</p>
                  {activeAlert.description && (
                    <p className="text-[13px] text-[#8888a0] leading-relaxed mt-2">{activeAlert.description}</p>
                  )}
                </div>

                {/* 指标卡片 */}
                {activeAlert.metrics && Object.keys(activeAlert.metrics).length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {Object.entries(activeAlert.metrics).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-[10px] p-4">
                        <div className="text-[11px] text-[#55556a] mb-1.5">{key}</div>
                        <div className="text-2xl font-bold text-[#e4e4ef]">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI 分析结果 */}
                {aiAnalysis && (
                  <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5 mb-5">
                    <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                      <Search className="w-[18px] h-[18px] text-[#e63946]" />
                      AI 分析结果
                    </h3>
                    <div className="text-[13px] text-[#8888a0] leading-relaxed whitespace-pre-wrap">
                      {aiAnalysis}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3 mb-5">
                  <Button
                    className="h-10 px-4 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-[10px] shadow-none gap-2"
                    onClick={() => handleAiAnalysis()}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    AI 根因分析
                  </Button>
                  {activeAlert.status === "active" && (
                    <Button
                      variant="outline"
                      className="h-10 px-4 border-[#2a2a3a] text-[#8888a0] hover:bg-[#22222e] rounded-[10px]"
                      onClick={() => acknowledgeAlert(activeAlert.id)}
                    >
                      确认告警
                    </Button>
                  )}
                  {(activeAlert.status === "active" || activeAlert.status === "acknowledged") && (
                    <Button
                      variant="outline"
                      className="h-10 px-4 border-[#2a2a3a] text-[#10b981] hover:bg-[#10b981]/10 rounded-[10px]"
                      onClick={() => resolveAlert(activeAlert.id)}
                    >
                      解决告警
                    </Button>
                  )}
                </div>
              </ScrollArea>

              {/* 底部 AI 输入 */}
              <div className="px-7 py-4 border-t border-[#2a2a3a] bg-[#1a1a24]">
                <div className="flex gap-2">
                  <Input
                    placeholder="向 AI 提问关于此告警的问题..."
                    className="flex-1 h-11 bg-[#22222e] border-[#2a2a3a] rounded-[10px] text-[14px] text-[#e4e4ef] placeholder:text-[#55556a]"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                    disabled={isAnalyzing}
                  />
                  <Button
                    className="h-11 px-5 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-[10px] shadow-none gap-2"
                    onClick={handleAskQuestion}
                    disabled={isAnalyzing || !question.trim()}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    AI 分析
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#55556a]">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-[15px]">暂无告警数据</p>
                <p className="text-[13px] mt-2">请等待监控系统推送告警</p>
                <Button
                  variant="outline"
                  className="mt-4 border-[#2a2a3a] text-[#8888a0] hover:bg-[#22222e]"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
