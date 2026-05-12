/**
 * 检索测试面板组件
 *
 * 提供向量检索、BM25 检索和混合检索功能
 */

"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SearchResultItem, SearchTestResult } from "@/types/api";

interface SearchPanelProps {
  onSearch: (query: string, topK: number) => Promise<SearchTestResult>;
}

// 结果列表组件
interface ResultListProps {
  items: SearchResultItem[];
  title: string;
}

function ResultList({ items, title }: ResultListProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">无结果</p>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-2 rounded bg-muted/30 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {item.source && `来源: ${item.source}`}
                    {item.chunkIndex !== undefined && ` · 块 ${item.chunkIndex}`}
                  </span>
                  <span className="text-xs text-primary">
                    相似度: {(item.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs line-clamp-3">{item.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export function SearchPanel({ onSearch }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState<SearchTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    try {
      const data = await onSearch(query, topK);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "检索失败");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜索输入 */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入检索内容..."
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          disabled={isLoading}
        />
        <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* TopK 选择 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">返回数量:</span>
        <Input
          type="number"
          min={1}
          max={20}
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
          className="w-20"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </p>
      )}

      {results && (
        <Tabs defaultValue="hybrid" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vector">向量检索</TabsTrigger>
            <TabsTrigger value="bm25">BM25</TabsTrigger>
            <TabsTrigger value="hybrid">混合</TabsTrigger>
          </TabsList>
          <TabsContent value="vector" className="mt-4">
            <ResultList items={results.vectorResults} title="向量检索结果" />
          </TabsContent>
          <TabsContent value="bm25" className="mt-4">
            <ResultList items={results.bm25Results} title="BM25 检索结果" />
          </TabsContent>
          <TabsContent value="hybrid" className="mt-4">
            <ResultList items={results.hybridResults} title="混合检索结果" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
