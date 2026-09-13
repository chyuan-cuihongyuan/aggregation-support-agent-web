"use client";

/**
 * 图版本对比视图（工单 0275 AI8）：diff 四色着色明细列表（拓扑着色由 WorkflowGraphView 承担）。
 */

import { changeColorClass } from "@/lib/workflow/graph-diff";
import type { GraphDiffResult } from "@/lib/workflow/types";

interface GraphDiffViewProps {
  diff: GraphDiffResult;
}

const CHANGE_LABEL: Record<string, string> = {
  ADDED: "新增",
  REMOVED: "删除",
  CHANGED: "修改",
  UNCHANGED: "不变",
};

export default function GraphDiffView({ diff }: GraphDiffViewProps) {
  return (
    <div className="space-y-3" data-testid="graph-diff">
      <div className="flex gap-3 text-xs">
        <span className="text-green-600">新增 {diff.added}</span>
        <span className="text-red-500">删除 {diff.removed}</span>
        <span className="text-amber-600">修改 {diff.changed}</span>
        <span className="text-slate-400">不变 {diff.unchanged}</span>
      </div>
      <div className="space-y-1">
        {diff.nodes
          .filter((row) => row.change !== "UNCHANGED")
          .map((row) => (
            <div
              key={`node-${row.id}`}
              className={`flex items-center gap-2 rounded border px-2 py-1 text-xs ${changeColorClass(row.change)}`}
              data-testid={`diff-node-${row.id}`}
            >
              <span className="font-medium">{CHANGE_LABEL[row.change]}</span>
              <span>{row.id}</span>
              {row.configBefore ? (
                <span className="text-slate-500">{JSON.stringify(row.configBefore)}</span>
              ) : null}
            </div>
          ))}
        {diff.edges
          .filter((row) => row.change !== "UNCHANGED")
          .map((row) => (
            <div
              key={`edge-${row.from}-${row.to}-${row.change}`}
              className={`rounded border px-2 py-1 text-xs ${changeColorClass(row.change)}`}
            >
              <span className="font-medium">{CHANGE_LABEL[row.change]}</span>
              <span>
                边 {row.from} → {row.to}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
