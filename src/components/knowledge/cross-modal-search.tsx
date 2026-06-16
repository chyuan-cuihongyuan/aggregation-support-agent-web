/**
 * 跨模态搜索组件
 *
 * 支持以文搜图和以图搜文两种模式
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Upload, FileText, ImageIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@chyuan/ui-kit";
import { Input } from "@chyuan/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@chyuan/ui-kit";
import { ScrollArea } from "@chyuan/ui-kit";
import { requestJson, uploadFile } from "@chyuan/ui-kit";
import { ImageGrid } from "@/components/knowledge/image-grid";
import type { CrossModalSearchResult } from "@/types/api";

export function CrossModalSearch() {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 以文搜图结果
  const [textToImageResults, setTextToImageResults] = useState<CrossModalSearchResult[]>([]);
  // 以图搜文结果
  const [imageToTextResults, setImageToTextResults] = useState<CrossModalSearchResult[]>([]);

  // 以文搜图
  const handleTextToImage = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const results = await requestJson<CrossModalSearchResult[]>("/api/v1/search/text-to-image", {
        method: "POST",
        body: JSON.stringify({ query, topK }),
      });
      setTextToImageResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setIsLoading(false);
    }
  }, [query, topK]);

  // 以图搜文
  const handleImageToText = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError("");
      try {
        const formData = new FormData();
        formData.append("image", file);

        const results = await uploadFile<CrossModalSearchResult[]>(
          "/api/v1/search/image-to-text",
          formData,
          () => {}
        );
        setImageToTextResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "搜索失败");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="text-to-image">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-to-image" className="text-xs">
            <ImageIcon className="w-3.5 h-3.5 mr-1" />
            以文搜图
          </TabsTrigger>
          <TabsTrigger value="image-to-text" className="text-xs">
            <FileText className="w-3.5 h-3.5 mr-1" />
            以图搜文
          </TabsTrigger>
        </TabsList>

        {/* 以文搜图 */}
        <TabsContent value="text-to-image" className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入文字描述搜索图片..."
              onKeyDown={(e) => e.key === "Enter" && handleTextToImage()}
              disabled={isLoading}
              className="h-8 text-xs"
            />
            <Button
              onClick={handleTextToImage}
              disabled={isLoading || !query.trim()}
              size="sm"
              className="h-8 px-3"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">返回数量:</span>
            <Input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-16 h-7 text-xs"
            />
          </div>
          <ImageGrid images={textToImageResults} />
        </TabsContent>

        {/* 以图搜文 */}
        <TabsContent value="image-to-text" className="mt-3 space-y-3">
          <ImageSearchInput onSearch={handleImageToText} disabled={isLoading} />
          <ScrollArea className="h-[240px]">
            <div className="space-y-2">
              {imageToTextResults.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">上传图片开始搜索</p>
              ) : (
                imageToTextResults.map((result) => (
                  <div key={result.itemId} className="p-2 rounded bg-muted/30 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {result.modalityType === "TEXT" ? "文本" : "图片"}
                      </span>
                      <span className="text-xs text-primary">
                        相似度: {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs line-clamp-3">{result.content}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
      )}
    </div>
  );
}

/** 以图搜文输入组件 */
function ImageSearchInput({
  onSearch,
  disabled,
}: {
  onSearch: (file: File) => void;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    onSearch(file);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        accept=".png,.jpg,.jpeg,.webp"
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full h-20 border-dashed"
      >
        {preview ? (
          <span className="relative block h-full w-full">
            <Image
              src={preview}
              alt="预览"
              fill
              sizes="100vw"
              unoptimized
              className="object-contain"
            />
          </span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">点击上传图片</span>
          </div>
        )}
      </Button>
    </div>
  );
}
