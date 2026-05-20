/**
 * 图片网格组件
 *
 * 展示搜索到的图片结果
 */

"use client";

import { ImageIcon } from "lucide-react";
import type { ImageDTO, CrossModalSearchResult } from "@/types/api";

interface ImageGridProps {
  images: CrossModalSearchResult[];
  onImageClick?: (image: CrossModalSearchResult) => void;
}

export function ImageGrid({ images, onImageClick }: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="text-center space-y-1">
          <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm">暂无图片结果</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {images.map((image) => (
        <button
          key={image.itemId}
          onClick={() => onImageClick?.(image)}
          className="relative group rounded-lg overflow-hidden border bg-muted/20 aspect-square"
        >
          {image.imageUrl ? (
            <img
              src={image.imageUrl}
              alt={image.content || "搜索结果"}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {/* 分数覆盖层 */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white truncate">{image.content || "无描述"}</p>
            <p className="text-xs text-white/70">
              相似度: {(image.score * 100).toFixed(1)}%
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/** 图片列表组件（管理用） */
interface ImageListProps {
  images: ImageDTO[];
  onDelete?: (imageId: string) => void;
}

export function ImageList({ images }: ImageListProps) {
  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">暂无图片</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img) => (
        <div
          key={img.imageId}
          className="relative group rounded-lg overflow-hidden border bg-muted/20"
        >
          <img
            src={img.imageUrl}
            alt={img.fileName}
            className="w-full aspect-square object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
            <p className="text-xs text-white truncate">{img.fileName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
