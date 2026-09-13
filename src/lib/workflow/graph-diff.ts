/**
 * 图版本 diff（工单 0275 AI8，与后端 GraphDiffCalculator 同构）
 *
 * 按节点 id 与边 (from,to) 三元组集合比对：ADDED/REMOVED/CHANGED（config 或 type 变化）/UNCHANGED。
 */

import type { DiffChange, GraphDefinition, GraphDiffResult, NodeDiffRow, EdgeDiffRow } from "./types";

export function diffGraphs(before: GraphDefinition, after: GraphDefinition): GraphDiffResult {
  const beforeNodes = new Map(before.nodes.map((n) => [n.id, n]));
  const afterNodes = new Map(after.nodes.map((n) => [n.id, n]));

  const nodeRows: NodeDiffRow[] = [];
  let added = 0;
  let removed = 0;
  let changed = 0;
  let unchanged = 0;

  for (const [id, afterNode] of afterNodes) {
    const beforeNode = beforeNodes.get(id);
    if (!beforeNode) {
      nodeRows.push({ id, type: afterNode.type, change: "ADDED" as DiffChange, configBefore: null });
      added++;
      continue;
    }
    const sameConfig = JSON.stringify(beforeNode.config) === JSON.stringify(afterNode.config);
    if (!sameConfig || beforeNode.type !== afterNode.type) {
      const changes: Record<string, string> = {};
      const keys = new Set([...Object.keys(beforeNode.config), ...Object.keys(afterNode.config)]);
      for (const key of keys) {
        const b = beforeNode.config[key];
        const a = afterNode.config[key];
        if (b !== a) {
          changes[key] = `${b} -> ${a}`;
        }
      }
      if (beforeNode.type !== afterNode.type) {
        changes.type = `${beforeNode.type} -> ${afterNode.type}`;
      }
      nodeRows.push({ id, type: afterNode.type, change: "CHANGED" as DiffChange, configBefore: changes });
      changed++;
      continue;
    }
    nodeRows.push({ id, type: afterNode.type, change: "UNCHANGED" as DiffChange, configBefore: null });
    unchanged++;
  }
  for (const [id, beforeNode] of beforeNodes) {
    if (!afterNodes.has(id)) {
      nodeRows.push({ id, type: beforeNode.type, change: "REMOVED" as DiffChange, configBefore: beforeNode.config });
      removed++;
    }
  }

  const beforeEdges = new Set(before.edges.map((e) => `${e.from}->${e.to}`));
  const afterEdges = new Set(after.edges.map((e) => `${e.from}->${e.to}`));
  const edgeRows: EdgeDiffRow[] = [];
  for (const key of afterEdges) {
    const [from, to] = key.split("->");
    edgeRows.push({
      from,
      to,
      change: (beforeEdges.has(key) ? "UNCHANGED" : "ADDED") as DiffChange,
    });
  }
  for (const key of beforeEdges) {
    if (!afterEdges.has(key)) {
      const [from, to] = key.split("->");
      edgeRows.push({ from, to, change: "REMOVED" as DiffChange });
    }
  }

  const rank: Record<string, number> = { CHANGED: 0, ADDED: 1, REMOVED: 2, UNCHANGED: 3 };
  nodeRows.sort((a, b) => rank[a.change] - rank[b.change] || a.id.localeCompare(b.id));
  edgeRows.sort((a, b) => rank[a.change] - rank[b.change]);

  return { nodes: nodeRows, edges: edgeRows, added, removed, changed, unchanged };
}

/** diff 四色类名（视图层着色用） */
export function changeColorClass(change: DiffChange): string {
  switch (change) {
    case "ADDED":
      return "stroke-green-500 fill-green-50";
    case "REMOVED":
      return "stroke-red-500 fill-red-50";
    case "CHANGED":
      return "stroke-amber-500 fill-amber-50";
    default:
      return "stroke-slate-400 fill-white";
  }
}
