/**
 * SVG 分层自动布局（工单 0270 AI3，借鉴 dagre 分层思想 + ComfyUI 执行图观感）
 *
 * 最长路径分层 + 层内序（按前驱平均序 minimizer 简化）+ 盒尺寸常量 → 节点坐标与边折线，
 * 纯函数零依赖；孤立节点沉底层尾排。与后端同构转换端点互补（前端本地布局零往返）。
 */

import type { CanvasEdge, CanvasNode } from "./types";

/** 节点盒尺寸 */
export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 56;
/** 层间距与列间距 */
export const LAYER_GAP = 72;
export const SIBLING_GAP = 24;

/** 布局结果：节点坐标 + 画布尺寸 */
export interface LayoutResult {
  positions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
  layers: string[][];
}

/** 节点分层：最长路径定层（源层 0），孤立/环中节点沉最后层尾排 */
export function assignLayers(nodes: CanvasNode[], edges: CanvasEdge[]): string[][] {
  const ids = nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const edge of edges) {
    if (!idSet.has(edge.source) || !idSet.has(edge.target)) {
      continue;
    }
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }
  const hasOutgoing = new Set(edges.map((edge) => edge.source));

  // 孤立节点（无入无出）直接沉最后层，不参与 Kahn
  const isolated = ids.filter(
    (id) => (indegree.get(id) ?? 0) === 0 && !hasOutgoing.has(id)
  );

  // Kahn 拓扑 + 最长路径深度
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const id of ids) {
    if ((indegree.get(id) ?? 0) === 0 && !isolated.includes(id)) {
      queue.push(id);
      depth.set(id, 0);
    }
  }
  const remaining = new Map(indegree);
  const ordered: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    ordered.push(current);
    for (const next of adjacency.get(current) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, (depth.get(current) ?? 0) + 1));
      remaining.set(next, (remaining.get(next) ?? 1) - 1);
      if ((remaining.get(next) ?? 0) === 0) {
        queue.push(next);
      }
    }
  }

  // 环中未处理节点（校验前预览场景）同样沉底
  const layeredIds = new Set(ordered);
  const orphans = ids.filter((id) => !layeredIds.has(id) && !isolated.includes(id));

  const mainDepth = Math.max(0, ...ordered.map((id) => depth.get(id) ?? 0));
  const needSink = isolated.length + orphans.length > 0;
  const mainLayers = ordered.length ? mainDepth + 1 : 0;
  // 沉底需要独立末层（不与主干最深层混排）
  const layerCount = needSink ? mainLayers + 1 : Math.max(mainLayers, 1);
  const layers: string[][] = Array.from({ length: layerCount }, () => []);
  for (const id of ordered) {
    layers[Math.min(depth.get(id) ?? 0, mainLayers - 1)].push(id);
  }
  const sink = layerCount - 1;
  if (needSink) {
    layers[sink].push(...orphans.sort(), ...isolated.sort());
  }
  // 层内序：首层按 id 稳定排序，后层按前驱平均序 minimizer 简化
  for (let index = 0; index < layers.length; index++) {
    layers[index].sort((a, b) => a.localeCompare(b));
    if (index > 0) {
      const positionOf = (id: string): number => {
        const predecessors = ids.filter((id2) => (adjacency.get(id2) ?? []).includes(id));
        if (predecessors.length === 0) {
          return layers[index - 1].indexOf(id);
        }
        const avg =
          predecessors.reduce(
            (sum, p) => sum + Math.max(0, layers[index - 1].indexOf(p)),
            0
          ) / predecessors.length;
        return avg;
      };
      layers[index].sort((a, b) => positionOf(a) - positionOf(b));
    }
  }
  return layers.filter((layer) => layer.length > 0);
}

/** 全量布局：节点坐标（层=列，层内序=行）+ 画布尺寸 */
export function layoutGraph(nodes: CanvasNode[], edges: CanvasEdge[]): LayoutResult {
  const layers = assignLayers(nodes, edges);
  const positions: Record<string, { x: number; y: number }> = {};
  let width = 0;
  layers.forEach((layer, layerIndex) => {
    const x = layerIndex * (NODE_WIDTH + LAYER_GAP);
    width = Math.max(width, x + NODE_WIDTH);
    layer.forEach((id, rowIndex) => {
      positions[id] = { x, y: rowIndex * (NODE_HEIGHT + SIBLING_GAP) };
    });
  });
  const maxRows = Math.max(...layers.map((layer) => layer.length), 1);
  const height = maxRows * NODE_HEIGHT + (maxRows - 1) * SIBLING_GAP;
  return { positions, width, height, layers };
}

/** 边折线坐标（右中 → 左中，两段折线） */
export function edgePath(
  positions: Record<string, { x: number; y: number }>,
  edge: CanvasEdge
): { x1: number; y1: number; x2: number; y2: number; midX: number } | null {
  const source = positions[edge.source];
  const target = positions[edge.target];
  if (!source || !target) {
    return null;
  }
  const x1 = source.x + NODE_WIDTH;
  const y1 = source.y + NODE_HEIGHT / 2;
  const x2 = target.x;
  const y2 = target.y + NODE_HEIGHT / 2;
  return { x1, y1, x2, y2, midX: (x1 + x2) / 2 };
}
