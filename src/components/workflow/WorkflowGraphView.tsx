"use client";

/**
 * 工作流拓扑只读视图（工单 0270 AI3 + 0274 AI7 错误定位）
 *
 * 纯 SVG 渲染：分层自动布局（layered-layout）+ 类型着色 + 校验错误节点描边高亮。
 * 零 npm 新依赖（React Flow 仅借鉴数据模型，见 0249-D3）。
 */

import { edgePath, layoutGraph } from "@/lib/workflow/layered-layout";
import { schemaOf } from "@/lib/workflow/node-schema";
import type { ValidationError } from "@/lib/workflow/validate-client";
import type { CanvasData } from "@/lib/workflow/types";

interface WorkflowGraphViewProps {
  canvas: CanvasData;
  /** 高亮节点（校验错误/diff 命中） */
  highlightedNodeIds?: string[];
  /** 高亮样式覆盖（diff 着色） */
  highlightClass?: string;
}

export default function WorkflowGraphView({
  canvas,
  highlightedNodeIds = [],
  highlightClass = "stroke-red-500",
}: WorkflowGraphViewProps) {
  const layout = layoutGraph(canvas.nodes, canvas.edges);
  const highlighted = new Set(highlightedNodeIds);

  return (
    <div className="overflow-auto rounded border border-slate-200 bg-slate-50 p-2" data-testid="workflow-graph">
      <svg
        width={Math.max(layout.width, 320)}
        height={Math.max(layout.height, 120)}
        role="img"
        aria-label={`工作流 ${canvas.name} 拓扑`}
      >
        {canvas.edges.map((edge) => {
          const path = edgePath(layout.positions, edge);
          if (!path) {
            return null;
          }
          const error = highlighted.has(edge.source) || highlighted.has(edge.target);
          return (
            <polyline
              key={edge.id}
              points={`${path.x1},${path.y1} ${path.midX},${path.y1} ${path.midX},${path.y2} ${path.x2},${path.y2}`}
              fill="none"
              className={error ? "stroke-red-400" : "stroke-slate-400"}
              strokeWidth={1.5}
            />
          );
        })}
        {canvas.nodes.map((node) => {
          const position = layout.positions[node.id];
          if (!position) {
            return null;
          }
          const schema = schemaOf(node.type);
          const isError = highlighted.has(node.id);
          return (
            <g key={node.id} transform={`translate(${position.x}, ${position.y})`}>
              <rect
                width={168}
                height={56}
                rx={8}
                className={`${schema.color} ${isError ? highlightClass : "fill-white"}`}
                strokeWidth={isError ? 2.5 : 1.5}
                data-testid={`node-${node.id}`}
              >
                <title>{`${schema.label} ${node.id}`}</title>
              </rect>
              <text x={10} y={24} className="fill-slate-700 text-xs font-medium">
                {node.id}
              </text>
              <text x={10} y={42} className="fill-slate-400 text-[10px]">
                {schema.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
