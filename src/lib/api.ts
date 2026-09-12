/**
 * API 客户端
 *
 * 封装后端 API 调用，支持 JSON 请求、文件上传和 SSE 流式读取
 */

import type { ZodType } from "zod";

import type { ApiResponse } from "@/types/api";

/** 后端 API 基础地址（通过 Next.js rewrites 代理） */
const API_BASE = "";

/** 成功响应码 */
const SUCCESS_CODE = "0000";

// ========== 错误处理 ==========

/**
 * 检查错误消息是否表示后端不可用
 * @param message - 错误消息
 * @returns 是否为后端不可用错误
 */
export function isBackendUnavailable(message: string): boolean {
  const keywords = ["Failed to fetch", "NetworkError", "Load failed", "CORS"];
  return keywords.some((keyword) => message.includes(keyword));
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  /** HTTP 状态码 */
  public httpStatus?: number;

  constructor(
    message: string,
    public code?: string,
    public isUnavailable: boolean = false,
    httpStatus?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
  }
}

/**
 * AUTOLOOP al-07 / 工单 1007：响应边界校验（借鉴 colinhacks/zod，模式承 obs-web al-04）。
 * safeParse 失败抛 ApiError(code=ESCHEMA) 并带字段路径摘要。导出以供单测锁定行为。
 */
export function parseWithSchema<T>(data: unknown, schema: ZodType<T>): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const summary = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new ApiError(`响应结构校验失败: ${summary}`, "ESCHEMA");
  }
  return result.data;
}

/** 请求选项：透传 fetch init，另可携带响应校验 schema（输出类型由调用方 T 收口） */
type RequestOptions = RequestInit & { schema?: ZodType };

// ========== JSON 请求 ==========

/**
 * 发送 JSON 请求
 * @param path - API 路径（不含基础地址）
 * @param options - fetch 选项（可携带 schema 做响应边界校验）
 * @returns 响应数据
 * @throws {ApiError} 请求失败或响应码非 "0000"
 */
export async function requestJson<T>(
  path: string,
  options?: RequestOptions
): Promise<T> {
  const { schema, ...init } = options ?? {};
  const url = `${API_BASE}${path}`;
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...init, credentials: 'include' });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        // 通知 AuthProvider 认证失效，由其统一处理跳转
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      throw new ApiError('登录已过期，请重新登录', 'A0004', false, 401);
    }

    // 非 2xx 响应，尝试解析错误信息
    if (!response.ok) {
      let errorMessage = `请求失败: HTTP ${response.status}`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.info || errorMessage;
      } catch {
        // 非 JSON 响应
      }
      throw new ApiError(errorMessage, undefined, false, response.status);
    }

    const result: ApiResponse<T> = await response.json();

    if (result.code === SUCCESS_CODE) {
      const data = result.data;
      return schema ? (parseWithSchema(data, schema) as T) : data;
    }

    const errorInfo = result.info || "请求失败";
    throw new ApiError(errorInfo, result.code, false, response.status);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "未知错误";
    throw new ApiError(`请求失败: ${message}`, undefined, isBackendUnavailable(message));
  }
}

// ========== 文件上传 ==========

/**
 * 上传文件（带进度回调）
 * @param path - API 路径
 * @param formData - 表单数据
 * @param onProgress - 进度回调 (0-100)
 * @returns 响应数据
 * @throws {ApiError} 上传失败
 */
export function uploadFile<T>(
  path: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const xhr = new XMLHttpRequest();

    // 监听上传进度
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    // 监听请求完成
    xhr.addEventListener("load", () => {
      if (xhr.status === 401) {
        // 401 认证失效，触发全局事件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        reject(new ApiError('登录已过期，请重新登录', 'A0004', false, 401));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result: ApiResponse<T> = JSON.parse(xhr.responseText);
          if (result.code === SUCCESS_CODE) {
            resolve(result.data);
          } else {
            reject(new ApiError(result.info || "上传失败", result.code, false, xhr.status));
          }
        } catch {
          // 非 JSON 响应兜底：尝试从纯文本中提取有用信息
          const responseText = xhr.responseText?.trim();
          if (responseText) {
            reject(new ApiError(`上传失败: ${responseText}`, undefined, false, xhr.status));
          } else {
            reject(new ApiError("解析响应失败", undefined, false, xhr.status));
          }
        }
      } else {
        // 非 2xx 响应，尝试解析错误信息
        let errorMessage = `上传失败: HTTP ${xhr.status}`;
        try {
          const errorResult = JSON.parse(xhr.responseText);
          errorMessage = errorResult.info || errorResult.message || errorMessage;
        } catch {
          // 非 JSON 响应，使用默认错误信息
          const responseText = xhr.responseText?.trim();
          if (responseText) {
            errorMessage = `上传失败: ${responseText}`;
          }
        }
        reject(new ApiError(errorMessage, undefined, false, xhr.status));
      }
    });

    // 监听请求错误
    xhr.addEventListener("error", () => {
      reject(new ApiError("网络错误", undefined, true));
    });

    // 发送请求
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

// ========== SSE 流式读取 ==========

/**
 * SSE 流读取选项
 */
interface ReadSSEOptions {
  /** 接收数据块回调 */
  onChunk: (text: string) => void;
  /** 接收会话元信息回调（可选） */
  onSession?: (session: unknown) => void;
  /** 接收 RAG 来源证据回调（可选） */
  onSources?: (sources: unknown) => void;
}

/**
 * 读取 SSE 流，兼容非 SSE 格式（JSON / 纯文本）响应
 *
 * - SSE 格式：逐行解析 `data:` 行，到达即回调，确保实时渲染
 * - 命名事件：支持 `event: sources` 等命名事件
 * - JSON 格式：提取 data / answer / content 字段后整块回调
 * - 纯文本：整块回调
 */
export async function readSSEStream(
  response: Response,
  onChunkOrOptions: ((text: string) => void) | ReadSSEOptions
): Promise<void> {
  // 兼容旧的回调方式和新的选项方式
  const options: ReadSSEOptions = typeof onChunkOrOptions === 'function'
    ? { onChunk: onChunkOrOptions }
    : onChunkOrOptions;

  if (!response.body) {
    throw new ApiError("响应体为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasSSEData = false;
  let currentEventType = "message"; // 默认事件类型

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      // 按 SSE 事件边界（空行 \n\n）分割处理
      let eventEndIdx: number;
      while ((eventEndIdx = buffer.indexOf("\n\n")) !== -1) {
        const eventBlock = buffer.slice(0, eventEndIdx);
        buffer = buffer.slice(eventEndIdx + 2);

        // 提取事件类型和数据行
        const dataLines: string[] = [];
        for (const line of eventBlock.split("\n")) {
          if (line.startsWith("event:")) {
            // 解析命名事件类型
            currentEventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const data = line.slice(5).replace(/^\s/, "");
            if (data.trim() !== "[DONE]") {
              dataLines.push(data);
            }
          }
        }

        if (dataLines.length > 0) {
          const combinedData = dataLines.join("\n");

          // 根据事件类型分发：命名事件仅在有对应处理器时才触发，否则静默忽略
          if (currentEventType === "session") {
            if (options.onSession) {
              try {
                const sessionData = JSON.parse(combinedData);
                options.onSession(sessionData);
              } catch {
                options.onSession(combinedData);
              }
            }
            // 无 onSession 回调时静默忽略，不混入消息内容
          } else if (currentEventType === "sources") {
            if (options.onSources) {
              try {
                options.onSources(JSON.parse(combinedData));
              } catch {
                options.onSources(combinedData);
              }
            }
          } else {
            // 普通消息事件
            hasSSEData = true;
            options.onChunk(combinedData);
          }

          // 重置事件类型
          currentEventType = "message";
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer.trim()) {
      const remaining = buffer.replace(/\r$/, "");
      if (remaining.startsWith("data:") || remaining.startsWith("event:")) {
        // 单行 data/event（无结尾空行）
        const dataLines: string[] = [];
        let lastEventType = "message";
        for (const line of remaining.split("\n")) {
          if (line.startsWith("event:")) {
            lastEventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const data = line.slice(5).replace(/^\s/, "");
            if (data && data.trim() !== "[DONE]") {
              dataLines.push(data);
            }
          }
        }
        if (dataLines.length > 0) {
          const combinedData = dataLines.join("\n");
          if (lastEventType === "session") {
            if (options.onSession) {
              try {
                const sessionData = JSON.parse(combinedData);
                options.onSession(sessionData);
              } catch {
                options.onSession(combinedData);
              }
            }
          } else if (lastEventType === "sources") {
            if (options.onSources) {
              try {
                options.onSources(JSON.parse(combinedData));
              } catch {
                options.onSources(combinedData);
              }
            }
          } else {
            hasSSEData = true;
            options.onChunk(combinedData);
          }
        }
      } else if (!hasSSEData) {
        // 非 SSE 降级：尝试解析 JSON 或纯文本
        try {
          const json = JSON.parse(buffer);
          const content =
            json.data?.answer ?? json.data?.content ?? json.data?.message ??
            json.data ?? json.answer ?? json.content ?? json.message ?? "";
          if (content) {
            options.onChunk(typeof content === "string" ? content : JSON.stringify(content));
          }
        } catch {
          options.onChunk(buffer.trim());
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 发起 SSE 请求
 * @param path - API 路径
 * @param body - 请求体
 * @param onChunk - 接收数据块回调
 * @param signal - AbortSignal 用于取消请求
 * @returns Promise，流结束时 resolve
 */
export async function requestSSE(
  path: string,
  body: unknown,
  onChunkOrOptions: ((text: string) => void) | ReadSSEOptions,
  signal?: AbortSignal
): Promise<void> {
  const url = `${API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(body),
      signal,
    });

    if (response.status === 401) {
      // 401 认证失效，触发全局事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      throw new ApiError('登录已过期，请重新登录', 'A0004', false, 401);
    }

    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, undefined, false, response.status);
    }

    await readSSEStream(response, onChunkOrOptions);
  } catch (error) {
    // 如果是用户主动取消，不抛出错误
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }

    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "未知错误";
    throw new ApiError(`SSE 请求失败: ${message}`, undefined, isBackendUnavailable(message));
  }
}
