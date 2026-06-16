/**
 * 错误状态组件
 *
 * 在请求失败或发生错误时展示错误信息和可选的重试按钮
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@chyuan/ui-kit";
import { cn } from "@chyuan/ui-kit";

interface ErrorStateProps {
  /** 标题文案 */
  title?: string;
  /** 错误描述文案 */
  description?: string;
  /** 重试按钮回调，不传则不显示重试按钮 */
  onRetry?: () => void;
  /** 重试按钮文案 */
  retryText?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 错误状态组件
 *
 * 展示警告图标、错误信息和重试按钮，适用于请求失败等场景
 */
export function ErrorState({
  title = "加载失败",
  description = "请稍后重试",
  onRetry,
  retryText = "重新加载",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
    >
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          {retryText}
        </Button>
      )}
    </div>
  );
}
