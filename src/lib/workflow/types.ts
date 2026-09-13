/**
 * 工作流可视化共享类型（六期 AI 簇 0269-0276）
 *
 * 与后端 DslCodec（schemaVersion=1）和画布数据模型同构；
 * 纯类型定义，零依赖（React Flow 只借鉴数据模型，不引入依赖）。
 */

/** 图定义节点（与后端 WorkflowGraph.NodeSpec 同构） */
export interface GraphNode {
  id: string;
  type: string;
  config: Record<string, string>;
}

/** 图定义边 */
export interface GraphEdge {
  from: string;
  to: string;
}

/** 图定义（DSL JSON 结构） */
export interface GraphDefinition {
  schemaVersion: number;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** 画布节点（React Flow 风格数据模型：节点 + 位置元数据） */
export interface CanvasNode {
  id: string;
  type: string;
  params: Record<string, string>;
  position?: { x: number; y: number };
}

/** 画布边 */
export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

/** 画布数据模型 */
export interface CanvasData {
  name: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** 节点 diff 分类 */
export type DiffChange = "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";

/** 节点 diff 行 */
export interface NodeDiffRow {
  id: string;
  type: string;
  change: DiffChange;
  configBefore?: Record<string, string> | null;
}

/** 边 diff 行 */
export interface EdgeDiffRow {
  from: string;
  to: string;
  change: DiffChange;
}

/** 图 diff 结果 */
export interface GraphDiffResult {
  nodes: NodeDiffRow[];
  edges: EdgeDiffRow[];
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
}

/** 运行节点历史（与后端 workflow_run.nodeRunsJson 对齐） */
export interface NodeRunRecord {
  nodeId: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED" | "INTERRUPTED";
  attempts?: number;
  durationMs?: number;
  error?: string;
}

/** 运行记录 */
export interface WorkflowRun {
  runId: string;
  workflowName: string;
  status: "COMPLETED" | "FAILED" | "INTERRUPTED";
  failedNodeId?: string;
  error?: string;
  durationMs?: number;
  nodeRuns?: NodeRunRecord[];
}

/** 时间线段（回放视图渲染输入） */
export interface TimelineSegment {
  nodeId: string;
  status: NodeRunRecord["status"];
  /** 相对起点偏移比例 0-1 */
  startRatio: number;
  /** 时长占比 0-1（零时长给最小可见占比） */
  widthRatio: number;
  durationMs: number;
}
