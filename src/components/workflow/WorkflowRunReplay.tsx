"use client";

/**
 * 运行时间线回放视图（工单 0272 AI5）：node_run 历史 → SVG 泳道时间条，失败高亮。
 */

import { buildTimeline, failedNodes, statusColorClass } from "@/lib/workflow/run-timeline";
import type { WorkflowRun } from "@/lib/workflow/types";

interface WorkflowRunReplayProps {
  run: WorkflowRun;
}

export default function WorkflowRunReplay({ run }: WorkflowRunReplayProps) {
  const timeline = buildTimeline(run);
  const failed = new Set(failedNodes(run));

  if (timeline.length === 0) {
    return (
      <div className="rounded border border-slate-200 p-4 text-sm text-slate-400" data-testid="run-replay-empty">
        该运行无节点级明细
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded border border-slate-200 p-3" data-testid="run-replay">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-700">{run.workflowName}</span>
        <span className={run.status === "FAILED" ? "text-red-500" : "text-green-600"}>{run.status}</span>
        {run.durationMs != null ? (
          <span className="text-slate-400">{run.durationMs}ms</span>
        ) : null}
      </div>
      <svg width="100%" height={timeline.length * 28 + 8} role="img" aria-label="运行时间线">
        {timeline.map((segment, index) => (
          <g key={segment.nodeId} transform={`translate(0, ${index * 28})`}>
            <text x={0} y={18} className="fill-slate-500 text-[11px]">
              {segment.nodeId}
              {failed.has(segment.nodeId) ? " ⚠" : ""}
            </text>
            <rect
              x={140}
              y={6}
              width={Math.max(segment.widthRatio * 400, 4)}
              height={16}
              rx={4}
              className={`${statusColorClass(segment.status)} ${failed.has(segment.nodeId) ? "opacity-100" : "opacity-80"}`}
            >
              <title>{`${segment.nodeId} ${segment.status} ${segment.durationMs}ms`}</title>
            </rect>
          </g>
        ))}
      </svg>
      {run.error ? <div className="text-xs text-red-500">{run.error}</div> : null}
    </div>
  );
}
