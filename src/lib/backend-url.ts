/**
 * AUTOLOOP al-07 / 工单 1007：后端基址规范化（SSRF 加固）。
 *
 * 服务端代理（middleware / API routes）统一从这里取后端基址：
 * - 仅接受 http/https 协议
 * - 拒绝携带 userinfo 的 URL
 * - 只保留 origin，剥除任何 path/query 片段
 * env 来源不可控时宁可显式失败，不带病转发。
 */
export function resolveBackendBase(env: Record<string, string | undefined> = process.env): string {
  const raw = env.BACKEND_URL || env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8091";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`后端基址不是合法 URL: ${raw}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`后端基址协议非法（仅 http/https）: ${raw}`);
  }
  if (url.username || url.password) {
    throw new Error(`后端基址不允许携带 userinfo: ${raw}`);
  }
  return url.origin;
}
