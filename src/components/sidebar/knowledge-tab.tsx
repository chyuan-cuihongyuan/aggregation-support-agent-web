/**
 * 知识库标签页组件
 *
 * 整合文件上传、文档列表和检索测试功能
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/knowledge/file-upload";
import { DocumentList } from "@/components/knowledge/document-list";
import { SearchPanel } from "@/components/knowledge/search-panel";
import { uploadFile } from "@/lib/api";
import type { DocumentDTO, SearchTestResult } from "@/types/api";

interface KnowledgeTabProps {
  userId: string;
}

export function KnowledgeTab({ userId }: KnowledgeTabProps) {
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [activeTab, setActiveTab] = useState("upload");

  const handleUpload = async (
    file: File,
    onProgress: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    await uploadFile("/api/v1/upload", formData, onProgress);
    // 上传成功后刷新文档列表
    await loadDocuments();
  };

  const loadDocuments = async () => {
    // TODO: 实现加载文档列表
    // const data = await requestJson<DocumentDTO[]>(`/api/v1/documents?userId=${userId}`);
    // setDocuments(data);
  };

  const handleDeleteDocument = async (documentId: string) => {
    // TODO: 实现删除文档
    // await requestJson(`/api/v1/documents/${documentId}`, { method: 'DELETE' });
    // await loadDocuments();
  };

  const handleSearch = async (query: string, topK: number) => {
    // TODO: 实现检索
    // return await requestJson<SearchTestResult>("/api/v1/documents/search", {
    //   method: "POST",
    //   body: JSON.stringify({ query, topK }),
    // });
    return {
      query,
      vectorResults: [],
      bm25Results: [],
      hybridResults: [],
    };
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
