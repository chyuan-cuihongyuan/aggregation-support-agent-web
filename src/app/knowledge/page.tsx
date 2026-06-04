/**
 * 知识库管理页面
 *
 * 左侧知识库列表（手动创建）+ 右侧文件上传/文档管理/检索测试
 * 文件上传后存入 MySQL + Milvus（向量库）+ ES（BM25 索引）
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookOpen, Upload, Search, Plus, FileText, Trash2, Download, ChevronLeft, Network, ImageIcon, FlaskConical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requestJson, uploadFile } from "@/lib/api";
import { GraphViewer } from "@/components/knowledge/graph-viewer";
import { EntityDetailPanel } from "@/components/knowledge/entity-detail-panel";
import { ImageUpload } from "@/components/knowledge/image-upload";
import { CrossModalSearch } from "@/components/knowledge/cross-modal-search";
import { ImageList } from "@/components/knowledge/image-grid";
import type {
  DocumentDTO,
  KnowledgeBaseDTO,
  UploadResponseDTO,
  ImageDTO,
  GraphNode,
  GraphStatistics,
  SearchResultItem,
  SearchTestResult,
} from "@/types/api";

// 预设图标
const PRESET_ICONS = ["📁", "📚", "🔬", "📋", "🔧", "💡", "📊", "🗂️"];
// 预设颜色
const PRESET_COLORS = ["#fef3c7", "#dbeafe", "#dcfce7", "#f3e8ff", "#fee2e2", "#ffedd5"];

export default function KnowledgePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 知识库列表（从后端 API 获取，非硬编码）
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseDTO[]>([]);
  const [activeKb, setActiveKb] = useState<KnowledgeBaseDTO | null>(null);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [images, setImages] = useState<ImageDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchTestResult | null>(null);
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStatistics | null>(null);

  // 创建知识库对话框
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [newKbDesc, setNewKbDesc] = useState("");
  const [newKbIcon, setNewKbIcon] = useState("📁");
  const [newKbColor, setNewKbColor] = useState("#fef3c7");
  const [isCreating, setIsCreating] = useState(false);

  // 上传状态
  const [isUploading, setIsUploading] = useState(false);

  // 记录当前选中的知识库 ID，用于 effect 依赖避免对象引用问题
  const activeKbId = activeKb?.knowledgeBaseId ?? null;

  const userId = user?.username || "default";

  // ========== 数据加载 ==========

  /** 加载知识库列表 */
  const loadKnowledgeBases = useCallback(async () => {
    try {
      const data = await requestJson<KnowledgeBaseDTO[]>("/api/v1/knowledge-bases");
      setKnowledgeBases(data);
      return data;
    } catch {
      toast.error("加载知识库列表失败");
      return [];
    }
  }, []);

  /** 加载文档列表（按选中知识库过滤） */
  const loadDocuments = useCallback(async () => {
    try {
      const url = activeKbId
        ? `/api/v1/documents?knowledgeBaseId=${activeKbId}`
        : `/api/v1/documents?userId=${userId}`;
      const data = await requestJson<DocumentDTO[]>(url);
      setDocuments(data);
    } catch {
      // 静默
    }
  }, [userId, activeKbId]);

  /** 加载图片列表 */
  const loadImages = useCallback(async () => {
    try {
      const data = await requestJson<ImageDTO[]>(`/api/v1/images?userId=${userId}`);
      setImages(data);
    } catch {
      // 静默
    }
  }, [userId]);

  // ========== 知识库操作 ==========

  /** 创建知识库 */
  const handleCreateKnowledgeBase = async () => {
    if (!newKbName.trim()) {
      toast.error("请输入知识库名称");
      return;
    }
    setIsCreating(true);
    try {
      const data = await requestJson<KnowledgeBaseDTO>("/api/v1/knowledge-bases", {
        method: "POST",
        body: JSON.stringify({
          name: newKbName.trim(),
          description: newKbDesc.trim() || undefined,
          icon: newKbIcon || undefined,
          color: newKbColor || undefined,
        }),
      });
      toast.success(`知识库「${data.name}」创建成功`);
      setShowCreateDialog(false);
      // 重置表单
      setNewKbName("");
      setNewKbDesc("");
      setNewKbIcon("📁");
      setNewKbColor("#fef3c7");
      // 刷新列表并自动选中新建的知识库
      const updatedList = await loadKnowledgeBases();
      const match = updatedList.find((kb) => kb.knowledgeBaseId === data.knowledgeBaseId);
      if (match) setActiveKb(match);
      else setActiveKb(data);
    } catch {
      toast.error("创建知识库失败");
    } finally {
      setIsCreating(false);
    }
  };

  /** 删除知识库 */
  const handleDeleteKnowledgeBase = async (kbId: string, kbName: string) => {
    try {
      await requestJson(`/api/v1/knowledge-bases/${kbId}`, { method: "DELETE" });
      toast.success(`知识库「${kbName}」已删除`);
      if (activeKbId === kbId) {
        setActiveKb(null);
        setDocuments([]);
      }
      await loadKnowledgeBases();
    } catch {
      toast.error("删除知识库失败");
    }
  };

  // ========== 文件操作 ==========

  /** 上传文件（传递 knowledgeBaseId） */
  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!activeKb) {
      toast.error("请先选择或创建一个知识库");
      return;
    }
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("knowledgeBaseId", activeKb.knowledgeBaseId);
          await uploadFile<UploadResponseDTO>("/api/v1/upload", formData);
          successCount++;
        } catch (err) {
          failCount++;
          console.error("上传失败:", file.name, err);
        }
      }
      if (successCount > 0) {
        toast.success(`成功上传 ${successCount} 个文件到「${activeKb.name}」`);
        await Promise.all([loadDocuments(), loadKnowledgeBases()]);
      }
      if (failCount > 0) {
        toast.error(`${failCount} 个文件上传失败`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  /** 删除文档 */
  const handleDelete = async (docId: string) => {
    try {
      await requestJson(`/api/v1/documents/${docId}`, { method: "DELETE" });
      toast.success("文档已删除");
      await Promise.all([loadDocuments(), loadKnowledgeBases()]);
    } catch {
      toast.error("删除文档失败");
    }
  };

  /** 检索测试 */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const data = await requestJson<SearchTestResult>(
        "/api/v1/documents/search",
        { method: "POST", body: JSON.stringify({ query: searchQuery, topK: 5 }) }
      );
      setSearchResults(data);
    } catch {
      setSearchResults(null);
      toast.error("检索测试失败");
    }
  };

  // ========== 生命周期 ==========

  /** 页面初始化：加载知识库、文档、图片、图谱 */
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        // 先加载知识库列表
        const kbData = await requestJson<KnowledgeBaseDTO[]>("/api/v1/knowledge-bases");
        setKnowledgeBases(kbData);

        // 如果有知识库，选中第一个并加载其文档
        if (kbData.length > 0) {
          setActiveKb(kbData[0]);
          const docs = await requestJson<DocumentDTO[]>(
            `/api/v1/documents?knowledgeBaseId=${kbData[0].knowledgeBaseId}`
          );
          setDocuments(docs);
        } else {
          // 没有知识库时不加载文档
          setDocuments([]);
        }

        // 并行加载图片和图谱统计
        const [imgs, stats] = await Promise.all([
          requestJson<ImageDTO[]>(`/api/v1/images?userId=${userId}`).catch(() => []),
          requestJson<GraphStatistics>("/api/v1/graph/statistics").catch(() => null as unknown as GraphStatistics),
        ]);
        setImages(imgs || []);
        setGraphStats(stats);
      } catch {
        // 静默处理错误
      }
    };
    loadData();
  }, [user, userId]);

  /** 知识库切换时重新加载文档 */
  useEffect(() => {
    if (!user) return;
    const loadDocsForKb = async () => {
      if (!activeKbId) {
        setDocuments([]);
        return;
      }
      try {
        const data = await requestJson<DocumentDTO[]>(
          `/api/v1/documents?knowledgeBaseId=${activeKbId}`
        );
        setDocuments(data);
      } catch {
        // 静默
      }
    };
    loadDocsForKb();
  }, [user, activeKbId]);

  // 认证守卫
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // ========== 渲染辅助 ==========

  const renderSearchResultList = (items?: SearchResultItem[]) => {
    const list = items || [];
    if (list.length === 0) {
      return (
        <div className="text-[12px] text-[var(--text-muted)] bg-[var(--surface-card)] dark:bg-[#22222e] rounded-lg border border-[var(--border-default)] dark:border-[#2a2a3a] px-3 py-4">
          无结果
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {list.map((r, i) => (
          <div key={i} className="p-3 bg-[var(--surface-card)] dark:bg-[#22222e] rounded-lg border border-[var(--border-default)] dark:border-[#2a2a3a]">
            <div className="text-[11px] text-[var(--text-muted)] mb-1">
              {r.source || r.entityType || r.relationType || "检索结果"}
              {r.chunkIndex !== undefined ? ` · 块 ${r.chunkIndex}` : ""}
              {r.knowledgeBaseName ? ` · ${r.knowledgeBaseName}` : ""}
            </div>
            <div className="text-[13px] text-[var(--text-primary)] leading-relaxed">{r.content}</div>
            <div className="text-[11px] text-[var(--status-success)] mt-1 font-medium">相关度: {(r.score * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    );
  };

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
        {/* 左侧知识库列表（手动创建，非默认） */}
        <aside className="w-[280px] bg-[var(--surface-main)] border-r border-[var(--border-default)] dark:border-[#2a2a3a] flex flex-col shrink-0">
          <div className="p-4 border-b border-[var(--border-default)] dark:border-[#2a2a3a] flex items-center justify-between">
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">知识库</span>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="w-[30px] h-[30px] rounded-md bg-[var(--brand-accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              title="创建知识库"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <ScrollArea className="flex-1 px-2 py-2">
            {knowledgeBases.length === 0 ? (
              <div className="p-4 text-center text-[13px] text-[var(--text-muted)]">
                暂无知识库，点击 + 创建
              </div>
            ) : (
              knowledgeBases.map((kb) => (
                <div
                  key={kb.knowledgeBaseId}
                  onClick={() => setActiveKb(kb)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 transition-colors group ${
                    activeKbId === kb.knowledgeBaseId
                      ? "bg-red-50 dark:bg-[#e63946]/10 border border-red-200 dark:border-[#e63946]/20"
                      : "hover:bg-[var(--surface-card)] dark:hover:bg-[#22222e]"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg"
                    style={{ background: kb.color || "#fef3c7" }}
                  >
                    {kb.icon || "📁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{kb.name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {kb.documentCount ?? 0} 篇文档
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteKnowledgeBase(kb.knowledgeBaseId, kb.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="删除知识库"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </ScrollArea>
        </aside>

        {/* 右侧主区域 */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeKb ? (
            <>
              {/* 知识库标题 + 上传按钮 */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-[22px] font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <span className="text-[28px]">{activeKb.icon || "📁"}</span>
                    {activeKb.name}
                  </h1>
                  <div className="flex gap-5 mt-3 text-[13px] text-[var(--text-secondary)]">
                    <span><strong className="text-[var(--text-primary)]">{activeKb.documentCount ?? 0}</strong> 篇文档</span>
                    {graphStats && (
                      <span><strong className="text-[var(--text-primary)]">{graphStats.entityCount}</strong> 个实体</span>
                    )}
                    {activeKb.description && (
                      <span className="text-[var(--text-muted)]">{activeKb.description}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <label>
                    <Button
                      className="h-9 gap-2 text-[13px] bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white shadow-none"
                      asChild
                      disabled={isUploading}
                    >
                      <span>
                        <Upload className="w-4 h-4" />
                        {isUploading ? "上传中..." : "上传文件"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                      accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              {/* Tab 导航 */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="documents" className="gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    文档管理
                  </TabsTrigger>
                  <TabsTrigger value="graph" className="gap-1.5 text-xs">
                    <Network className="w-3.5 h-3.5" />
                    知识图谱
                  </TabsTrigger>
                  <TabsTrigger value="images" className="gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5" />
                    图片库
                  </TabsTrigger>
                  <TabsTrigger value="search" className="gap-1.5 text-xs">
                    <FlaskConical className="w-3.5 h-3.5" />
                    检索测试
                  </TabsTrigger>
                </TabsList>

                {/* 文档管理 */}
                <TabsContent value="documents">
                  {/* 上传区域 */}
                  <label className="block border-2 border-dashed border-[var(--border-default)] dark:border-[#2a2a3a] rounded-2xl p-8 text-center mb-5 hover:border-[var(--brand-accent)] hover:bg-red-50/50 dark:hover:bg-[#e63946]/5 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                      accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
                      disabled={isUploading}
                    />
                    <div className="w-12 h-12 bg-[var(--surface-card)] dark:bg-[#22222e] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-[var(--brand-accent)]" />
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">
                      {isUploading ? "上传中..." : "拖拽文件到此处上传"}
                    </div>
                    <div className="text-[12px] text-[var(--text-secondary)]">
                      文件将上传到「{activeKb.name}」· 支持 PDF、DOCX、TXT、MD、CSV、XLSX
                    </div>
                  </label>

                  {/* 文档列表 */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">已上传文档</h3>
                    <span className="text-[12px] text-[var(--text-muted)]">共 {documents.length} 篇</span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.documentId}
                        className="bg-[var(--surface-main)] dark:bg-[#1a1a24] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                              doc.fileName?.endsWith(".pdf")
                                ? "bg-red-50 dark:bg-red-900/20"
                                : doc.fileName?.endsWith(".docx")
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : doc.fileName?.endsWith(".md")
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-yellow-50 dark:bg-yellow-900/20"
                            }`}
                          >
                            {doc.fileName?.endsWith(".pdf")
                              ? "📕"
                              : doc.fileName?.endsWith(".docx")
                              ? "📘"
                              : doc.fileName?.endsWith(".md")
                              ? "📗"
                              : "📙"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{doc.fileName || "文档"}</div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "未知大小"}
                              {doc.knowledgeBaseName && (
                                <span className="ml-2 px-1.5 py-0.5 bg-[var(--surface-card)] dark:bg-[#22222e] rounded text-[10px]">
                                  {doc.knowledgeBaseName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-medium flex items-center gap-1 ${
                              doc.processingStatus === "success"
                                ? "text-[var(--status-success)]"
                                : doc.processingStatus === "processing"
                                ? "text-[var(--status-warning)]"
                                : "text-[var(--status-error)]"
                            }`}
                          >
                            <span
                              className={`w-[6px] h-[6px] rounded-full ${
                                doc.processingStatus === "success"
                                  ? "bg-[var(--status-success)]"
                                  : doc.processingStatus === "processing"
                                  ? "bg-[var(--status-warning)]"
                                  : "bg-[var(--status-error)]"
                              }`}
                            />
                            {doc.processingStatus === "success" ? "已向量化" : doc.processingStatus === "processing" ? "处理中" : "失败"}
                          </span>
                          <div className="flex gap-1">
                            <button className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-card)] dark:hover:bg-[#22222e] hover:text-[var(--text-primary)] transition-colors">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.documentId)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-[var(--status-error)] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <div className="col-span-full py-12 text-center text-[14px] text-[var(--text-muted)]">
                        暂无文档，请上传文件到「{activeKb.name}」
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 知识图谱 */}
                <TabsContent value="graph">
                  <div className="flex h-[600px] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl overflow-hidden">
                    <div className="flex-1 p-3">
                      <GraphViewer onNodeClick={(node) => setSelectedNode(node)} />
                    </div>
                    {selectedNode && (
                      <div className="w-[280px] shrink-0">
                        <EntityDetailPanel
                          node={selectedNode}
                          onClose={() => setSelectedNode(null)}
                          onNavigateEntity={(entityId) => setSelectedNode({ id: entityId, label: "", type: "" })}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 图片库 */}
                <TabsContent value="images">
                  <div className="space-y-4">
                    <div className="max-w-sm">
                      <ImageUpload userId={userId} onUploadComplete={() => loadImages()} />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">已上传图片</h3>
                      <span className="text-[12px] text-[var(--text-muted)]">共 {images.length} 张</span>
                    </div>
                    <ImageList images={images} />
                  </div>
                </TabsContent>

                {/* 检索测试 */}
                <TabsContent value="search">
                  <div className="space-y-5">
                    {/* 传统检索 */}
                    <div className="bg-[var(--surface-main)] dark:bg-[#1a1a24] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl p-5">
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                        <Search className="w-[18px] h-[18px] text-[var(--brand-accent)]" />
                        多路检索测试
                      </h3>
                      <div className="flex gap-2 mb-4">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="输入查询内容，测试检索效果..."
                          className="flex-1 h-[42px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-[10px]"
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button
                          onClick={handleSearch}
                          className="h-[42px] px-5 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-[10px] shadow-none"
                        >
                          检索
                        </Button>
                      </div>
                      {searchResults && (
                        <Tabs defaultValue="hybrid" className="w-full">
                          <TabsList className="grid w-full grid-cols-4 mb-3">
                            <TabsTrigger value="hybrid" className="text-xs">混合</TabsTrigger>
                            <TabsTrigger value="vector" className="text-xs">向量</TabsTrigger>
                            <TabsTrigger value="bm25" className="text-xs">BM25</TabsTrigger>
                            <TabsTrigger value="graph" className="text-xs">图谱</TabsTrigger>
                          </TabsList>
                          <TabsContent value="hybrid">{renderSearchResultList(searchResults.hybridResults)}</TabsContent>
                          <TabsContent value="vector">{renderSearchResultList(searchResults.vectorResults)}</TabsContent>
                          <TabsContent value="bm25">{renderSearchResultList(searchResults.bm25Results)}</TabsContent>
                          <TabsContent value="graph">{renderSearchResultList(searchResults.graphResults)}</TabsContent>
                        </Tabs>
                      )}
                    </div>

                    {/* 跨模态搜索 */}
                    <div className="bg-[var(--surface-main)] dark:bg-[#1a1a24] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl p-5">
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                        <ImageIcon className="w-[18px] h-[18px] text-[var(--brand-accent)]" />
                        跨模态搜索
                      </h3>
                      <CrossModalSearch />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            /* 未选中知识库时的空状态 */
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
              <BookOpen className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-[15px] mb-2">请在左侧选择或创建一个知识库</p>
              <p className="text-[13px] opacity-60">知识库支持手动创建，上传的文件将归属到选中的知识库</p>
            </div>
          )}
        </main>
      </div>

      {/* 创建知识库对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>创建知识库</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="kb-name">名称 *</Label>
              <Input
                id="kb-name"
                value={newKbName}
                onChange={(e) => setNewKbName(e.target.value)}
                placeholder="输入知识库名称"
                maxLength={50}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kb-desc">描述</Label>
              <Textarea
                id="kb-desc"
                value={newKbDesc}
                onChange={(e) => setNewKbDesc(e.target.value)}
                placeholder="输入知识库描述（可选）"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>图标</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewKbIcon(icon)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-colors ${
                        newKbIcon === icon
                          ? "border-[var(--brand-accent)] bg-red-50 dark:bg-red-900/20"
                          : "border-[var(--border-default)] hover:border-[var(--brand-accent)]"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>颜色</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewKbColor(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-colors ${
                        newKbColor === color ? "border-[var(--brand-accent)]" : "border-transparent"
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreateKnowledgeBase}
              disabled={!newKbName.trim() || isCreating}
              className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white"
            >
              {isCreating ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
