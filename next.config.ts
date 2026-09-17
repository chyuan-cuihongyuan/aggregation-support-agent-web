import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8091";

const nextConfig: NextConfig = {
  output: "standalone", // 独立 Node SSR 部署所需
  // SELFLOOP2 loop-226：安全与质量基线
  poweredByHeader: false,
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  // GHLOOP loop-1006：public 字体加一年 immutable 缓存（字体更新必须换文件名）
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

// AUTOLOOP al-20 / 工单 1020：产物体积分析开关（借鉴 vercel/next.js 插件，
// ANALYZE=true 时启用，默认构建零开销）；npm run analyze
export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
