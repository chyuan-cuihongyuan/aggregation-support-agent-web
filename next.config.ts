import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8091";

const nextConfig: NextConfig = {
  output: 'standalone', // 独立 Node SSR 部署所需
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
