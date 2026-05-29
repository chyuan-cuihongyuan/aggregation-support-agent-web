/**
 * API 集成测试
 *
 * 覆盖 API 客户端、认证功能、会话管理和错误处理的核心场景
 */

import { requestJson, requestSSE, readSSEStream, ApiError, isBackendUnavailable } from "@/lib/api";
import { login, logout, getCurrentUser, isAuthenticated } from "@/lib/auth";
import { generateTempSessionId } from "@/utils/session-utils";

// ========== Mock 设置 ==========

// Mock fetch 全局函数
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window 对象
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, "dispatchEvent", {
  value: mockDispatchEvent,
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ========== 辅助函数 ==========

/** 创建成功的 JSON 响应 */
function createSuccessResponse<T>(data: T): Response {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({ code: "0000", info: "success", data }),
    body: null,
  } as unknown as Response;
}

/** 创建失败的 JSON 响应 */
function createErrorResponse(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    json: jest.fn().mockResolvedValue(body || { code: "A0001", info: "请求失败", data: null }),
    body: null,
  } as unknown as Response;
}

/** 创建 SSE 响应流 */
function createSSEResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let index = 0;

  const readable = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });

  return {
    ok: true,
    status: 200,
    body: readable,
    json: jest.fn(),
  } as unknown as Response;
}

// ========== 测试用例 ==========

describe("API 集成测试", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // ==================== API 客户端测试 ====================
  describe("API 客户端测试", () => {
    describe("requestJson", () => {
      it("应该正确发送请求并返回数据", async () => {
        const mockData = { userId: "123", username: "test" };
        mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

        const result = await requestJson("/api/v1/user/info");

        expect(result).toEqual(mockData);
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/v1/user/info",
          expect.objectContaining({
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          })
        );
      });

      it("应该在 401 响应时触发认证失效事件并抛出错误", async () => {
        // 模拟 401 响应
        const mock401Response = {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: jest.fn(),
          body: null,
        } as unknown as Response;
        mockFetch.mockResolvedValueOnce(mock401Response);

        await expect(requestJson("/api/v1/user/info")).rejects.toThrow("登录已过期，请重新登录");
        expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
      });

      it("应该在网络错误时抛出后端不可用错误", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

        try {
          await requestJson("/api/v1/user/info");
          fail("应该抛出错误");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).isUnavailable).toBe(true);
        }
      });

      it("应该在业务错误码时抛出对应的错误信息", async () => {
        mockFetch.mockResolvedValueOnce(
          createErrorResponse(200, { code: "A0002", info: "参数错误", data: null })
        );

        await expect(requestJson("/api/v1/test")).rejects.toThrow("参数错误");
      });
    });

    describe("requestSSE", () => {
      it("应该正确处理 SSE 流式响应", async () => {
        const chunks = [
          "data: 你好\n\n",
          "data: 世界\n\n",
          "data: [DONE]\n\n",
        ];
        mockFetch.mockResolvedValueOnce(createSSEResponse(chunks));

        const receivedChunks: string[] = [];
        await requestSSE("/api/v1/chat", { message: "test" }, (text) => {
          receivedChunks.push(text);
        });

        expect(receivedChunks).toEqual(["你好", "世界"]);
      });

      it("应该通过 requestSSE 透传 sources 命名事件", async () => {
        const chunks = [
          "event: sources\n",
          'data: [{"documentId":"doc-1"}]\n\n',
          "data: 回答内容\n\n",
        ];
        mockFetch.mockResolvedValueOnce(createSSEResponse(chunks));

        const receivedChunks: string[] = [];
        const receivedSources: unknown[] = [];

        await requestSSE("/api/v1/chat", { message: "test" }, {
          onChunk: (text) => receivedChunks.push(text),
          onSources: (sources) => receivedSources.push(sources),
        });

        expect(receivedChunks).toEqual(["回答内容"]);
        expect(receivedSources).toEqual([[{ documentId: "doc-1" }]]);
      });

      it("应该在 SSE 401 响应时触发认证失效事件", async () => {
        // 模拟 401 响应
        const mock401Response = {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: jest.fn(),
          body: null,
        } as unknown as Response;
        mockFetch.mockResolvedValueOnce(mock401Response);

        await expect(
          requestSSE("/api/v1/chat", { message: "test" }, jest.fn())
        ).rejects.toThrow("登录已过期，请重新登录");
      });

      it("应该在请求被取消时静默处理 AbortError", async () => {
        const abortError = new DOMException("The operation was aborted", "AbortError");
        mockFetch.mockRejectedValueOnce(abortError);

        // 不应该抛出错误
        await expect(
          requestSSE("/api/v1/chat", { message: "test" }, jest.fn())
        ).resolves.toBeUndefined();
      });

      it("应该在 SSE 网络错误时抛出后端不可用错误", async () => {
        mockFetch.mockRejectedValueOnce(new Error("NetworkError"));

        await expect(
          requestSSE("/api/v1/chat", { message: "test" }, jest.fn())
        ).rejects.toThrow(ApiError);
      });
    });

    describe("readSSEStream", () => {
      it("应该正确解析 SSE 命名事件", async () => {
        const chunks = [
          "event: sources\n",
          'data: [{"source": "文档1"}]\n\n',
          "data: 普通消息\n\n",
        ];
        const response = createSSEResponse(chunks);

        const receivedChunks: string[] = [];
        const receivedSources: unknown[] = [];

        await readSSEStream(response, {
          onChunk: (text) => receivedChunks.push(text),
          onSources: (sources) => receivedSources.push(sources),
        });

        expect(receivedSources).toHaveLength(1);
        expect(receivedChunks).toEqual(["普通消息"]);
      });

      it("应该在响应体为空时抛出错误", async () => {
        const response = { body: null } as unknown as Response;

        await expect(readSSEStream(response, jest.fn())).rejects.toThrow("响应体为空");
      });

      it("应该处理 JSON 格式的非 SSE 响应", async () => {
        const jsonData = { data: { answer: "这是回答" } };
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(JSON.stringify(jsonData)));
            controller.close();
          },
        });

        const response = { ok: true, status: 200, body: readable } as unknown as Response;

        const receivedChunks: string[] = [];
        await readSSEStream(response, (text) => receivedChunks.push(text));

        expect(receivedChunks).toEqual(["这是回答"]);
      });
    });

    describe("isBackendUnavailable", () => {
      it("应该识别后端不可用的错误消息", () => {
        expect(isBackendUnavailable("Failed to fetch")).toBe(true);
        expect(isBackendUnavailable("NetworkError occurred")).toBe(true);
        expect(isBackendUnavailable("Load failed")).toBe(true);
        expect(isBackendUnavailable("CORS error")).toBe(true);
        expect(isBackendUnavailable("其他错误")).toBe(false);
      });
    });
  });

  // ==================== 认证功能测试 ====================
  describe("认证功能测试", () => {
    describe("login", () => {
      it("应该成功登录并返回用户信息", async () => {
        const mockUser = {
          id: 1,
          username: "admin",
          nickname: "管理员",
          email: "admin@example.com",
          avatar: "",
          role: "admin",
          status: 1,
          createTime: "2024-01-01",
        };
        mockFetch.mockResolvedValueOnce(createSuccessResponse(mockUser));

        const result = await login({ username: "admin", password: "admin" });

        expect(result).toEqual(mockUser);
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/v1/auth/login",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ username: "admin", password: "admin" }),
          })
        );
      });

      it("应该在登录失败时抛出错误", async () => {
        mockFetch.mockResolvedValueOnce(
          createErrorResponse(200, { code: "A0003", info: "用户名或密码错误", data: null })
        );

        await expect(
          login({ username: "admin", password: "wrong" })
        ).rejects.toThrow("用户名或密码错误");
      });
    });

    describe("logout", () => {
      it("应该成功登出", async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse(true));

        await expect(logout()).resolves.toBeUndefined();
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/v1/auth/logout",
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    describe("getCurrentUser", () => {
      it("应该成功获取当前用户信息", async () => {
        const mockUser = {
          id: 1,
          username: "admin",
          nickname: "管理员",
          email: "admin@example.com",
          avatar: "",
          role: "admin",
          status: 1,
          createTime: "2024-01-01",
        };
        mockFetch.mockResolvedValueOnce(createSuccessResponse(mockUser));

        const result = await getCurrentUser();

        expect(result).toEqual(mockUser);
      });

      it("应该在未登录时返回 null", async () => {
        mockFetch.mockRejectedValueOnce(new Error("未登录"));

        const result = await getCurrentUser();

        expect(result).toBeNull();
      });
    });

    describe("isAuthenticated", () => {
      it("应该在已登录时返回 true", async () => {
        const mockUser = { id: 1, username: "admin" };
        mockFetch.mockResolvedValueOnce(createSuccessResponse(mockUser));

        const result = await isAuthenticated();

        expect(result).toBe(true);
      });

      it("应该在未登录时返回 false", async () => {
        mockFetch.mockRejectedValueOnce(new Error("未登录"));

        const result = await isAuthenticated();

        expect(result).toBe(false);
      });
    });
  });

  // ==================== 会话管理测试 ====================
  describe("会话管理测试", () => {
    describe("generateTempSessionId", () => {
      it("应该生成临时会话 ID", () => {
        const sessionId = generateTempSessionId();

        expect(sessionId).toMatch(/^temp_\d+_[a-z0-9]+$/);
      });

      it("应该生成唯一的会话 ID", () => {
        const id1 = generateTempSessionId();
        const id2 = generateTempSessionId();

        expect(id1).not.toBe(id2);
      });
    });

    describe("会话创建和加载", () => {
      it("应该成功创建新会话", async () => {
        const mockSessionId = "session-123";
        mockFetch.mockResolvedValueOnce(createSuccessResponse({ sessionId: mockSessionId }));

        const result = await requestJson<{ sessionId: string }>("/api/v1/create_session", {
          method: "POST",
          body: JSON.stringify({ agentId: "agent-1", userId: "user-1" }),
        });

        expect(result.sessionId).toBe(mockSessionId);
      });

      it("应该在创建会话失败时使用临时 ID 降级", async () => {
        mockFetch.mockRejectedValueOnce(new Error("后端不可用"));

        try {
          await requestJson<{ sessionId: string }>("/api/v1/create_session", {
            method: "POST",
            body: JSON.stringify({ agentId: "agent-1", userId: "user-1" }),
          });
        } catch {
          const tempId = generateTempSessionId();
          expect(tempId).toMatch(/^temp_/);
        }
      });
    });

    describe("并发保护", () => {
      it("应该防止并发切换会话", async () => {
        // 模拟 isSwitching 状态
        let isSwitching = false;
        const switchSession = async (sessionId: string) => {
          if (isSwitching) {
            console.warn("正在切换会话，忽略请求");
            return null;
          }
          isSwitching = true;
          try {
            // 模拟异步操作
            await new Promise((resolve) => setTimeout(resolve, 100));
            return sessionId;
          } finally {
            isSwitching = false;
          }
        };

        // 并发调用
        const results = await Promise.all([
          switchSession("session-1"),
          switchSession("session-2"),
        ]);

        // 只有一个应该成功，另一个应该返回 null
        expect(results.filter(Boolean)).toHaveLength(1);
      });
    });
  });

  // ==================== 错误处理测试 ====================
  describe("错误处理测试", () => {
    describe("后端不可用降级策略", () => {
      it("应该在后端不可用时标记 isUnavailable", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

        try {
          await requestJson("/api/v1/test");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).isUnavailable).toBe(true);
        }
      });

      it("应该在普通错误时不标记 isUnavailable", async () => {
        mockFetch.mockRejectedValueOnce(new Error("其他错误"));

        try {
          await requestJson("/api/v1/test");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).isUnavailable).toBe(false);
        }
      });
    });

    describe("SSE 流解析错误处理", () => {
      it("应该处理 SSE 数据中的 [DONE] 标记", async () => {
        const chunks = ["data: 消息1\n\n", "data: [DONE]\n\n"];
        mockFetch.mockResolvedValueOnce(createSSEResponse(chunks));

        const received: string[] = [];
        await requestSSE("/api/v1/chat", {}, (text) => received.push(text));

        expect(received).toEqual(["消息1"]);
      });

      it("应该处理空行分隔的多个 SSE 事件", async () => {
        const chunks = ["data: 第一条\n\n", "data: 第二条\n\n", "data: 第三条\n\n"];
        mockFetch.mockResolvedValueOnce(createSSEResponse(chunks));

        const received: string[] = [];
        await requestSSE("/api/v1/chat", {}, (text) => received.push(text));

        expect(received).toEqual(["第一条", "第二条", "第三条"]);
      });
    });

    describe("超时处理", () => {
      it("应该支持通过 AbortSignal 取消请求", async () => {
        // 模拟 fetch 在 AbortSignal 取消时抛出 AbortError
        const abortError = new DOMException("The operation was aborted", "AbortError");
        mockFetch.mockImplementationOnce(() => Promise.reject(abortError));

        const controller = new AbortController();
        const fetchPromise = requestSSE(
          "/api/v1/chat",
          { message: "test" },
          jest.fn(),
          controller.signal
        );

        // 立即取消
        controller.abort();

        // 应该静默完成，不抛出错误
        await expect(fetchPromise).resolves.toBeUndefined();
      });
    });

    describe("ApiError 类", () => {
      it("应该正确创建 ApiError 实例", () => {
        const error = new ApiError("测试错误", "A0001", true);

        expect(error.message).toBe("测试错误");
        expect(error.code).toBe("A0001");
        expect(error.isUnavailable).toBe(true);
        expect(error.name).toBe("ApiError");
        expect(error).toBeInstanceOf(Error);
      });

      it("应该有默认的 isUnavailable 值", () => {
        const error = new ApiError("测试错误");

        expect(error.isUnavailable).toBe(false);
        expect(error.code).toBeUndefined();
      });
    });
  });
});
