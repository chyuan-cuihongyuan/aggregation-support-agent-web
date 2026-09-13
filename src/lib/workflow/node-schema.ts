/**
 * 节点参数 schema 注册表与校验（工单 0271 AI4，借鉴 Node-RED 面板思想）
 *
 * 节点类型 → 参数字段 schema（text/number/boolean/enum/textarea + required）；
 * 表单渲染与保存前校验共用同一 schema（schema 驱动，不写死表单）。
 */

export type FieldType = "text" | "number" | "boolean" | "enum" | "textarea";

/** 参数字段 schema */
export interface ParamField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
}

/** 节点类型 schema */
export interface NodeTypeSchema {
  type: string;
  label: string;
  color: string;
  fields: ParamField[];
}

/** 内置节点类型注册表（覆盖 TASK/INTERRUPT/SUBGRAPH 及常用业务语义键） */
export const NODE_SCHEMA_REGISTRY: NodeTypeSchema[] = [
  {
    type: "TASK",
    label: "任务节点",
    color: "stroke-sky-500",
    fields: [
      { key: "echo", label: "输出文本", type: "text", required: true, placeholder: "回显内容" },
      { key: "retries", label: "重试次数", type: "number", defaultValue: "0" },
    ],
  },
  {
    type: "INTERRUPT",
    label: "人工中断",
    color: "stroke-amber-500",
    fields: [
      { key: "prompt", label: "审批提示", type: "textarea", required: true },
      { key: "timeoutMinutes", label: "超时(分钟)", type: "number" },
    ],
  },
  {
    type: "SUBGRAPH",
    label: "子图引用",
    color: "stroke-violet-500",
    fields: [
      { key: "subgraph", label: "子图名", type: "text", required: true },
      { key: "prefix", label: "命名空间前缀", type: "text" },
    ],
  },
  {
    type: "HTTP",
    label: "HTTP 调用",
    color: "stroke-emerald-500",
    fields: [
      { key: "method", label: "方法", type: "enum", options: ["GET", "POST"], required: true },
      { key: "url", label: "URL", type: "text", required: true },
      { key: "body", label: "请求体", type: "textarea" },
    ],
  },
];

/** 取节点 schema（未知类型回退 TASK 形态的空字段集） */
export function schemaOf(type: string): NodeTypeSchema {
  return (
    NODE_SCHEMA_REGISTRY.find((schema) => schema.type === type) ?? {
      type,
      label: type,
      color: "stroke-slate-400",
      fields: [],
    }
  );
}

/** 本地参数校验：返回错误清单（空 = 通过）；错误按 {field, message} 定位 */
export interface ParamError {
  field: string;
  message: string;
}

export function validateParams(type: string, params: Record<string, string>): ParamError[] {
  const errors: ParamError[] = [];
  for (const field of schemaOf(type).fields) {
    const value = params[field.key];
    const isEmpty = value === undefined || value === null || String(value).trim() === "";
    if (field.required && isEmpty) {
      errors.push({ field: field.key, message: `${field.label} 不能为空` });
      continue;
    }
    if (isEmpty) {
      continue;
    }
    if (field.type === "number" && Number.isNaN(Number(value))) {
      errors.push({ field: field.key, message: `${field.label} 需为数字` });
    }
    if (field.type === "enum" && field.options && !field.options.includes(String(value))) {
      errors.push({ field: field.key, message: `${field.label} 取值需为: ${field.options.join("/")}` });
    }
  }
  return errors;
}
