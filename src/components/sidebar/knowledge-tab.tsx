/**
 * 知识库标签页组件
 *
 * 整合文件上传、文档列表和检索测试功能
 */

/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/knowledge/file-upload";
import { DocumentList } from "@/components/knowledge/document-list";
import { SearchPanel } from "@/components/knowledge/search-panel";
import { uploadFile, requestJson } from "@/lib/api";
import type { DocumentDTO, SearchTestResult } from "@/types/api";

export function KnowledgeTab() {
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [activeTab, setActiveTab] = useState("upload");

  const loadDocuments = useCallback(async () => {
    try {
      const data = await requestJson<DocumentDTO[]>(
        "/api/v1/documents"
      );
      setDocuments(data ?? []);
    } catch (error) {
      console.error("加载文档列表失败:", error);
      setDocuments([]);
    }
  }, []);

  // 初始加载文档列表
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (
    file: File,
    onProgress: (progress: number) => void
  ) => {
    try {
      const formData = new FormData();
      // 直接发送原始文件（支持 PDF/Word/HTML 等二进制格式）
      formData.append("file", file);

      await uploadFile("/api/v1/upload", formData, onProgress);
      // 上传成功后刷新文档列表
      await loadDocuments();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "文件上传失败");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await requestJson<void>(
        `/api/v1/documents/${documentId}`,
        { method: "DELETE" }
      );
      // 删除成功后重新加载文档列表
      await loadDocuments();
    } catch (error) {
      console.error("删除文档失败:", error);
    }
  };

  const handleSearch = async (query: string, topK: number) => {
    try {
      return await requestJson<SearchTestResult>("/api/v1/documents/search", {
        method: "POST",
        body: JSON.stringify({ query, topK }),
      });
    } catch (error) {
      console.error("检索失败:", error);
      return {
        query,
        vectorResults: [],
        bm25Results: [],
        hybridResults: [],
      };
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upload">上传</TabsTrigger>
        <TabsTrigger value="documents">文档</TabsTrigger>
        <TabsTrigger value="search">检索</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>支持上传 TXT、Markdown、PDF、DOCX、HTML 格式的文档。</p>
            <p>上传后自动分块、向量化并存储到知识库。</p>
          </div>
          <FileUpload onUpload={handleUpload} />
        </div>
      </TabsContent>

      <TabsContent value="documents" className="flex-1 overflow-auto">
        <div className="p-4">
          <DocumentList
            documents={documents}
            onDelete={handleDeleteDocument}
          />
        </div>
      </TabsContent>

      <TabsContent value="search" className="flex-1 overflow-auto">
        <div className="p-4">
          <SearchPanel onSearch={handleSearch} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
