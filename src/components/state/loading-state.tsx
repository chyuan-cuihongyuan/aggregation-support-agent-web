/**
 * 加载状态组件
 *
 * 在数据加载期间展示居中的加载动画和提示文案
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  /** 标题文案 */
  title?: string;
  /** 描述文案 */
  description?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 加载状态组件
 *
 * 显示旋转加载图标和提示信息，适用于数据请求中等场景
 */
export function LoadingState({
  title = "加载中...",
  description,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
