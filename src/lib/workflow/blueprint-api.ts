/**
 * 工作流蓝图 API 封装（工单 0268-0276 AI 簇）
 *
 * 端点清单显式导出（BASELINE_PATHS），供契约断言（0276 AI9）与后端基线比对；
 * 请求复用 lib/api.ts 的 requestJson（经 Next.js 代理到聚合后端）。
 */

import { requestJson } from "@/lib/api";
import type { GraphDiffResult } from "./types";

/** 蓝图模板（与后端 BlueprintTemplate 同构） */
export interface BlueprintTemplate {
  id?: number;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  graphJson: string;
  paramSchemaJson?: string;
  operator?: string;
}

/** 实例化结果 */
export interface InstantiateResult {
  graphJson: string;
  replacements: { nodeId: string; configKey: string; param: string; value: string }[];
  valid: boolean;
  errors: string[];
}

/** 后端端点基线（契约断言用：新增封装必须 ⊆ 此清单） */
export const BASELINE_PATHS: readonly string[] = [
  "GET /api/v1/workflow/blueprints",
  "GET /api/v1/workflow/blueprints/{id}",
  "POST /api/v1/workflow/blueprints",
  "PUT /api/v1/workflow/blueprints/{id}",
  "DELETE /api/v1/workflow/blueprints/{id}",
  "POST /api/v1/workflow/blueprints/{id}/instantiate",
  "POST /api/v1/workflow/blueprints/diff",
  "POST /api/v1/workflow/blueprints/canvas/convert",
  "POST /api/v1/workflow/validate",
  "POST /api/v1/workflow/register",
  "POST /api/v1/workflow/run",
  "POST /api/v1/workflow/resume",
  "GET /api/v1/workflow/runs/{runId}",
  "GET /api/v1/workflow/runs",
];

/** 蓝图清单（可按分类过滤） */
export async function listBlueprints(category?: string): Promise<BlueprintTemplate[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return requestJson<BlueprintTemplate[]>(`/api/v1/workflow/blueprints${query}`);
}

/** 蓝图详情 */
export async function getBlueprint(id: number): Promise<BlueprintTemplate> {
  return requestJson<BlueprintTemplate>(`/api/v1/workflow/blueprints/${id}`);
}

/** 保存蓝图 */
export async function saveBlueprint(template: BlueprintTemplate): Promise<BlueprintTemplate> {
  return requestJson<BlueprintTemplate>("/api/v1/workflow/blueprints", {
    method: "POST",
    body: JSON.stringify(template),
  });
}

/** 更新蓝图 */
export async function updateBlueprint(id: number, template: BlueprintTemplate): Promise<BlueprintTemplate> {
  return requestJson<BlueprintTemplate>(`/api/v1/workflow/blueprints/${id}`, {
    method: "PUT",
    body: JSON.stringify(template),
  });
}

/** 删除蓝图 */
export async function deleteBlueprint(id: number): Promise<{ deleted: number }> {
  return requestJson<{ deleted: number }>(`/api/v1/workflow/blueprints/${id}`, { method: "DELETE" });
}

/** 实例化蓝图（参数 → 图定义副本） */
export async function instantiateBlueprint(
  id: number,
  params: Record<string, string>
): Promise<InstantiateResult> {
  return requestJson<InstantiateResult>(`/api/v1/workflow/blueprints/${id}/instantiate`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** 图版本 diff */
export async function diffBlueprints(
  before: string,
  after: string
): Promise<GraphDiffResult> {
  return requestJson<GraphDiffResult>("/api/v1/workflow/blueprints/diff", {
    method: "POST",
    body: JSON.stringify({ before, after }),
  });
}

/** DSL 结构校验（GraphValidator 联动，AI7） */
export async function validateDsl(
  dsl: string
): Promise<{ valid: boolean; errors: string[]; nodeCount: number }> {
  return requestJson<{ valid: boolean; errors: string[]; nodeCount: number }>(
    "/api/v1/workflow/validate",
    { method: "POST", body: JSON.stringify({ dsl }) }
  );
}
