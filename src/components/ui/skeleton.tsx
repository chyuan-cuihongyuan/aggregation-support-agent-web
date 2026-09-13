import { cn } from "@/lib/utils";

/**
 * 骨架占位组件（SELFLOOP2 loop-240，shadcn/ui Skeleton 模式，obs-web loop-213 同款）。
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
