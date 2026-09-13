import { Skeleton } from "@/components/ui/skeleton";

/**
 * 路由级加载骨架（SELFLOOP2 loop-240，Next.js App Router loading.tsx 官方模式）。
 * 聚合平台首屏形态：能力卡片×3 + 会话/知识面板骨架。
 */
export default function Loading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="加载中">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-52 w-full" />
      </div>
    </div>
  );
}
