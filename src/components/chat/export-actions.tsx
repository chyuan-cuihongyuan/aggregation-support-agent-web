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
    try {
      // 动态导入 jspdf
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas")
      ]);

      // 创建临时容器渲染 Markdown
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 700px;
        padding: 40px;
        background: #ffffff;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.6;
      `;
      container.innerHTML = `
        <style>
          h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.5em; font-weight: 600; }
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h3 { font-size: 18px; }
          p { margin: 0.5em 0; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
          pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
          pre code { background: none; padding: 0; }
          ul, ol { margin: 0.5em 0; padding-left: 2em; }
          li { margin: 0.25em 0; }
          blockquote { border-left: 4px solid #ddd; margin: 0.5em 0; padding-left: 1em; color: #666; }
          table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background: #f4f4f4; }
          a { color: #1976d2; }
        </style>
        ${marked.parse(content, { async: false }) as string}
      `;
      document.body.appendChild(container);

      // 转换为 canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // 创建 PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 左右各留 10mm 边距
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // 顶部 10mm 边距

      // 第一页
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position;

      // 多页处理
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 清理
      document.body.removeChild(container);

      // 下载
      pdf.save(`message-${messageId}.pdf`);
    } catch (error) {
      console.error("PDF 导出失败:", error);
      alert("PDF 导出失败，请重试");
    }
  };

  const downloadWord = async () => {
    try {
      // 动态导入 docx 和 file-saver
      const [
        { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType },
        { saveAs }
      ] = await Promise.all([
        import("docx"),
        import("file-saver")
      ]);

      // 解析 Markdown 为简单结构
      const htmlContent = marked.parse(content, { async: false }) as string;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [];

      // 提取所有文本节点和标题
      const elements = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, pre, blockquote, ul, ol");

      if (elements.length === 0) {
        // 如果没有结构化内容，添加为纯文本段落
        children.push(
          new Paragraph({
            children: [new TextRun({ text: content, size: 22 })],
            spacing: { after: 120 },
          })
        );
      } else {
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (!text) continue;

          const tag = el.tagName.toLowerCase();
          let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined;
          let isCode = false;
          let isQuote = false;

          switch (tag) {
            case "h1":
              heading = HeadingLevel.HEADING_1;
              break;
            case "h2":
              heading = HeadingLevel.HEADING_2;
              break;
            case "h3":
              heading = HeadingLevel.HEADING_3;
              break;
            case "h4":
              heading = HeadingLevel.HEADING_4;
              break;
            case "h5":
              heading = HeadingLevel.HEADING_5;
              break;
            case "h6":
              heading = HeadingLevel.HEADING_6;
              break;
            case "pre":
            case "code":
              isCode = true;
              break;
            case "blockquote":
              isQuote = true;
              break;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const paragraphOptions: any = {
            children: [
              new TextRun({
                text,
                size: 22,
                font: isCode ? "Courier New" : "Calibri",
                color: isCode ? "000080" : "000000",
              }),
            ],
            spacing: {
              before: heading ? 240 : isQuote ? 120 : 120,
              after: heading ? 120 : 120,
            },
          };

          if (heading) {
            paragraphOptions.heading = heading;
            paragraphOptions.children[0].bold = true;
          }

          if (isQuote) {
            paragraphOptions.alignment = AlignmentType.JUSTIFIED;
            paragraphOptions.indent = { left: 720 };
            paragraphOptions.shading = {
              fill: "F5F5F5",
              type: "CLEAR",
            };
          }

          if (isCode) {
            paragraphOptions.shading = {
              fill: "F8F8F8",
              type: "CLEAR",
            };
          }

          children.push(new Paragraph(paragraphOptions));
        }
      }

      // 创建文档
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: children.length > 0 ? children : [
              new Paragraph({
                children: [new TextRun({ text: content, size: 22 })],
              })
            ],
          },
        ],
      });

      // 生成并下载
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `message-${messageId}.docx`);
    } catch (error) {
      console.error("Word 导出失败:", error);
      alert("Word 导出失败，请重试");
    }
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
