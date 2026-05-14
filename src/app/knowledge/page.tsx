/**
 * 知识库管理页面
 *
 * 左侧知识库列表 + 右侧文件上传/文档管理/检索测试
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Upload, Search, Plus, FileText, Trash2, Download, ChevronLeft } from "lucide-react";
import { requestJson, uploadFile } from "@/lib/api";
import type { DocumentDTO } from "@/types/api";

interface KnowledgeBase {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  updatedAt: string;
}

// Mock 知识库列表
const MOCK_KB: KnowledgeBase[] = [
  { id: "ops", name: "运维知识库", icon: "📁", color: "#fef3c7", count: 24, updatedAt: "2 小时前" },
  { id: "product", name: "产品文档", icon: "📚", color: "#dbeafe", count: 56, updatedAt: "1 天前" },
  { id: "tech", name: "技术文档", icon: "🔬", color: "#dcfce7", count: 18, updatedAt: "3 天前" },
  { id: "api", name: "API 参考手册", icon: "📋", color: "#f3e8ff", count: 42, updatedAt: "1 周前" },
];

export default function KnowledgePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeKb, setActiveKb] = useState<KnowledgeBase>(MOCK_KB[0]);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ source: string; text: string; score: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const userId = user?.username || "default";

  // 加载文档列表
  const loadDocuments = useCallback(async () => {
    try {
      const data = await requestJson<DocumentDTO[]>(`/api/v1/documents?userId=${userId}`);
      setDocuments(data);
    } catch {
      // 静默
    }
  }, [userId]);

  useEffect(() => {
    if (user) loadDocuments();
  }, [user, loadDocuments]);

  // 文件上传
  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        await uploadFile("/api/v1/upload", formData);
      }
      await loadDocuments();
    } catch {
      // 错误已在 uploadFile 中处理
    } finally {
      setIsUploading(false);
    }
  };

  // 删除文档
  const handleDelete = async (docId: string) => {
    try {
      await requestJson(`/api/v1/documents/${docId}?userId=${userId}`, { method: "DELETE" });
      await loadDocuments();
    } catch {
      // 静默
    }
  };

  // 检索测试
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const data = await requestJson<{ source: string; text: string; score: number }[]>(
        "/api/v1/documents/search",
        { method: "POST", body: JSON.stringify({ query: searchQuery, userId }) }
      );
      setSearchResults(data);
    } catch {
      // 静默
    }
  };

  // 认证守卫
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-[var(--surface-bg)] text-[var(--text-muted)]">加载中...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--surface-bg)]">
      {/* 顶栏 */}
      <header className="h-14 border-b border-[var(--border-default)] dark:border-[#2a2a3a] bg-[var(--surface-main)] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")} className="h-8 w-8 text-[var(--text-secondary)]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)]">知识库管理</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧知识库列表 */}
        <aside className="w-[280px] bg-[var(--surface-main)] border-r border-[var(--border-default)] dark:border-[#2a2a3a] flex flex-col shrink-0">
          <div className="p-4 border-b border-[var(--border-default)] dark:border-[#2a2a3a] flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">知识库</span>
            <button className="w-[30px] h-[30px] rounded-md bg-[var(--brand-accent)] text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3">
            <Input placeholder="搜索知识库..." className="h-9 bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]" />
          </div>
          <ScrollArea className="flex-1 px-2">
            {MOCK_KB.map((kb) => (
              <div
                key={kb.id}
                onClick={() => setActiveKb(kb)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                  activeKb.id === kb.id
                    ? "bg-red-50 dark:bg-[#e63946]/10 border border-red-200 dark:border-[#e63946]/20"
                    : "hover:bg-[var(--surface-card)] dark:hover:bg-[#22222e]"
                }`}
              >
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg" style={{ background: kb.color }}>
                  {kb.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{kb.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">更新于 {kb.updatedAt}</div>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-[var(--surface-card)] dark:bg-[#22222e] rounded-full text-[var(--text-secondary)]">
                  {kb.count}
                </span>
              </div>
            ))}
          </ScrollArea>
        </aside>

        {/* 右侧主区域 */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* 知识库标题 */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[var(--text-primary)] flex items-center gap-3">
                <span className="text-[28px]">{activeKb.icon}</span>
                {activeKb.name}
              </h1>
              <div className="flex gap-5 mt-3 text-[13px] text-[var(--text-secondary)]">
                <span><strong className="text-[var(--text-primary)]">{activeKb.count}</strong> 篇文档</span>
                <span>创建于 2025-01-10</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-9 gap-2 text-[13px] border-[var(--border-default)] dark:border-[#2a2a3a] text-[var(--text-secondary)]"
                onClick={() => {/* 滚动到检索面板 */}}
              >
                <Search className="w-4 h-4" />
                检索测试
              </Button>
              <label>
                <Button className="h-9 gap-2 text-[13px] bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white shadow-none" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    上传文件
                  </span>
                </Button>
                <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} accept=".pdf,.docx,.txt,.md,.csv,.xlsx" />
              </label>
            </div>
          </div>

          {/* 上传区域 */}
          <label className="block border-2 border-dashed border-[var(--border-default)] dark:border-[#2a2a3a] rounded-2xl p-10 text-center mb-6 hover:border-[var(--brand-accent)] hover:bg-red-50/50 dark:hover:bg-[#e63946]/5 transition-colors cursor-pointer">
            <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} accept=".pdf,.docx,.txt,.md,.csv,.xlsx" />
            <div className="w-14 h-14 bg-[var(--surface-card)] dark:bg-[#22222e] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-[var(--brand-accent)]" />
            </div>
            <div className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">拖拽文件到此处上传</div>
            <div className="text-[13px] text-[var(--text-secondary)] mb-4">或点击选择文件，支持批量上传</div>
            <div className="flex justify-center gap-2">
              {["PDF", "DOCX", "TXT", "MD", "CSV", "XLSX"].map((f) => (
                <span key={f} className="text-[11px] px-2.5 py-1 bg-[var(--surface-card)] dark:bg-[#22222e] rounded-md text-[var(--text-secondary)] font-medium">{f}</span>
              ))}
            </div>
          </label>

          {/* 文档列表 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">已上传文档</h3>
            <span className="text-[12px] text-[var(--text-muted)]">共 {documents.length} 篇</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-6">
            {documents.map((doc) => (
              <div key={doc.documentId} className="bg-[var(--surface-main)] dark:bg-[#1a1a24] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    doc.fileName?.endsWith(".pdf") ? "bg-red-50 dark:bg-red-900/20" :
                    doc.fileName?.endsWith(".docx") ? "bg-blue-50 dark:bg-blue-900/20" :
                    doc.fileName?.endsWith(".md") ? "bg-green-50 dark:bg-green-900/20" :
                    "bg-yellow-50 dark:bg-yellow-900/20"
                  }`}>
                    {doc.fileName?.endsWith(".pdf") ? "📕" : doc.fileName?.endsWith(".docx") ? "📘" : doc.fileName?.endsWith(".md") ? "📗" : "📙"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{doc.fileName || "文档"}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "未知大小"}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${
                    doc.processingStatus === "success" ? "text-[var(--status-success)]" :
                    doc.processingStatus === "processing" ? "text-[var(--status-warning)]" :
                    "text-[var(--status-error)]"
                  }`}>
                    <span className={`w-[6px] h-[6px] rounded-full ${
                      doc.processingStatus === "success" ? "bg-[var(--status-success)]" :
                      doc.processingStatus === "processing" ? "bg-[var(--status-warning)]" :
                      "bg-[var(--status-error)]"
                    }`} />
                    {doc.processingStatus === "success" ? "已向量化" : doc.processingStatus === "processing" ? "处理中" : "失败"}
                  </span>
                  <div className="flex gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-card)] dark:hover:bg-[#22222e] hover:text-[var(--text-primary)] transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(doc.documentId)} className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-[var(--status-error)] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="col-span-full py-12 text-center text-[14px] text-[var(--text-muted)]">
                暂无文档，请上传文件
              </div>
            )}
          </div>

          {/* 检索测试面板 */}
          <div className="bg-[var(--surface-main)] dark:bg-[#1a1a24] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl p-5">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
              <Search className="w-[18px] h-[18px] text-[var(--brand-accent)]" />
              知识库检索测试
            </h3>
            <div className="flex gap-2 mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入查询内容，测试知识库检索效果..."
                className="flex-1 h-[42px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-[10px]"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} className="h-[42px] px-5 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-[10px] shadow-none">
                检索
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {searchResults.map((r, i) => (
                  <div key={i} className="p-3 bg-[var(--surface-card)] dark:bg-[#22222e] rounded-lg border border-[var(--border-default)] dark:border-[#2a2a3a]">
                    <div className="text-[11px] text-[var(--text-muted)] mb-1">{r.source}</div>
                    <div className="text-[13px] text-[var(--text-primary)] leading-relaxed">{r.text}</div>
                    <div className="text-[11px] text-[var(--status-success)] mt-1 font-medium">相关度: {(r.score * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
