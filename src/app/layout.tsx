import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";

// 强制所有路由动态渲染：避免 build 时静态预渲染缓存 307 重定向
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "集成对话、知识库、AIOps 的 AI 智能体平台",
  // SELFLOOP2 loop-226：元数据完整化（对外平台口径：允许索引）
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "AI 智能体聚合平台",
    template: "%s | AI 智能体聚合平台",
  },
  keywords: ["AI", "智能体", "知识库", "AIOps", "Agent"],
  openGraph: {
    title: "AI 智能体聚合平台",
    description: "集成对话、知识库、AIOps 的 AI 智能体平台",
    type: "website",
    locale: "zh_CN",
    siteName: "AI 智能体聚合平台",
  },
  twitter: {
    card: "summary",
    title: "AI 智能体聚合平台",
    description: "集成对话、知识库、AIOps 的 AI 智能体平台",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          {/* AUTOLOOP al-39 / 工单 1039：TanStack Query Provider（第二批） */}
          <QueryProvider>
            <AuthProvider>
              {children}
              <footer className="fixed bottom-2 right-3 text-[11px] text-muted-foreground/70 z-50 pointer-events-auto">
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  京ICP备2026041953号-1
                </a>
              </footer>
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
