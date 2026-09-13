/**
 * 画布数据模型双向转换（工单 0269 AI2，借鉴 React Flow nodes/edges 数据模型）
 *
 * GraphDefinition（DSL）↔ CanvasData（画布）双向纯函数；往返字节级一致。
 * 位置元数据缺失时由 layered-layout 自动布局兜底（转换层不布局）。
 */

import type { CanvasData, CanvasEdge, CanvasNode, GraphDefinition, GraphEdge, GraphNode } from "./types";

/** 图定义 → 画布数据（保留已有位置；缺省 undefined 由视图层布局兜底） */
export function graphToCanvas(graph: GraphDefinition, positions?: Record<string, { x: number; y: number }>): CanvasData {
  const nodes: CanvasNode[] = graph.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    params: { ...node.config },
    position: positions?.[node.id],
  }));
  const edges: CanvasEdge[] = graph.edges.map((edge) => ({
    id: `${edge.from}->${edge.to}`,
    source: edge.from,
    target: edge.to,
  }));
  return { name: graph.name, nodes, edges };
}

/** 画布数据 → 图定义（无位置依赖；往返一致的关键路径） */
export function canvasToGraph(canvas: CanvasData): GraphDefinition {
  const nodes: GraphNode[] = canvas.nodes.map((node) => ({
    id: node.id,
    type: node.type || "TASK",
    config: { ...node.params },
  }));
  const edges: GraphEdge[] = canvas.edges.map((edge) => ({
    from: edge.source,
    to: edge.target,
  }));
  return {
    schemaVersion: 1,
    name: canvas.name,
    nodes,
    edges,
  };
}

/** DSL JSON 字符串 → 画布数据（解析失败抛 Error，错误信息带原因） */
export function dslToCanvas(dslJson: string, positions?: Record<string, { x: number; y: number }>): CanvasData {
  const graph = JSON.parse(dslJson) as GraphDefinition;
  if (!graph || !Array.isArray(graph.nodes)) {
    throw new Error("DSL 缺少 nodes");
  }
  return graphToCanvas(graph, positions);
}

/** 画布数据 → DSL JSON 字符串 */
export function canvasToDsl(canvas: CanvasData): string {
  return JSON.stringify(canvasToGraph(canvas));
}

/** 往返一致性判定（键序无关的内容等价） */
export function roundTripStable(graph: GraphDefinition): boolean {
  const canvas = graphToCanvas(graph);
  const back = canvasToGraph(canvas);
  return JSON.stringify(back) === JSON.stringify(graph);
}
