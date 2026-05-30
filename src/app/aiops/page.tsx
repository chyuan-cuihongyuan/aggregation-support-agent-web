/**
 * AIOps 告警中心页面
 *
 * 深色主题专用，左侧告警列表 + 右侧分析面板
 * 使用真实后端数据，支持告警查询、过滤和AI分析
 * 管理员可切换到 RAG 追踪视图
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAlerts } from "@/hooks/use-alerts";
import { useRagTrace } from "@/hooks/use-rag-trace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, RefreshCw, ChevronLeft, Search, Terminal, Zap, Loader2, ChevronRight, ChevronDown } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { requestSSE, requestJson } from "@/lib/api";
import type { AlertDTO, UserInfoDTO, RagTraceEntity } from "@/types/api";

type AdminTab = "alerts" | "rag-trace";

export default function AIOpsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    alerts,
    counts,
    isLoading,
    // error,
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // ---- 管理员 Tab 状态 ----
  const isAdmin = user?.role === "admin";
  const [adminTab, setAdminTab] = useState<AdminTab>("alerts");

  // RAG 追踪筛选
  const [ragUserId, setRagUserId] = useState("");
  const [ragAgentId, setRagAgentId] = useState("");
  const [ragStartTime, setRagStartTime] = useState("");
  const [ragEndTime, setRagEndTime] = useState("");
  const [userList, setUserList] = useState<UserInfoDTO[]>([]);

  const {
    traces,
    total: ragTotal,
    page: ragPage,
    pageSize: ragPageSize,
    isLoading: ragLoading,
    filters: ragFilters,
    setFilters: setRagFilters,
    goToPage: ragGoToPage,
  } = useRagTrace({ autoLoad: false });

  // 展开的追踪记录
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // 设置默认选中的告警 - 使用 useRef 避免级联渲染
  const defaultAlertSetRef = useRef(false);
  useEffect(() => {
    if (alerts.length > 0 && !defaultAlertSetRef.current) {
      defaultAlertSetRef.current = true;
      setActiveAlert(alerts[0]);
    }
  }, [alerts]);

  // 加载用户列表（管理员下拉框）
  useEffect(() => {
    if (isAdmin && adminTab === "rag-trace") {
      requestJson<{ list: UserInfoDTO[] }>("/api/v1/user/list?page=1&pageSize=100")
        .then((data) => setUserList(data.list ?? []))
        .catch(() => {});
    }
  }, [isAdmin, adminTab]);

  // 刷新告警列表
  const handleRefresh = useCallback(() => {
    loadAlerts();
  }, [loadAlerts]);

  // 停止分析
  const handleStopAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAnalyzing(false);
    }
  }, []);

  // AI分析告警
  const handleAiAnalysis = useCallback(async (alertId?: string) => {
    if (!activeAlert && !alertId) return;

    // 取消之前的请求
    handleStopAnalysis();

    setIsAnalyzing(true);
    setAiAnalysis("");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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
          alertDescription,
        },
        (chunk) => {
          if (!abortController.signal.aborted) {
            setAiAnalysis(prev => prev + chunk);
          }
        },
        abortController.signal
      );
    } catch (err) {
      if (!abortController.signal.aborted) {
        setAiAnalysis(`分析失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsAnalyzing(false);
      }
      abortControllerRef.current = null;
    }
  }, [activeAlert, alerts, handleStopAnalysis]);

  // 提交问题
  const handleAskQuestion = useCallback(async () => {
    if (!question.trim() || !activeAlert) return;

    // 取消之前的请求
    handleStopAnalysis();

    setIsAnalyzing(true);
    setAiAnalysis("");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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
          alertDescription: alertContext,
        },
        (chunk) => {
          if (!abortController.signal.aborted) {
            setAiAnalysis(prev => prev + chunk);
          }
        },
        abortController.signal
      );

      if (!abortController.signal.aborted) {
        setQuestion("");
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        setAiAnalysis(`分析失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsAnalyzing(false);
      }
      abortControllerRef.current = null;
    }
  }, [question, activeAlert, handleStopAnalysis]);

  // RAG 追踪筛选
  const handleRagSearch = useCallback(() => {
    setRagFilters({
      userId: ragUserId || undefined,
      agentId: ragAgentId || undefined,
      startTime: ragStartTime || undefined,
      endTime: ragEndTime || undefined,
    });
  }, [ragUserId, ragAgentId, ragStartTime, ragEndTime, setRagFilters]);

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
          {counts.total > 0 && adminTab === "alerts" && (
            <span className="w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 管理员 Tab 切换 */}
          {isAdmin && (
            <div className="flex gap-1 mr-2 bg-[#22222e] rounded-lg p-1">
              <button
                onClick={() => setAdminTab("alerts")}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  adminTab === "alerts"
                    ? "bg-[#e63946] text-white"
                    : "text-[#8888a0] hover:text-[#e4e4ef]"
                }`}
              >
                告警中心
              </button>
              <button
                onClick={() => setAdminTab("rag-trace")}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  adminTab === "rag-trace"
                    ? "bg-[#6366f1] text-white"
                    : "text-[#8888a0] hover:text-[#e4e4ef]"
                }`}
              >
                RAG 追踪
              </button>
            </div>
          )}
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

      {/* 管理员 RAG 追踪视图 */}
      {isAdmin && adminTab === "rag-trace" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 筛选栏 */}
          <div className="px-5 py-3 border-b border-[#2a2a3a] bg-[#1a1a24] flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#55556a]">用户</label>
              <select
                value={ragUserId}
                onChange={(e) => setRagUserId(e.target.value)}
                className="h-9 w-[160px] bg-[#22222e] border border-[#2a2a3a] rounded-md px-2 text-[13px] text-[#e4e4ef] focus:outline-none focus:border-[#6366f1]"
              >
                <option value="">全部用户</option>
                {userList.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.nickname || u.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#55556a]">Agent ID</label>
              <Input
                value={ragAgentId}
                onChange={(e) => setRagAgentId(e.target.value)}
                placeholder="如 200001"
                className="h-9 w-[140px] bg-[#22222e] border-[#2a2a3a] text-[13px] text-[#e4e4ef] placeholder:text-[#55556a]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#55556a]">开始时间</label>
              <Input
                type="datetime-local"
                value={ragStartTime}
                onChange={(e) => setRagStartTime(e.target.value)}
                className="h-9 w-[180px] bg-[#22222e] border-[#2a2a3a] text-[13px] text-[#e4e4ef]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#55556a]">结束时间</label>
              <Input
                type="datetime-local"
                value={ragEndTime}
                onChange={(e) => setRagEndTime(e.target.value)}
                className="h-9 w-[180px] bg-[#22222e] border-[#2a2a3a] text-[13px] text-[#e4e4ef]"
              />
            </div>
            <Button
              className="h-9 px-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-md shadow-none text-[13px]"
              onClick={handleRagSearch}
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              查询
            </Button>
          </div>

          {/* 追踪列表 */}
          <ScrollArea className="flex-1 px-5 py-3">
            {ragLoading ? (
              <div className="flex items-center justify-center py-12 text-[#55556a]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                加载中...
              </div>
            ) : traces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#55556a]">
                <Search className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-[13px]">暂无追踪记录</p>
                <p className="text-[12px] mt-1">请调整筛选条件后查询</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* 统计摘要 */}
                <div className="flex gap-4 mb-4 text-[12px] text-[#55556a]">
                  <span>共 <strong className="text-[#e4e4ef]">{ragTotal}</strong> 条记录</span>
                  <span>第 {ragPage} 页，每页 {ragPageSize} 条</span>
                </div>

                {/* 追踪记录列表 */}
                {traces.map((trace) => (
                  <RagTraceCard
                    key={trace.traceId}
                    trace={trace}
                    isExpanded={expandedTraceId === trace.traceId}
                    onToggle={() => setExpandedTraceId(expandedTraceId === trace.traceId ? null : trace.traceId)}
                  />
                ))}

                {/* 分页 */}
                {ragTotal > ragPageSize && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#2a2a3a] text-[#8888a0] hover:bg-[#22222e]"
                      disabled={ragPage <= 1}
                      onClick={() => ragGoToPage(ragPage - 1)}
                    >
                      上一页
                    </Button>
                    <span className="text-[12px] text-[#55556a] px-2">
                      {ragPage} / {Math.ceil(ragTotal / ragPageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#2a2a3a] text-[#8888a0] hover:bg-[#22222e]"
                      disabled={ragPage >= Math.ceil(ragTotal / ragPageSize)}
                      onClick={() => ragGoToPage(ragPage + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        /* 告警中心视图 */
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
                      <div
                        className="prose prose-sm prose-invert max-w-none text-[13px] text-[#8888a0] leading-relaxed [&_pre]:bg-[#0d0d15] [&_pre]:text-[#cdd6f4] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-[#2a2a3a] [&_code]:text-[#f0abfc] [&_code]:bg-[#1a1a24] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(aiAnalysis, { async: false, gfm: true, breaks: true }) as string) }}
                      />
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-3 mb-5">
                    <Button
                      className="h-10 px-4 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-[10px] shadow-none gap-2"
                      onClick={() => isAnalyzing ? handleStopAnalysis() : handleAiAnalysis()}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          停止分析
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          AI 根因分析
                        </>
                      )}
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
      )}
    </div>
  );
}

// ========== RAG 追踪记录卡片组件 ==========

function RagTraceCard({
  trace,
  isExpanded,
  onToggle,
}: {
  trace: RagTraceEntity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg overflow-hidden">
      {/* 卡片头部 */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#22222e] transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[#55556a] shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#55556a] shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-medium text-[#e4e4ef] truncate">{trace.queryText}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#55556a]">
            <span>用户: <span className="text-[#8888a0]">{trace.ownerUserId}</span></span>
            <span>Agent: <span className="text-[#8888a0]">{trace.agentId ?? "-"}</span></span>
            <span>TopK: <span className="text-[#8888a0]">{trace.retrievalTopk}</span></span>
            <span>来源: <span className="text-[#8888a0]">{trace.sources?.length ?? 0} 个</span></span>
            <span>{trace.createTime}</span>
          </div>
        </div>
      </button>

      {/* 展开详情 */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t border-[#2a2a3a]">
          {/* 改写后的查询 */}
          {trace.rewriteText && trace.rewriteText !== trace.queryText && (
            <div className="mt-3 mb-2">
              <span className="text-[11px] text-[#55556a]">改写查询: </span>
              <span className="text-[12px] text-[#8888a0]">{trace.rewriteText}</span>
            </div>
          )}

          {/* 来源列表 */}
          {trace.sources && trace.sources.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <span className="text-[11px] text-[#55556a] font-medium">检索来源:</span>
              {trace.sources.map((src, i) => (
                <div key={src.chunkId || i} className="ml-2 p-2 bg-[#22222e] rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-[#e4e4ef]">{src.documentName || src.documentId}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6366f1]/20 text-[#6366f1]">{src.retrievalType}</span>
                    <span className="text-[10px] text-[#55556a]">分数: {src.score?.toFixed(3)}</span>
                  </div>
                  {src.snippet && (
                    <p className="text-[11px] text-[#8888a0] leading-relaxed line-clamp-2">{src.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Trace ID */}
          <div className="mt-2 text-[10px] text-[#55556a]">
            Trace ID: {trace.traceId}
          </div>
        </div>
      )}
    </div>
  );
}
