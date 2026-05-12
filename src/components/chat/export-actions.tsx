/**
 * 导出操作组件
 *
 * 提供 Markdown、PDF、Word 导出和源码复制功能
 */

"use client";

import { Copy, Download, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { marked } from "marked";

interface ExportActionsProps {
  content: string;
  messageId: string;
}

export function ExportActions({ content, messageId }: ExportActionsProps) {
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message-${messageId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    // TODO: 实现 PDF 导出（需要 jspdf）
    // 暂时使用 alert 提示
    alert("PDF 导出功能将在后续版本中实现");
  };

  const downloadWord = async () => {
    // TODO: 实现 Word 导出（需要 docx）
    // 暂时使用 alert 提示
    alert("Word 导出功能将在后续版本中实现");
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
      <Button variant="ghost" size="sm" onClick={copyToClipboard} title="复制源码">
        <Copy className="h-3 w-3 mr-1" />
        复制
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Download className="h-3 w-3 mr-1" />
            导出
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadMarkdown}>
            <FileText className="h-4 w-4 mr-2" />
            下载 Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadPDF}>
            <File className="h-4 w-4 mr-2" />
            下载 PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadWord}>
            <File className="h-4 w-4 mr-2" />
            下载 Word
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
