/**
 * 空状态组件
 *
 * 在没有数据时展示友好的空状态提示
 */

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** 标题文案 */
  title?: string;
  /** 描述文案 */
  description?: string;
  /** 自定义类名 */
  className?: string;
  /** 图标下方的额外内容（如操作按钮） */
  children?: React.ReactNode;
}

/**
 * 空状态组件
 *
 * 展示收件箱图标和提示信息，适用于列表为空等场景
 */
export function EmptyState({
  title = "暂无数据",
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
    >
      <Inbox className="h-12 w-12 text-muted-foreground/50" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
