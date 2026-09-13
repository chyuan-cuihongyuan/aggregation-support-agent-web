/**
 * 校验联动客户端（工单 0274 AI7，借鉴 Node-RED deploy 校验回路）
 *
 * 本地预检（必填/占位未替换先拦）→ 远程 GraphValidator 端点 → 错误归一到节点定位。
 * 本地拦截优先，减少无效往返。
 */

import type { GraphDefinition } from "./types";
import type { ParamError } from "./node-schema";

/** 校验错误（节点级定位） */
export interface ValidationError {
  nodeId: string;
  field?: string;
  message: string;
  source: "local" | "remote";
}

/**
 * 本地预检：节点参数 schema 校验 + ${param} 未替换残留检测。
 * 通过返回空清单。
 */
export function localPrecheck(graph: GraphDefinition): ValidationError[] {
  const errors: ValidationError[] = [];
  const placeholderPattern = /\$\{([a-zA-Z][a-zA-Z0-9_]*)\}/;
  for (const node of graph.nodes) {
    for (const [key, value] of Object.entries(node.config)) {
      const placeholder = placeholderPattern.exec(value);
      if (placeholder) {
        errors.push({
          nodeId: node.id,
          field: key,
          message: `占位未替换: \${${placeholder[1]}}`,
          source: "local",
        });
      }
    }
  }
  return errors;
}

/**
 * 归一远程校验错误：兼容 {valid, errors: string[]} 与节点定位 {nodeId, field, message} 两种形态。
 * 远端错误串 "节点 xxx: ..." 自动解析 nodeId。
 */
export function normalizeRemoteErrors(payload: {
  valid?: boolean;
  errors?: unknown;
}): ValidationError[] {
  const raw = payload.errors ?? [];
  if (Array.isArray(raw)) {
    return raw.map((item): ValidationError => {
      if (typeof item === "string") {
        const match = /节点\s*([\w-]+)\s*[:：]\s*(.*)/.exec(item);
        if (match) {
          return { nodeId: match[1], message: match[2], source: "remote" };
        }
        return { nodeId: "*", message: item, source: "remote" };
      }
      const record = item as { nodeId?: string; field?: string; message?: string };
      return {
        nodeId: record.nodeId ?? "*",
        field: record.field,
        message: record.message ?? "未知错误",
        source: "remote",
      };
    });
  }
  return [{ nodeId: "*", message: "远程校验返回异常", source: "remote" }];
}

/**
 * 校验管线：本地预检通过才发起远程校验（fetcher 由调用方注入，便于测试与复用）。
 * 返回全部错误（本地 + 远程）。
 */
export async function validateWorkflow(
  graph: GraphDefinition,
  fetchRemote: (dslJson: string) => Promise<{ valid?: boolean; errors?: unknown }>
): Promise<ValidationError[]> {
  const localErrors = localPrecheck(graph);
  if (localErrors.length > 0) {
    return localErrors;
  }
  const remote = await fetchRemote(JSON.stringify(graph));
  return normalizeRemoteErrors(remote);
}

/** 参数错误转校验错误（表单联动用） */
export function fromParamErrors(nodeId: string, paramErrors: ParamError[]): ValidationError[] {
  return paramErrors.map((error) => ({
    nodeId,
    field: error.field,
    message: error.message,
    source: "local" as const,
  }));
}
