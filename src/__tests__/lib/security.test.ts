/**
 * lib/security 安全工具契约测试（工单 1142）：
 * CSRF token 获取/缓存/降级、请求头合并、token 校验；安全 Headers 与 CSP 基线；
 * 数据加密往返（环境支持 WebCrypto subtle 时）。
 */
import { CSRFProtection, DataEncryption, SecurityHeaders } from "@/lib/security";

describe("CSRFProtection", () => {
  const okResponse = (token: string) =>
    ({
      ok: true,
      json: async () => ({ token }),
    }) as unknown as Response;

  it("首次从服务端获取 token 并缓存，第二次不再请求", async () => {
    const fetchMock = jest.fn().mockResolvedValue(okResponse("server-token-1"));
    global.fetch = fetchMock as unknown as typeof fetch;
    const csrf = new CSRFProtection();

    await expect(csrf.getToken()).resolves.toBe("server-token-1");
    await expect(csrf.getToken()).resolves.toBe("server-token-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("服务端不可用时降级生成临时 token", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    const csrf = new CSRFProtection();

    const token = await csrf.getToken();

    expect(token).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it("addCSRFHeaders 在既有 headers 上追加 X-CSRF-Token", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse("t-abc")) as unknown as typeof fetch;
    const csrf = new CSRFProtection();

    const headers = (await csrf.addCSRFHeaders({ "X-App": "v1" })) as Record<string, string>;

    expect(headers["X-App"]).toBe("v1");
    expect(headers["X-CSRF-Token"]).toBe("t-abc");
  });

  it("validateToken 仅匹配当前 token；resetToken 后一律不匹配", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse("secret")) as unknown as typeof fetch;
    const csrf = new CSRFProtection();
    await csrf.getToken();

    expect(csrf.validateToken("secret")).toBe(true);
    expect(csrf.validateToken("other")).toBe(false);

    csrf.resetToken();
    expect(csrf.validateToken("secret")).toBe(false);
  });
});

describe("SecurityHeaders", () => {
  it("标准安全 headers 包含反嗅探/反框架/引用策略基线", () => {
    const headers = SecurityHeaders.getStandardHeaders() as Record<string, string>;

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Strict-Transport-Security"]).toContain("includeSubDomains");
  });

  it("CSP 包含 self 默认源与 frame-ancestors none", () => {
    const csp = SecurityHeaders.getCSPHeader();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self' https:");
  });
});

describe("DataEncryption（WebCrypto 可用时）", () => {
  const hasSubtle = typeof crypto !== "undefined" && !!crypto.subtle;
  const d = hasSubtle ? it : it.skip;

  d("加密后可用同口令解密还原", async () => {
    const enc = new DataEncryption();
    const cipher = await enc.encrypt("sensitive-payload", "pass-123");
    expect(cipher).not.toContain("sensitive-payload");
    await expect(enc.decrypt(cipher, "pass-123")).resolves.toBe("sensitive-payload");
  });

  d("错误口令解密抛出统一错误", async () => {
    const enc = new DataEncryption();
    const cipher = await enc.encrypt("sensitive-payload", "pass-123");
    await expect(enc.decrypt(cipher, "wrong-pass")).rejects.toThrow("Failed to decrypt data");
  });
});
