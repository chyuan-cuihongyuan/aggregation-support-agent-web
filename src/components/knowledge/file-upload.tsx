/**
 * 文件上传组件
 *
 * 支持拖拽上传和点击选择文件
 */

"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onUpload: (file: File, onProgress: (progress: number) => void) => Promise<void>;
  disabled?: boolean;
}

export function FileUpload({ onUpload, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const uploadFile = useCallback(async (file: File) => {
    setError("");
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await onUpload(file, (progress) => {
        setUploadProgress(progress);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium">拖拽文件到此处</p>
            <p className="text-xs text-muted-foreground">或点击选择文件</p>
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
              id="file-upload"
              accept=".txt,.md,.pdf,.docx,.html"
            />
            <label
              htmlFor="file-upload"
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              支持格式：TXT, MD, PDF, DOCX, HTML
            </label>
          </div>
        </CardContent>
      </Card>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-center text-muted-foreground">
            上传中... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
}
