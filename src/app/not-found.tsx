import Link from "next/link";

/**
 * 404 边界（SELFLOOP2 loop-248，Next.js App Router not-found.tsx 官方模式；
 * obs-web loop-239 同源平移）。
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <p className="font-mono text-5xl font-bold text-muted-foreground/40">404</p>
        <h2 className="mt-3 text-lg font-semibold">页面不存在</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          访问的页面不存在，可能已被移除或链接有误。
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
