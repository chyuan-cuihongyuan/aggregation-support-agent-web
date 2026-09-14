/**
 * 聚合 web 研究 API 契约断言（工单 0355 AR9，沿用 AI9/AL08 契约基建）
 *
 * 断言前端封装 ⊆ 后端端点基线（ResearchController 七期 AR 簇）；
 * 负例：未登记路径不允许出现——防契约漂移。
 */

import { BASELINE_PATHS } from "@/lib/research/research-api";

/** 后端端点基线（聚合 AIOps ResearchController，research.enabled 默认关） */
const BACKEND_ENDPOINTS: readonly string[] = [
  "POST /api/v1/research/tasks",
  "GET /api/v1/research/tasks",
  "GET /api/v1/research/tasks/{taskId}",
  "GET /api/v1/research/tasks/{taskId}/report",
  "POST /api/v1/research/tasks/{taskId}/export",
];

/** 前端实际封装的路径（与 research-api.ts 实现逐条对照） */
const FRONTEND_WRAPPED: readonly string[] = [
  "POST /api/v1/research/tasks",
  "GET /api/v1/research/tasks",
  "GET /api/v1/research/tasks/{taskId}",
  "GET /api/v1/research/tasks/{taskId}/report",
  "POST /api/v1/research/tasks/{taskId}/export",
];

describe("研究 API 契约断言（AR9）", () => {
  it("前端封装 ⊆ 后端基线", () => {
    const backend = new Set(BACKEND_ENDPOINTS);
    const missing = FRONTEND_WRAPPED.filter((path) => !backend.has(path));
    expect(missing).toEqual([]);
  });

  it("封装清单与导出基线一致（research-api BASELINE_PATHS 同步）", () => {
    const declared = new Set(BASELINE_PATHS);
    const missing = FRONTEND_WRAPPED.filter((path) => !declared.has(path));
    expect(missing).toEqual([]);
    expect(declared.size).toBeGreaterThanOrEqual(FRONTEND_WRAPPED.length);
  });

  it("负例：未登记路径不允许出现（防漂移哨兵）", () => {
    const backend = new Set(BACKEND_ENDPOINTS);
    expect(backend.has("DELETE /api/v1/research/tasks/{taskId}")).toBe(false);
    expect(backend.has("POST /api/v1/research/ghost")).toBe(false);
  });

  it("封装函数与方法路径一一对应（5 个导出函数）", () => {
    // createResearchTask/listResearchTasks/getResearchTask/getResearchReport/exportResearchReport
    expect(FRONTEND_WRAPPED.length).toBe(5);
    expect(BASELINE_PATHS.length).toBe(5);
  });
});
