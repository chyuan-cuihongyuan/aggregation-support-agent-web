import type {NextConfig} from "next";

// 后端 API 地址：
// - Docker 部署：构建镜像时通过 build arg BACKEND_URL 注入（默认指向 compose 服务名）
// - 本地开发：在 .env.local 中配置 NEXT_PUBLIC_API_BASE，或设置 BACKEND_URL=http://localhost:8091
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8091";

const nextConfig: NextConfig = {
  output: 'standalone', // 独立 Node SSR 部署所需
  // 前端用相对路径 /api/* 调用后端，通过 rewrites 在服务端代理到后端地址（避免跨域，支持 SSE 流式）
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
