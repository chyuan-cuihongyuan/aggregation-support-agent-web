/**
 * AIOps 告警中心页面
 *
 * 深色主题专用，左侧告警列表 + 右侧分析面板
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, RefreshCw, ChevronLeft, Search, Terminal, Zap, Wrench, BarChart3 } from "lucide-react";

// Mock 告警数据
const MOCK_ALERTS = [
  {
    id: "1", severity: "critical" as const, name: "CPU 使用率超过阈值",
    summary: "生产服务器 prod-web-01 的 CPU 使用率持续超过 90%",
    host: "prod-web-01", time: "5 分钟前",
    metrics: { cpu: "93.7%", cpuChange: "↑ 18.3%", memory: "81.2%", memChange: "↑ 6.7%", load: "12.8", loadChange: "↑ 4.2", processes: "186", procChange: "正常" },
    timeline: [
      { title: "直接原因：Java 应用 GC 频繁", desc: "app-server.jar 进程 Full GC 达每分钟 3 次，单次耗时 800ms+", confidence: "92%", emoji: "🔥" },
      { title: "关联事件：15:20 部署了 v2.3.1", desc: "问题开始时间与部署时间高度吻合", confidence: "87%", emoji: "📋" },
      { title: "影响范围：3 个微服务受影响", desc: "user-service、order-service P99 延迟上升 200%+", confidence: "高", emoji: "🔗" },
    ],
    suggestions: [
      { title: "立即回滚至 v2.3.0", desc: "使用 K8s rollout undo 回滚，预计 2 分钟内恢复", emoji: "⚡" },
      { title: "临时扩容 JVM 堆内存", desc: "Xmx 从 2G 调整为 4G，需重启 Pod", emoji: "🔧" },
      { title: "导出 Thread Dump 分析", desc: "通过 SSH 获取 jstack 输出，定位阻塞线程", emoji: "📊" },
    ],
  },
  {
    id: "2", severity: "critical" as const, name: "内存溢出告警",
    summary: "Java 进程 OOM Killer 触发，应用 Pod 重启", host: "k8s-node-03", time: "12 分钟前",
  },
  {
    id: "3", severity: "warning" as const, name: "磁盘空间不足",
    summary: "数据库服务器磁盘使用率 85%，预计 48h 耗尽", host: "db-master", time: "28 分钟前",
  },
  {
    id: "4", severity: "warning" as const, name: "MySQL 慢查询增加",
    summary: "慢查询从 5/min 上升至 23/min，延迟显著增加", host: "db-master", time: "45 分钟前",
  },
  {
    id: "5", severity: "info" as const, name: "Redis 连接数异常",
    summary: "Redis 集群连接数突增至 2000+，接近最大限制", host: "redis-cluster", time: "1 小时前",
  },
];

export default function AIOpsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeAlert, setActiveAlert] = useState(MOCK_ALERTS[0]);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "resolved">("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-[#0f0f14] text-[#55556a]">加载中...</div>;
  }

  const filteredAlerts = filter === "all"
    ? MOCK_ALERTS
    : MOCK_ALERTS.filter((a) => a.severity === filter);

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
          <span className="w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#8888a0] hover:bg-[#22222e] border border-[#2a2a3a]">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧告警列表 */}
        <aside className="w-[340px] bg-[#1a1a24] border-r border-[#2a2a3a] flex flex-col shrink-0">
          <div className="px-5 py-4 border-b border-[#2a2a3a]">
            <span className="text-[13px] text-[#8888a0]">活跃告警 <strong className="text-[#ef4444]">{MOCK_ALERTS.length}</strong></span>
          </div>

          {/* 过滤标签 */}
          <div className="flex gap-1 p-3 border-b border-[#2a2a3a]">
            {[
              { key: "all" as const, label: "全部" },
              { key: "critical" as const, label: "严重" },
              { key: "warning" as const, label: "警告" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-md border transition-colors ${
                  filter === tab.key
                    ? tab.key === "critical" ? "bg-[#ef4444] border-[#ef4444] text-white" : "bg-[#f59e0b] border-[#f59e0b] text-white"
                    : filter === tab.key && tab.key === "all" ? "bg-[#ef4444] border-[#ef4444] text-white"
                    : "border-[#2a2a3a] text-[#8888a0] hover:bg-[#22222e]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 告警列表 */}
          <ScrollArea className="flex-1 px-2 py-1">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setActiveAlert(alert)}
                className={`p-3.5 rounded-[10px] cursor-pointer mb-1.5 border transition-colors ${
                  activeAlert.id === alert.id
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
                  {alert.severity === "critical" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/15 text-[#ef4444]">严重</span>}
                </div>
              </div>
            ))}
          </ScrollArea>
        </aside>

        {/* 右侧分析 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 分析头部 */}
          <div className="px-7 py-5 border-b border-[#2a2a3a]">
            <h2 className="text-[18px] font-bold flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeAlert.severity === "critical" ? "bg-[#ef4444]" : "bg-[#f59e0b]"}`} />
              {activeAlert.name}
            </h2>
            <div className="flex gap-4 mt-2 text-[12px] text-[#55556a]">
              <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> {activeAlert.host}</span>
              <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {activeAlert.time}</span>
            </div>
          </div>

          <ScrollArea className="flex-1 px-7 py-5">
            {/* 指标卡片 */}
            {activeAlert.metrics && (
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "CPU 使用率", value: activeAlert.metrics.cpu, change: activeAlert.metrics.cpuChange, color: "text-[#ef4444]" },
                  { label: "内存使用", value: activeAlert.metrics.memory, change: activeAlert.metrics.memChange, color: "text-[#f59e0b]" },
                  { label: "平均负载", value: activeAlert.metrics.load, change: activeAlert.metrics.loadChange, color: "text-[#ef4444]" },
                  { label: "进程数", value: activeAlert.metrics.processes, change: activeAlert.metrics.procChange, color: "text-[#10b981]" },
                ].map((m) => (
                  <div key={m.label} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-[10px] p-4">
                    <div className="text-[11px] text-[#55556a] mb-1.5">{m.label}</div>
                    <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-[11px] mt-1 text-[#55556a]">{m.change}</div>
                  </div>
                ))}
              </div>
            )}

            {/* AI 根因分析 */}
            {activeAlert.timeline && (
              <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5 mb-5">
                <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                  <Search className="w-[18px] h-[18px] text-[#e63946]" />
                  AI 根因分析
                </h3>
                <div className="flex flex-col">
                  {activeAlert.timeline.map((item, i) => (
                    <div key={i} className="flex gap-3.5 pb-4 relative last:pb-0">
                      {i < (activeAlert.timeline?.length || 0) - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-[#2a2a3a]" />
                      )}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#22222e]">{item.emoji}</div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold mb-1">{item.title}</div>
                        <div className="text-[12px] text-[#8888a0] leading-relaxed">{item.desc}</div>
                        <div className="text-[11px] text-[#55556a] mt-1">AI 置信度: {item.confidence}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 处置建议 */}
            {activeAlert.suggestions && (
              <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-5">
                <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-[18px] h-[18px] text-[#10b981]" />
                  处置建议
                </h3>
                <div className="flex flex-col gap-2.5">
                  {activeAlert.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 p-3.5 bg-[#22222e] rounded-[10px] border border-[#2a2a3a]">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#2a2a38]">{s.emoji}</div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold mb-1">{s.title}</div>
                        <div className="text-[12px] text-[#8888a0]">{s.desc}</div>
                        <div className="flex gap-2 mt-2">
                          <button className="px-3 py-1 text-[11px] font-semibold bg-[#e63946] text-white rounded-md">执行</button>
                          <button className="px-3 py-1 text-[11px] font-semibold bg-[#2a2a38] text-[#8888a0] rounded-md">查看命令</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* 底部 AI 输入 */}
          <div className="px-7 py-4 border-t border-[#2a2a3a] bg-[#1a1a24]">
            <div className="flex gap-2">
              <Input placeholder="向 AI 提问关于此告警的问题..." className="flex-1 h-11 bg-[#22222e] border-[#2a2a3a] rounded-[10px] text-[14px] text-[#e4e4ef] placeholder:text-[#55556a]" />
              <Button className="h-11 px-5 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-[10px] shadow-none gap-2">
                <Activity className="w-4 h-4" />
                AI 分析
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
