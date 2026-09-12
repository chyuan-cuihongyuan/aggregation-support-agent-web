/**
 * useChat Hook 单元测试
 *
 * 覆盖消息发送、SSE 流式响应、会话管理、停止生成、错误处理等核心场景
 */

import { renderHook, act } from "@testing-library/react";
import { useChat } from "@/hooks/use-chat";

// ========== Mock 设置 ==========

// Mock requestSSE
const mockRequestSSE = jest.fn();
jest.mock("@/lib/api", () => ({
  requestSSE: (...args: unknown[]) => mockRequestSSE(...args),
}));

// Mock session-utils
const mockHistoryItemsToMessages = jest.fn();
jest.mock("@/utils/session-utils", () => ({
  historyItemsToMessages: (...args: unknown[]) => mockHistoryItemsToMessages(...args),
}));

// Mock requestAnimationFrame / cancelAnimationFrame
const mockRafCallbacks: Array<FrameRequestCallback> = [];
let rafIdCounter = 0;

global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  const id = ++rafIdCounter;
  mockRafCallbacks.push(cb);
  return id;
});

global.cancelAnimationFrame = jest.fn();

// 辅助函数：执行所有待处理的 RAF 回调
function flushRAF() {
  while (mockRafCallbacks.length > 0) {
    const cb = mockRafCallbacks.shift()!;
    cb(performance.now());
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRafCallbacks.length = 0;
  rafIdCounter = 0;
  // 默认 requestSSE 成功完成
  mockRequestSSE.mockResolvedValue(undefined);
});

// 默认 hook 参数
const defaultOptions = {
  userId: "user-1",
  agentId: "agent-1",
  sessionId: "session-1",
};

// ==================== 测试用例 ====================

describe("useChat Hook", () => {
  // ==================== 初始状态 ====================
  describe("初始状态", () => {
    it("应该初始化为空消息列表和非流式状态", () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isStreaming).toBe(false);
    });

    it("应该暴露所有必要的方法", () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(typeof result.current.sendMessage).toBe("function");
      expect(typeof result.current.stopGeneration).toBe("function");
      expect(typeof result.current.clearMessages).toBe("function");
      expect(typeof result.current.loadConversation).toBe("function");
      expect(typeof result.current.sendAiOps).toBe("function");
    });
  });

  // ==================== sendMessage ====================
  describe("sendMessage", () => {
    it("应该在 sessionId 不存在时显示错误消息", async () => {
      const { result } = renderHook(() =>
        useChat({ ...defaultOptions, sessionId: null })
      );

      await act(async () => {
        await result.current.sendMessage("你好");
      });

      // 应该只有一条 assistant 的错误消息
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe("assistant");
      expect(result.current.messages[0].content).toContain("会话未就绪");
      // requestSSE 不应被调用
      expect(mockRequestSSE).not.toHaveBeenCalled();
    });

    it("应该在消息为空字符串时不发送", async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await act(async () => {
        await result.current.sendMessage("   ");
      });

      expect(result.current.messages).toHaveLength(0);
      expect(mockRequestSSE).not.toHaveBeenCalled();
    });

    it("应该添加用户消息和 AI 占位消息后发起 SSE 请求", async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      await act(async () => {
        await result.current.sendMessage("你好");
      });

      // 应该有两条消息：用户 + AI
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("你好");
      expect(result.current.messages[1].role).toBe("assistant");

      // 验证 requestSSE 被正确调用
      expect(mockRequestSSE).toHaveBeenCalledWith(
        "/api/v1/chat_stream",
        expect.objectContaining({
          agentId: "agent-1",
          userId: "user-1",
          sessionId: "session-1",
          message: "你好",
        }),
        expect.objectContaining({
          onChunk: expect.any(Function),
          onSession: expect.any(Function),
        }),
        expect.any(AbortSignal)
      );
    });

    it("应该在 SSE 流完成后更新 AI 消息内容", async () => {
      // 模拟 SSE 接收到数据后通过 onChunk 回调传递
      mockRequestSSE.mockImplementationOnce(
        async (_path: string, _body: unknown, options: { onChunk: (text: string) => void }) => {
          options.onChunk("你好");
          options.onChunk("世界");
        }
      );

      const { result } = renderHook(() => useChat(defaultOptions));

      await act(async () => {
        await result.current.sendMessage("你好");
        // 刷新所有 RAF 回调，确保打字动画完成
        flushRAF();
      });

      // AI 消息应该包含完整的流式内容
      const aiMessage = result.current.messages.find((m) => m.role === "assistant");
      expect(aiMessage).toBeDefined();
      expect(aiMessage!.content).toContain("你好");
      expect(aiMessage!.isStreaming).toBeFalsy();
    });

    it("应该在发送消息时调用 setHasUnsavedChanges", async () => {
      const setHasUnsavedChanges = jest.fn();
      const { result } = renderHook(() =>
        useChat({ ...defaultOptions, setHasUnsavedChanges })
      );

      await act(async () => {
        await result.current.sendMessage("测试");
      });

      expect(setHasUnsavedChanges).toHaveBeenCalledWith(true);
    });

    it("应该在 SSE 请求失败时显示错误消息", async () => {
      mockRequestSSE.mockRejectedValueOnce(new Error("网络连接超时"));

      const { result } = renderHook(() => useChat(defaultOptions));

      await act(async () => {
        await result.current.sendMessage("你好");
      });

      const aiMessage = result.current.messages.find((m) => m.role === "assistant");
      expect(aiMessage!.content).toContain("错误");
      expect(aiMessage!.content).toContain("网络连接超时");
      expect(result.current.isStreaming).toBe(false);
    });

    it("应该在消息完成后调用 onMessageComplete 回调", async () => {
      const onMessageComplete = jest.fn();
      mockRequestSSE.mockImplementationOnce(
        async (_path: string, _body: unknown, options: { onChunk: (text: string) => void }) => {
          options.onChunk("测试回答");
        }
      );

      const { result } = renderHook(() =>
        useChat({ ...defaultOptions, onMessageComplete })
      );

      await act(async () => {
        await result.current.sendMessage("你好");
        flushRAF();
      });

      expect(onMessageComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "assistant",
          content: expect.any(String),
        }),
        "session-1",
        "你好"
      );
    });

    it("应该采纳后端确认的真实 sessionId", async () => {
      const onSessionId = jest.fn();
      const onMessageComplete = jest.fn();
      mockRequestSSE.mockImplementationOnce(
        async (_path: string, _body: unknown, options: { onChunk: (text: string) => void; onSession: (session: unknown) => void }) => {
          options.onSession({ sessionId: "real-session-1" });
          options.onChunk("测试回答");
        }
      );

      const { result } = renderHook(() =>
        useChat({
          ...defaultOptions,
          sessionId: "temp_123",
          onSessionId,
          onMessageComplete,
        })
      );

      await act(async () => {
        await result.current.sendMessage("你好");
        flushRAF();
      });

      expect(onSessionId).toHaveBeenCalledWith("real-session-1");
      expect(onMessageComplete).toHaveBeenCalledWith(
        expect.objectContaining({ role: "assistant" }),
        "real-session-1",
        "你好"
      );
    });
  });

  // ==================== stopGeneration ====================
  describe("stopGeneration", () => {
    it("应该在流式输出中停止生成", async () => {
      // 创建一个不会自动完成的 SSE 请求
      mockRequestSSE.mockImplementationOnce(
        () => new Promise<void>(() => {})
      );

      const { result } = renderHook(() => useChat(defaultOptions));

      // 启动发送（但不等待完成）
      act(() => {
        result.current.sendMessage("你好");
      });

      // 此时应该处于流式状态
      expect(result.current.isStreaming).toBe(true);

      // 停止生成
      act(() => {
        result.current.stopGeneration();
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it("应该在非流式状态时调用 stopGeneration 无副作用", () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      expect(result.current.isStreaming).toBe(false);

      act(() => {
        result.current.stopGeneration();
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  // ==================== clearMessages ====================
  describe("clearMessages", () => {
    it("应该清空所有消息", async () => {
      const { result } = renderHook(() => useChat(defaultOptions));

      // 先发送一条消息
      await act(async () => {
        await result.current.sendMessage("你好");
      });

      expect(result.current.messages.length).toBeGreaterThan(0);

      // 清空消息
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });
  });

  // ==================== loadConversation ====================
  describe("loadConversation", () => {
    it("应该加载历史对话到消息列表", () => {
      const mockMessages = [
        { id: "q-0", role: "user" as const, content: "问题1" },
        { id: "a-0", role: "assistant" as const, content: "回答1" },
        { id: "q-1", role: "user" as const, content: "问题2" },
        { id: "a-1", role: "assistant" as const, content: "回答2" },
      ];
      mockHistoryItemsToMessages.mockReturnValueOnce(mockMessages);

      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.loadConversation([
          { question: "问题1", answer: "回答1" },
          { question: "问题2", answer: "回答2" },
        ]);
      });

      expect(mockHistoryItemsToMessages).toHaveBeenCalledWith([
        { question: "问题1", answer: "回答1" },
        { question: "问题2", answer: "回答2" },
      ]);
      expect(result.current.messages).toEqual(mockMessages);
    });

    it("应该在加载空历史时清空消息列表", () => {
      mockHistoryItemsToMessages.mockReturnValueOnce([]);

      const { result } = renderHook(() => useChat(defaultOptions));

      act(() => {
        result.current.loadConversation([]);
      });

      expect(result.current.messages).toEqual([]);
    });
  });

  // ==================== sendAiOps ====================
  describe("sendAiOps", () => {
    it("应该发送 AIOps 分析请求", async () => {
      mockRequestSSE.mockImplementationOnce(
        async (_path: string, _body: unknown, onChunk: (text: string) => void) => {
          onChunk("告警分析结果");
        }
      );

      const { result } = renderHook(() => useChat(defaultOptions));

      let returnVal: unknown;
      await act(async () => {
        returnVal = await result.current.sendAiOps("200002");
        flushRAF();
      });

      expect(mockRequestSSE).toHaveBeenCalledWith(
        "/api/v1/ai_ops",
        expect.objectContaining({
          agentId: "200002",
          userId: "user-1",
          alertDescription: expect.any(String),
        }),
        expect.any(Function),
        expect.any(AbortSignal)
      );

      // 应该返回问题和回答
      expect(returnVal).toEqual(
        expect.objectContaining({
          question: expect.any(String),
          answer: expect.any(String),
        })
      );
    });

    it("应该在 agentId 为空时使用默认 agentId", async () => {
      const { result } = renderHook(() =>
        useChat({ ...defaultOptions, agentId: "300001" })
      );

      await act(async () => {
        await result.current.sendAiOps("");
      });

      expect(mockRequestSSE).toHaveBeenCalledWith(
        "/api/v1/ai_ops",
        expect.objectContaining({
          agentId: "300001",
        }),
        expect.any(Function),
        expect.any(AbortSignal)
      );
    });

    it("应该在 AIOps 请求失败时返回 null 并显示错误", async () => {
      mockRequestSSE.mockRejectedValueOnce(new Error("AIOps 服务不可用"));

      const { result } = renderHook(() => useChat(defaultOptions));

      let returnVal: unknown;
      await act(async () => {
        returnVal = await result.current.sendAiOps("200002");
      });

      expect(returnVal).toBeNull();

      const aiMessage = result.current.messages.find((m) => m.role === "assistant");
      expect(aiMessage!.content).toContain("错误");
    });
  });

  // ==================== 流式状态管理 ====================
  describe("流式状态管理", () => {
    it("应该在发送消息期间将 isStreaming 设为 true", async () => {
      let resolveSSE: () => void = () => {};
      mockRequestSSE.mockImplementationOnce(
        () => new Promise<void>((resolve) => { resolveSSE = resolve; })
      );

      const { result } = renderHook(() => useChat(defaultOptions));

      // 发送消息但不等待完成
      let sendPromise: Promise<void>;
      await act(async () => {
        sendPromise = result.current.sendMessage("测试");
      });

      // 此时 isStreaming 应为 true
      expect(result.current.isStreaming).toBe(true);

      // 完成 SSE
      await act(async () => {
        resolveSSE();
        await sendPromise;
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });
});

// ==================== 卸载中断（SELFLOOP2 loop-221） ====================

describe("卸载中断", () => {
  it("组件卸载时应中断在途流请求（signal.aborted=true）", async () => {
    let capturedSignal: AbortSignal | undefined;
    mockRequestSSE.mockImplementation(
      (_path: string, _body: unknown, _handlers: unknown, signal?: AbortSignal) => {
        capturedSignal = signal;
        return new Promise<void>(() => {
          /* 挂死流 */
        });
      }
    );

    const { result, unmount } = renderHook(() => useChat(defaultOptions));

    await act(async () => {
      // 不 await：让流保持在途
      void result.current.sendMessage("流式中...");
      await Promise.resolve();
    });

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal!.aborted).toBe(false);

    unmount();

    expect(capturedSignal!.aborted).toBe(true);
  });
});
