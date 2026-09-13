/**
 * 工作流可视化 lib 单测（工单 0269-0275 AI2/AI3/AI4/AI5/AI7/AI8）
 */

import {
  canvasToDsl,
  canvasToGraph,
  dslToCanvas,
  graphToCanvas,
  roundTripStable,
} from "@/lib/workflow/canvas-mapper";
import { assignLayers, layoutGraph, edgePath, NODE_WIDTH, LAYER_GAP } from "@/lib/workflow/layered-layout";
import { diffGraphs } from "@/lib/workflow/graph-diff";
import { buildTimeline, failedNodes, MIN_WIDTH_RATIO } from "@/lib/workflow/run-timeline";
import { NODE_SCHEMA_REGISTRY, schemaOf, validateParams } from "@/lib/workflow/node-schema";
import { localPrecheck, normalizeRemoteErrors, validateWorkflow } from "@/lib/workflow/validate-client";
import type { GraphDefinition, WorkflowRun } from "@/lib/workflow/types";

const SAMPLE: GraphDefinition = {
  schemaVersion: 1,
  name: "demo",
  nodes: [
    { id: "a", type: "TASK", config: { echo: "hi" } },
    { id: "b", type: "TASK", config: {} },
    { id: "c", type: "INTERRUPT", config: { prompt: "确认?" } },
  ],
  edges: [
    { from: "a", to: "b" },
    { from: "b", to: "c" },
  ],
};

describe("画布双向转换（AI2）", () => {
  it("图定义转画布并往返一致", () => {
    const canvas = graphToCanvas(SAMPLE);
    expect(canvas.name).toBe("demo");
    expect(canvas.nodes).toHaveLength(3);
    expect(canvas.edges[0]).toEqual({ id: "a->b", source: "a", target: "b" });
    expect(roundTripStable(SAMPLE)).toBe(true);
    expect(JSON.parse(canvasToDsl(canvas))).toEqual(SAMPLE);
  });

  it("DSL 字符串与缺失 nodes 拒绝", () => {
    expect(dslToCanvas(JSON.stringify(SAMPLE)).nodes).toHaveLength(3);
    expect(() => dslToCanvas('{"schemaVersion":1,"name":"x"}')).toThrow("nodes");
  });

  it("canvasToGraph 缺省类型回退 TASK", () => {
    const back = canvasToGraph({ name: "n", nodes: [{ id: "z", type: "", params: {} }], edges: [] });
    expect(back.nodes[0].type).toBe("TASK");
  });

  it("位置元数据保留", () => {
    const canvas = graphToCanvas(SAMPLE, { a: { x: 10, y: 20 } });
    expect(canvas.nodes[0].position).toEqual({ x: 10, y: 20 });
  });
});

describe("SVG 分层自动布局（AI3）", () => {
  it("链式图分层与坐标", () => {
    const canvas = graphToCanvas(SAMPLE);
    const layers = assignLayers(canvas.nodes, canvas.edges);
    expect(layers).toHaveLength(3);
    const layout = layoutGraph(canvas.nodes, canvas.edges);
    expect(layout.positions.a.x).toBe(0);
    expect(layout.positions.b.x).toBe(NODE_WIDTH + LAYER_GAP);
    expect(layout.positions.c.y).toBe(0);
  });

  it("分叉图同层与孤立节点兜底", () => {
    const canvas = graphToCanvas({
      schemaVersion: 1,
      name: "fork",
      nodes: [
        { id: "root", type: "TASK", config: {} },
        { id: "l", type: "TASK", config: {} },
        { id: "r", type: "TASK", config: {} },
        { id: "lone", type: "TASK", config: {} },
      ],
      edges: [
        { from: "root", to: "l" },
        { from: "root", to: "r" },
      ],
    });
    const layers = assignLayers(canvas.nodes, canvas.edges);
    expect(layers[0]).toEqual(["root"]);
    expect(new Set(layers[1])).toEqual(new Set(["l", "r"]));
    expect(layers[layers.length - 1]).toContain("lone");
    const layout = layoutGraph(canvas.nodes, canvas.edges);
    expect(layout.positions.l.y).toBe(0);
    expect(layout.positions.r.y).toBeGreaterThan(0);
  });

  it("边折线坐标与未知端点返回 null", () => {
    const layout = layoutGraph(graphToCanvas(SAMPLE).nodes, graphToCanvas(SAMPLE).edges);
    const path = edgePath(layout.positions, { id: "a->b", source: "a", target: "b" });
    expect(path).not.toBeNull();
    expect(path?.x1).toBe(NODE_WIDTH);
    expect(edgePath(layout.positions, { id: "x", source: "nope", target: "b" })).toBeNull();
  });
});

describe("图版本 diff（AI8）", () => {
  it("四分类与边增删", () => {
    const after: GraphDefinition = {
      schemaVersion: 1,
      name: "demo",
      nodes: [
        { id: "a", type: "TASK", config: { echo: "changed" } },
        { id: "b", type: "TASK", config: {} },
        { id: "d", type: "TASK", config: {} },
      ],
      edges: [{ from: "a", to: "b" }],
    };
    const diff = diffGraphs(SAMPLE, after);
    expect(diff.added).toBe(1);
    expect(diff.removed).toBe(1);
    expect(diff.changed).toBe(1);
    expect(diff.unchanged).toBe(1);
    expect(diff.nodes.find((row) => row.id === "a")?.configBefore).toEqual({ echo: "hi -> changed" });
    expect(diff.edges.some((row) => row.from === "b" && row.change === "REMOVED")).toBe(true);
    expect(diff.added + diff.removed + diff.changed).toBeGreaterThan(0);
  });

  it("全同为空 diff", () => {
    const diff = diffGraphs(SAMPLE, SAMPLE);
    expect(diff.added + diff.removed + diff.changed).toBe(0);
    expect(diff.unchanged).toBe(3);
  });
});

describe("运行时间线（AI5）", () => {
  it("无偏移顺序铺开与零时长最小占比", () => {
    const run: WorkflowRun = {
      runId: "r1",
      workflowName: "demo",
      status: "FAILED",
      error: "boom",
      nodeRuns: [
        { nodeId: "a", status: "COMPLETED", durationMs: 300 },
        { nodeId: "b", status: "FAILED", durationMs: 100, error: "boom" },
        { nodeId: "c", status: "COMPLETED", durationMs: 0 },
      ],
    };
    const timeline = buildTimeline(run);
    expect(timeline).toHaveLength(3);
    expect(timeline[1].status).toBe("FAILED");
    expect(timeline[2].widthRatio).toBeCloseTo(MIN_WIDTH_RATIO);
    expect(timeline[2].startRatio).toBeLessThanOrEqual(1 - MIN_WIDTH_RATIO);
    expect(failedNodes(run)).toEqual(["b"]);
  });

  it("空节点清单与含偏移归一", () => {
    expect(buildTimeline({ runId: "r", workflowName: "w", status: "COMPLETED" })).toEqual([]);
    const withOffsets = buildTimeline({
      runId: "r2",
      workflowName: "w",
      status: "COMPLETED",
      nodeRuns: [
        { nodeId: "a", status: "COMPLETED", startOffsetMs: 0, durationMs: 500 } as never,
        { nodeId: "b", status: "COMPLETED", startOffsetMs: 500, durationMs: 500 } as never,
      ],
    });
    expect(withOffsets[1].startRatio).toBeCloseTo(0.5);
  });
});

describe("节点参数 schema（AI4）", () => {
  it("注册表覆盖内置类型与未知回退", () => {
    expect(NODE_SCHEMA_REGISTRY.length).toBeGreaterThanOrEqual(3);
    expect(schemaOf("TASK").fields.length).toBeGreaterThan(0);
    expect(schemaOf("UNKNOWN_TYPE").fields).toEqual([]);
  });

  it("必填/数字/枚举校验", () => {
    const errors = validateParams("HTTP", { url: "" });
    expect(errors.some((e) => e.field === "method")).toBe(true);
    expect(errors.some((e) => e.field === "url")).toBe(true);
    expect(validateParams("HTTP", { method: "GET", url: "http://x" })).toEqual([]);
    expect(validateParams("HTTP", { method: "PATCH", url: "http://x" }).some((e) => e.field === "method")).toBe(true);
    expect(validateParams("TASK", { retries: "abc" }).some((e) => e.field === "retries")).toBe(true);
    // TASK 的 echo 必填：缺失即报
    expect(validateParams("TASK", { retries: "3" }).some((e) => e.field === "echo")).toBe(true);
    expect(validateParams("TASK", { echo: "x", retries: "3" })).toEqual([]);
  });
});

describe("校验联动（AI7）", () => {
  it("本地预检拦截占位残留并跳过远程", async () => {
    let remoteCalled = 0;
    const errors = await validateWorkflow(
      {
        schemaVersion: 1,
        name: "x",
        nodes: [{ id: "a", type: "TASK", config: { echo: "${msg}" } }],
        edges: [],
      },
      async () => {
        remoteCalled++;
        return { valid: true, errors: [] };
      }
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].nodeId).toBe("a");
    expect(errors[0].source).toBe("local");
    expect(remoteCalled).toBe(0);
  });

  it("本地通过后走远程并归一错误", async () => {
    const errors = await validateWorkflow(SAMPLE, async () => ({
      valid: false,
      errors: ["节点 b: 缺少回显配置", { nodeId: "c", field: "prompt", message: "太短" }],
    }));
    expect(errors).toHaveLength(2);
    expect(errors[0].nodeId).toBe("b");
    expect(errors[1].nodeId).toBe("c");
    expect(errors[1].field).toBe("prompt");
  });

  it("远程错误异常形态兜底", () => {
    const normalized = normalizeRemoteErrors({ errors: "bad" });
    expect(normalized[0].message).toBe("远程校验返回异常");
  });
});
