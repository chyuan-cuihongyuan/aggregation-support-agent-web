/**
 * 图片上传组件
 *
 * 支持拖拽上传和点击选择图片文件
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { ImageIcon, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from "@/lib/api";

interface ImageUploadProps {
  onUploadComplete?: (imageId: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ onUploadComplete, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // 校验文件类型
      const validTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("仅支持 PNG、JPG、WebP 格式");
        return;
      }

      // 校验文件大小（最大 10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError("图片大小不能超过 10MB");
        return;
      }

      setError("");
      setIsUploading(true);
      setUploadProgress(0);

      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadFile<{ imageId: string }>(
          "/api/v1/images/upload",
          formData,
          (progress) => setUploadProgress(progress)
        );

        onUploadComplete?.(result.imageId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "上传失败");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onUploadComplete]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) await handleFile(file);
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="space-y-3">
      {preview ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-2">
            <div className="relative group">
              <img
                src={preview}
                alt="预览"
                className="w-full h-40 object-cover rounded-md"
              />
              {!isUploading && (
                <button
                  onClick={clearPreview}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-1.5">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs font-medium">拖拽图片到此处</p>
              <p className="text-xs text-muted-foreground">或点击选择</p>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
        accept=".png,.jpg,.jpeg,.webp"
      />

      {isUploading && (
        <div className="space-y-1.5">
          <Progress value={uploadProgress} />
          <p className="text-xs text-center text-muted-foreground">
            上传中... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
      )}
    </div>
  );
}
