/**
 * 深度研究 API 封装（工单 0347-0355 AR 簇，AR9 契约断言面）
 *
 * 端点清单显式导出（BASELINE_PATHS），供契约断言（0355 AR9）与后端基线比对；
 * 请求复用 lib/api.ts 的 requestJson（经 Next.js 代理到聚合后端）。
 * 后端基线：ResearchController（research.enabled 默认关）。
 */

import { requestJson } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

/** 研究任务（与后端 research_task 同构） */
export interface ResearchTask {
  taskId: string;
  topic: string;
  perspectives?: string;
  status: string;
  tokenCost?: number;
  durationMs?: number;
}

/** 研究报告（与后端 research_report 同构） */
export interface ResearchReport {
  taskId: string;
  topic: string;
  markdown: string;
  citationsJson?: string;
  metadataJson?: string;
  citationRate: number;
  partial: boolean;
}

/** 后端端点基线（ResearchController 七期 AR 簇） */
export const BASELINE_PATHS: readonly string[] = [
  "POST /api/v1/research/tasks",
  "GET /api/v1/research/tasks",
  "GET /api/v1/research/tasks/{taskId}",
  "GET /api/v1/research/tasks/{taskId}/report",
  "POST /api/v1/research/tasks/{taskId}/export",
];

/** 创建研究任务 */
export async function createResearchTask(
  topic: string,
  perspectives = "technical,business,risk",
): Promise<ApiResponse<string>> {
  return requestJson<ApiResponse<string>>(
    `/api/v1/research/tasks?topic=${encodeURIComponent(topic)}&perspectives=${encodeURIComponent(perspectives)}`,
    { method: "POST" },
  );
}

/** 任务列表 */
export async function listResearchTasks(): Promise<ApiResponse<string[]>> {
  return requestJson<ApiResponse<string>>("/api/v1/research/tasks") as Promise<
    ApiResponse<string[]>
  >;
}

/** 任务详情 */
export async function getResearchTask(
  taskId: string,
): Promise<ApiResponse<Record<string, unknown>>> {
  return requestJson<ApiResponse<Record<string, unknown>>>(
    `/api/v1/research/tasks/${encodeURIComponent(taskId)}`,
  );
}

/** 任务报告 */
export async function getResearchReport(
  taskId: string,
): Promise<ApiResponse<ResearchReport>> {
  return requestJson<ApiResponse<ResearchReport>>(
    `/api/v1/research/tasks/${encodeURIComponent(taskId)}/report`,
  );
}

/** 报告导出（Markdown + 元数据 JSON 两件套） */
export async function exportResearchReport(
  taskId: string,
): Promise<ApiResponse<string[]>> {
  return requestJson<ApiResponse<string[]>>(
    `/api/v1/research/tasks/${encodeURIComponent(taskId)}/export`,
    { method: "POST" },
  );
}
