/**
 * 文档列表组件
 *
 * 显示已上传的文档列表，包含状态标识和删除操作
 */

"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { File, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentDTO } from "@/types/api";

interface DocumentListProps {
  documents: DocumentDTO[];
  onDelete: (documentId: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  const getStatusIcon = (status: DocumentDTO["processingStatus"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: DocumentDTO["processingStatus"]) => {
    switch (status) {
      case "success":
        return "成功";
      case "processing":
        return "处理中";
      case "failed":
        return "失败";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (documents.length === 0) {
    return <div className="text-center text-sm text-muted-foreground py-8">暂无文档</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.documentId}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>·</span>
                <span>
                  {formatDistanceToNow(new Date(doc.createTime), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {getStatusIcon(doc.processingStatus)}
                {getStatusText(doc.processingStatus)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                aria-label="删除文档"
                onClick={() => onDelete(doc.documentId)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
