/**
 * 运行时间线映射（工单 0272 AI5，借鉴 ComfyUI/n8n 执行视图）
 *
 * run 历史（节点起止/时长）→ 归一化时间线段：失败高亮、零时长最小可见占比。
 */

import type { NodeRunRecord, TimelineSegment, WorkflowRun } from "./types";

/** 零时长节点的最小可见占比 */
export const MIN_WIDTH_RATIO = 0.02;

/**
 * 构建时间线段：以 (开始偏移, 时长) 归一化到 0-1。
 * 节点无精确开始时间时按拓扑给定顺序均匀铺开（durationMs 保留原值）。
 */
export function buildTimeline(run: WorkflowRun): TimelineSegment[] {
  const nodeRuns = run.nodeRuns ?? [];
  if (nodeRuns.length === 0) {
    return [];
  }
  const hasOffsets = nodeRuns.every((n) => typeof (n as NodeRunRecord & { startOffsetMs?: number }).startOffsetMs === "number");
  const totalDuration = Math.max(
    nodeRuns.reduce((sum, n) => sum + (n.durationMs ?? 0), 0),
    1
  );

  if (hasOffsets) {
    const totalSpan = Math.max(
      ...nodeRuns.map((n) => {
        const offset = (n as NodeRunRecord & { startOffsetMs?: number }).startOffsetMs ?? 0;
        return offset + (n.durationMs ?? 0);
      }),
      1
    );
    return nodeRuns.map((node) => {
      const offset = (node as NodeRunRecord & { startOffsetMs?: number }).startOffsetMs ?? 0;
      const width = Math.max((node.durationMs ?? 0) / totalSpan, MIN_WIDTH_RATIO);
      return {
        nodeId: node.nodeId,
        status: node.status,
        startRatio: Math.min(offset / totalSpan, 1 - width),
        widthRatio: width,
        durationMs: node.durationMs ?? 0,
      };
    });
  }

  // 无偏移：按时长比例顺序铺开（零时长给最小占比）
  const segments: TimelineSegment[] = [];
  let cursor = 0;
  for (const node of nodeRuns) {
    const width = Math.max((node.durationMs ?? 0) / totalDuration, MIN_WIDTH_RATIO);
    segments.push({
      nodeId: node.nodeId,
      status: node.status,
      startRatio: Math.min(cursor, 1 - width),
      widthRatio: width,
      durationMs: node.durationMs ?? 0,
    });
    cursor += width;
  }
  return segments;
}

/** 状态色类名（时间条着色） */
export function statusColorClass(status: NodeRunRecord["status"]): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-500";
    case "FAILED":
      return "bg-red-500";
    case "INTERRUPTED":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
}

/** 失败节点清单（回放页高亮用） */
export function failedNodes(run: WorkflowRun): string[] {
  return (run.nodeRuns ?? []).filter((n) => n.status === "FAILED").map((n) => n.nodeId);
}
