/**
 * API 客户端
 *
 * 封装后端 API 调用，支持 JSON 请求、文件上传和 SSE 流式读取
 */

import type { ApiResponse } from "@/types/api";

/** 后端 API 基础地址 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8091";

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
  constructor(
    message: string,
    public code?: string,
    public isUnavailable: boolean = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ========== JSON 请求 ==========

/**
 * 发送 JSON 请求
 * @param path - API 路径（不含基础地址）
 * @param options - fetch 选项
 * @returns 响应数据
 * @throws {ApiError} 请求失败或响应码非 "0000"
 */
export async function requestJson<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options, credentials: 'include' });

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError('登录已过期，请重新登录', 'A0004');
    }

    const result: ApiResponse<T> = await response.json();

    if (result.code === SUCCESS_CODE) {
      return result.data;
    }

    throw new ApiError(result.info || "请求失败", result.code);
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
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result: ApiResponse<T> = JSON.parse(xhr.responseText);
          if (result.code === SUCCESS_CODE) {
            resolve(result.data);
          } else {
            reject(new ApiError(result.info || "上传失败", result.code));
          }
        } catch {
          reject(new ApiError("解析响应失败"));
        }
      } else {
        reject(new ApiError(`上传失败: HTTP ${xhr.status}`));
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
 * 读取 SSE 流
 * @param response - fetch 响应对象
 * @param onChunk - 接收数据块回调
 * @returns Promise，流结束时 resolve
 */
export async function readSSEStream(
  response: Response,
  onChunk: (text: string) => void
): Promise<void> {
  if (!response.body) {
    throw new ApiError("响应体为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 处理完整的 SSE 事件
      const events = buffer.split("\n\n");
      buffer = events.pop() || ""; // 保留不完整的事件

      for (const event of events) {
        const lines = event.split("\n");
        const dataLines = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5)); // 去掉 "data:" 前缀

        if (dataLines.length > 0) {
          onChunk(dataLines.join("\n"));
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      const dataLines = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5));
      if (dataLines.length > 0) {
        onChunk(dataLines.join("\n"));
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
 * @returns Promise，流结束时 resolve
 */
export async function requestSSE(
  path: string,
  body: unknown,
  onChunk: (text: string) => void
): Promise<void> {
  const url = `${API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}: ${response.statusText}`);
    }

    await readSSEStream(response, onChunk);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "未知错误";
    throw new ApiError(`SSE 请求失败: ${message}`, undefined, isBackendUnavailable(message));
  }
}
