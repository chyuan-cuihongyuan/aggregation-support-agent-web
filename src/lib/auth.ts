/**
 * Cookie 认证工具函数
 *
 * 处理用户登录状态的读取和设置
 */

/** Cookie 名称 */
const COOKIE_NAME = "ai_agent_login";

/** Cookie 载荷结构 */
interface CookiePayload {
  /** 用户名 */
  user: string;
  /** 时间戳 */
  ts: number;
}

/**
 * 从 document.cookie 读取登录状态
 * @returns Cookie 载荷，如果未登录或解析失败则返回 null
 */
export function getAuthCookie(): CookiePayload | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === COOKIE_NAME && value) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * 设置登录 Cookie
 * @param user - 用户名
 */
export function setAuthCookie(user: string): void {
  const payload: CookiePayload = { user, ts: Date.now() };
  const value = encodeURIComponent(JSON.stringify(payload));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; SameSite=Lax`;
}

/**
 * 清除登录 Cookie
 */
export function clearAuthCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; max-age=0`;
}

/**
 * 检查用户是否已登录
 * @returns 是否已登录
 */
export function isAuthenticated(): boolean {
  return getAuthCookie() !== null;
}
