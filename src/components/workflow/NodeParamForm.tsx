"use client";

/**
 * 节点参数表单（工单 0271 AI4）—— schema 驱动受控表单：校验错误就地提示，零新依赖。
 */

import { schemaOf } from "@/lib/workflow/node-schema";
import type { ParamError } from "@/lib/workflow/node-schema";

interface NodeParamFormProps {
  nodeType: string;
  params: Record<string, string>;
  errors?: ParamError[];
  disabled?: boolean;
  onChange: (key: string, value: string) => void;
}

export default function NodeParamForm({
  nodeType,
  params,
  errors = [],
  disabled = false,
  onChange,
}: NodeParamFormProps) {
  const schema = schemaOf(nodeType);
  const errorOf = (key: string): string | undefined =>
    errors.find((error) => error.field === key)?.message;

  return (
    <div className="space-y-3" data-testid={`param-form-${nodeType}`}>
      <div className="text-sm font-medium text-slate-600">{schema.label} 参数</div>
      {schema.fields.map((field) => {
        const error = errorOf(field.key);
        const value = params[field.key] ?? "";
        return (
          <label key={field.key} className="block text-sm">
            <span className="mb-1 block text-slate-600">
              {field.label}
              {field.required ? <span className="text-red-500"> *</span> : null}
            </span>
            {field.type === "textarea" ? (
              <textarea
                className="w-full rounded border border-slate-300 p-2 text-sm disabled:bg-slate-100"
                rows={3}
                disabled={disabled}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            ) : field.type === "boolean" ? (
              <select
                className="w-full rounded border border-slate-300 p-2 text-sm disabled:bg-slate-100"
                disabled={disabled}
                value={value}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                <option value="">未设置</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : field.type === "enum" ? (
              <select
                className="w-full rounded border border-slate-300 p-2 text-sm disabled:bg-slate-100"
                disabled={disabled}
                value={value}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                <option value="">未设置</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full rounded border border-slate-300 p-2 text-sm disabled:bg-slate-100"
                type={field.type === "number" ? "number" : "text"}
                disabled={disabled}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            )}
            {error ? (
              <span className="mt-1 block text-xs text-red-500" data-testid={`error-${field.key}`}>
                {error}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
