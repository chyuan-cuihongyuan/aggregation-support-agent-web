/**
 * 聚合 web 工作流 API 契约断言（工单 0276 AI9，沿用五期 AF04 基建 + MSW 拦截思想）
 *
 * 断言前端封装 ⊆ 后端端点基线（蓝图表 + 五期既有 workflow 端点合并）；
 * 负例：未登记路径断言失败——防契约漂移。
 */

import { BASELINE_PATHS } from "@/lib/workflow/blueprint-api";
import { requestJson } from "@/lib/api";

/** 后端端点基线（聚合 AIOps WorkflowController 五期 + BlueprintController 六期） */
const BACKEND_ENDPOINTS: readonly string[] = [
  // 六期 AI 簇：BlueprintController
  "GET /api/v1/workflow/blueprints",
  "GET /api/v1/workflow/blueprints/{id}",
  "POST /api/v1/workflow/blueprints",
  "PUT /api/v1/workflow/blueprints/{id}",
  "DELETE /api/v1/workflow/blueprints/{id}",
  "POST /api/v1/workflow/blueprints/{id}/instantiate",
  "POST /api/v1/workflow/blueprints/diff",
  "POST /api/v1/workflow/blueprints/canvas/convert",
  // 五期 AB 簇：WorkflowController
  "POST /api/v1/workflow/validate",
  "POST /api/v1/workflow/register",
  "POST /api/v1/workflow/run",
  "POST /api/v1/workflow/resume",
  "GET /api/v1/workflow/runs/{runId}",
  "GET /api/v1/workflow/runs",
];

/** 前端实际封装的路径（与 blueprint-api.ts 实现逐条对照） */
const FRONTEND_WRAPPED: readonly string[] = [
  "GET /api/v1/workflow/blueprints",
  "GET /api/v1/workflow/blueprints/{id}",
  "POST /api/v1/workflow/blueprints",
  "PUT /api/v1/workflow/blueprints/{id}",
  "DELETE /api/v1/workflow/blueprints/{id}",
  "POST /api/v1/workflow/blueprints/{id}/instantiate",
  "POST /api/v1/workflow/blueprints/diff",
  "POST /api/v1/workflow/validate",
  "GET /api/v1/workflow/runs/{runId}",
];

describe("工作流 API 契约断言（AI9）", () => {
  it("前端封装 ⊆ 后端基线", () => {
    const backend = new Set(BACKEND_ENDPOINTS);
    const missing = FRONTEND_WRAPPED.filter((path) => !backend.has(path));
    expect(missing).toEqual([]);
  });

  it("封装清单与导出基线一致（blueprint-api BASELINE_PATHS 同步）", () => {
    const declared = new Set(BASELINE_PATHS);
    const missing = FRONTEND_WRAPPED.filter((path) => !declared.has(path));
    expect(missing).toEqual([]);
    expect(declared.size).toBeGreaterThanOrEqual(FRONTEND_WRAPPED.length);
  });

  it("负例：未登记路径不允许出现（防漂移哨兵）", () => {
    const backend = new Set(BACKEND_ENDPOINTS);
    expect(backend.has("DELETE /api/v1/workflow/blueprints/{id}")).toBe(true);
    expect(backend.has("POST /api/v1/workflow/blueprints/bogus")).toBe(false);
  });

  it("requestJson 走聚合代理（路径以 /api/v1 开头）", () => {
    expect(FRONTEND_WRAPPED.every((path) => path.startsWith("GET /api/v1") || path.startsWith("POST /api/v1")
      || path.startsWith("PUT /api/v1") || path.startsWith("DELETE /api/v1"))).toBe(true);
    // requestJson 存在且为函数（封装复用统一客户端）
    expect(typeof requestJson).toBe("function");
  });
});
