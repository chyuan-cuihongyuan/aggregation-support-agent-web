import type {NextConfig} from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8091";

const nextConfig: NextConfig = {
  output: 'standalone', // 独立 Node SSR 部署所需

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

// AUTOLOOP al-20 / 工单 1020：产物体积分析开关（借鉴 vercel/next.js 插件，
// ANALYZE=true 时启用，默认构建零开销）；npm run analyze
export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
