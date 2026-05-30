/**
 * API 客户端单元测试
 *
 * 覆盖 requestJson、uploadFile、requestSSE、readSSEStream 和错误处理函数
 */

import {
  requestJson,
  uploadFile,
  requestSSE,
  readSSEStream,
  ApiError,
  isBackendUnavailable,
} from "@/lib/api";

// ========== Mock 设置 ==========

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockDispatchEvent = jest.fn();
Object.defineProperty(window, "dispatchEvent", {
  value: mockDispatchEvent,
  writable: true,
});

// Mock XMLHttpRequest
function createMockXHR() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const uploadListeners: Record<string, Array<(...args: unknown[]) => void>> = {};

  return {
    open: jest.fn(),
    send: jest.fn(),
    setRequestHeader: jest.fn(),
    withCredentials: false,
    status: 200,
    responseText: "",
    upload: {
      addEventListener: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!uploadListeners[event]) uploadListeners[event] = [];
        uploadListeners[event].push(handler);
      }),
    },
    addEventListener: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    // 辅助方法：模拟触发事件
    _fire(event: string, ...args: unknown[]) {
      (listeners[event] || []).forEach((fn) => fn(...args));
    },
    _fireUpload(event: string, ...args: unknown[]) {
      (uploadListeners[event] || []).forEach((fn) => fn(...args));
    },
  };
}

let mockXHRInstance: ReturnType<typeof createMockXHR>;

// 保存原始 XMLHttpRequest
const OriginalXHR = global.XMLHttpRequest;

beforeEach(() => {
  jest.clearAllMocks();
  mockXHRInstance = createMockXHR();
  global.XMLHttpRequest = jest.fn(() => mockXHRInstance) as unknown as typeof XMLHttpRequest;
});

afterEach(() => {
  global.XMLHttpRequest = OriginalXHR;
});

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
    json: jest.fn().mockResolvedValue(
      body || { code: "A0001", info: "请求失败", data: null }
    ),
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

// ==================== 测试用例 ====================

describe("API 客户端单元测试", () => {
  // ==================== isBackendUnavailable ====================
  describe("isBackendUnavailable", () => {
    it("应该识别包含 'Failed to fetch' 的错误消息", () => {
      expect(isBackendUnavailable("Failed to fetch")).toBe(true);
    });

    it("应该识别包含 'NetworkError' 的错误消息", () => {
      expect(isBackendUnavailable("NetworkError: something wrong")).toBe(true);
    });

    it("应该识别包含 'Load failed' 的错误消息", () => {
      expect(isBackendUnavailable("Load failed")).toBe(true);
    });

    it("应该识别包含 'CORS' 的错误消息", () => {
      expect(isBackendUnavailable("CORS policy error")).toBe(true);
    });

    it("应该在消息不包含任何关键词时返回 false", () => {
      expect(isBackendUnavailable("其他类型的错误")).toBe(false);
      expect(isBackendUnavailable("")).toBe(false);
    });
  });

  // ==================== ApiError 类 ====================
  describe("ApiError", () => {
    it("应该正确创建带完整参数的 ApiError", () => {
      const error = new ApiError("服务器错误", "A0001", true, 500);

      expect(error.message).toBe("服务器错误");
      expect(error.code).toBe("A0001");
      expect(error.isUnavailable).toBe(true);
      expect(error.httpStatus).toBe(500);
      expect(error.name).toBe("ApiError");
      expect(error).toBeInstanceOf(Error);
    });

    it("应该使用默认值创建 ApiError", () => {
      const error = new ApiError("未知错误");

      expect(error.code).toBeUndefined();
      expect(error.isUnavailable).toBe(false);
      expect(error.httpStatus).toBeUndefined();
    });
  });

  // ==================== requestJson ====================
  describe("requestJson", () => {
    it("应该发送 GET 请求并返回解析后的数据", async () => {
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

    it("应该发送 POST 请求并传递请求体", async () => {
      const mockData = { sessionId: "session-abc" };
      mockFetch.mockResolvedValueOnce(createSuccessResponse(mockData));

      const result = await requestJson("/api/v1/create_session", {
        method: "POST",
        body: JSON.stringify({ agentId: "agent-1", userId: "user-1" }),
      });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/create_session",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ agentId: "agent-1", userId: "user-1" }),
        })
      );
    });

    it("应该在 401 响应时触发全局认证失效事件", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: jest.fn(),
        body: null,
      } as unknown as Response);

      await expect(requestJson("/api/v1/user/info")).rejects.toThrow(
        "登录已过期，请重新登录"
      );
      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
    });

    it("应该在 HTTP 非 2xx 响应时抛出错误", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({ info: "服务器内部错误" }),
        body: null,
      } as unknown as Response);

      await expect(requestJson("/api/v1/test")).rejects.toThrow("服务器内部错误");
    });

    it("应该在 HTTP 非 2xx 且响应非 JSON 时使用默认错误信息", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: jest.fn().mockRejectedValue(new Error("not json")),
        body: null,
      } as unknown as Response);

      await expect(requestJson("/api/v1/test")).rejects.toThrow(
        "请求失败: HTTP 502"
      );
    });

    it("应该在业务错误码非 0000 时抛出对应错误", async () => {
      mockFetch.mockResolvedValueOnce(
        createErrorResponse(200, {
          code: "A0002",
          info: "参数不合法",
          data: null,
        })
      );

      await expect(requestJson("/api/v1/test")).rejects.toThrow("参数不合法");
    });

    it("应该在网络错误时标记 isUnavailable=true", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      try {
        await requestJson("/api/v1/test");
        fail("应该抛出错误");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isUnavailable).toBe(true);
      }
    });

    it("应该在普通异常时不标记 isUnavailable", async () => {
      mockFetch.mockRejectedValueOnce(new Error("超时"));

      try {
        await requestJson("/api/v1/test");
        fail("应该抛出错误");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isUnavailable).toBe(false);
      }
    });
  });

  // ==================== uploadFile ====================
  describe("uploadFile", () => {
    it("应该成功上传文件并返回数据", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "test.txt");

      // 模拟 XHR 成功
      mockXHRInstance.status = 200;
      mockXHRInstance.responseText = JSON.stringify({
        code: "0000",
        info: "success",
        data: { documentId: "doc-123" },
      });

      const promise = uploadFile<{ documentId: string }>(
        "/api/v1/document/upload",
        formData
      );

      // 触发 load 事件
      mockXHRInstance._fire("load");

      const result = await promise;
      expect(result).toEqual({ documentId: "doc-123" });
      expect(mockXHRInstance.open).toHaveBeenCalledWith(
        "POST",
        "/api/v1/document/upload"
      );
      expect(mockXHRInstance.withCredentials).toBe(true);
    });

    it("应该在上传时报告进度", async () => {
      const formData = new FormData();
      const onProgress = jest.fn();

      mockXHRInstance.status = 200;
      mockXHRInstance.responseText = JSON.stringify({
        code: "0000",
        info: "success",
        data: "ok",
      });

      const promise = uploadFile("/api/v1/upload", formData, onProgress);

      // 模拟进度事件
      mockXHRInstance._fireUpload("progress", {
        lengthComputable: true,
        loaded: 50,
        total: 100,
      });
      mockXHRInstance._fire("load");

      await promise;
      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it("应该在 401 响应时触发认证失效事件", async () => {
      const formData = new FormData();
      mockXHRInstance.status = 401;

      const promise = uploadFile("/api/v1/upload", formData);

      mockXHRInstance._fire("load");

      await expect(promise).rejects.toThrow("登录已过期，请重新登录");
      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
    });

    it("应该在业务错误码非 0000 时拒绝", async () => {
      const formData = new FormData();
      mockXHRInstance.status = 200;
      mockXHRInstance.responseText = JSON.stringify({
        code: "A0001",
        info: "文件格式不支持",
        data: null,
      });

      const promise = uploadFile("/api/v1/upload", formData);
      mockXHRInstance._fire("load");

      await expect(promise).rejects.toThrow("文件格式不支持");
    });

    it("应该在网络错误时标记 isUnavailable=true", async () => {
      const formData = new FormData();

      const promise = uploadFile("/api/v1/upload", formData);
      mockXHRInstance._fire("error");

      try {
        await promise;
        fail("应该抛出错误");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isUnavailable).toBe(true);
      }
    });
  });

  // ==================== requestSSE ====================
  describe("requestSSE", () => {
    it("应该正确发送 SSE 请求并处理数据流", async () => {
      const chunks = ["data: 你好\n\n", "data: 世界\n\n", "data: [DONE]\n\n"];
      mockFetch.mockResolvedValueOnce(createSSEResponse(chunks));

      const received: string[] = [];
      await requestSSE("/api/v1/chat", { message: "test" }, (text) => {
        received.push(text);
      });

      expect(received).toEqual(["你好", "世界"]);
    });

    it("应该正确传递 sources 命名事件", async () => {
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

    it("应该在 401 响应时触发认证失效事件", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: jest.fn(),
        body: null,
      } as unknown as Response);

      await expect(
        requestSSE("/api/v1/chat", { message: "test" }, jest.fn())
      ).rejects.toThrow("登录已过期，请重新登录");
    });

    it("应该在 HTTP 非 2xx 响应时抛出错误", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: jest.fn(),
        body: null,
      } as unknown as Response);

      await expect(
        requestSSE("/api/v1/chat", { message: "test" }, jest.fn())
      ).rejects.toThrow("HTTP 500");
    });

    it("应该在请求被取消时静默处理 AbortError", async () => {
      mockFetch.mockRejectedValueOnce(
        new DOMException("The operation was aborted", "AbortError")
      );

      await expect(
        requestSSE("/api/v1/chat", { message: "test" }, jest.fn())
      ).resolves.toBeUndefined();
    });

    it("应该在网络错误时抛出后端不可用错误", async () => {
      mockFetch.mockRejectedValueOnce(new Error("NetworkError"));

      await expect(
        requestSSE("/api/v1/chat", { message: "test" }, jest.fn())
      ).rejects.toThrow(ApiError);

      try {
        await requestSSE("/api/v1/chat", { message: "test" }, jest.fn());
      } catch (error) {
        expect((error as ApiError).isUnavailable).toBe(true);
      }
    });
  });

  // ==================== readSSEStream ====================
  describe("readSSEStream", () => {
    it("应该解析 SSE 命名事件并正确分发", async () => {
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

      await expect(readSSEStream(response, jest.fn())).rejects.toThrow(
        "响应体为空"
      );
    });

    it("应该处理 JSON 格式的非 SSE 响应降级", async () => {
      const jsonData = { data: { answer: "这是回答" } };
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(JSON.stringify(jsonData)));
          controller.close();
        },
      });

      const response = { body: readable } as unknown as Response;

      const received: string[] = [];
      await readSSEStream(response, (text) => received.push(text));

      expect(received).toEqual(["这是回答"]);
    });

    it("应该忽略 SSE 数据中的 [DONE] 标记", async () => {
      const chunks = ["data: 消息1\n\n", "data: [DONE]\n\n"];
      mockFetch.mockResolvedValueOnce(createSSEResponse(chunks));

      const received: string[] = [];
      await requestSSE("/api/v1/chat", {}, (text) => received.push(text));

      expect(received).toEqual(["消息1"]);
    });

    it("应该处理多个连续的 SSE 事件", async () => {
      const chunks = [
        "data: 第一条\n\n",
        "data: 第二条\n\n",
        "data: 第三条\n\n",
      ];
      mockFetch.mockResolvedValueOnce(createSSEResponse(chunks));

      const received: string[] = [];
      await requestSSE("/api/v1/chat", {}, (text) => received.push(text));

      expect(received).toEqual(["第一条", "第二条", "第三条"]);
    });
  });
});
