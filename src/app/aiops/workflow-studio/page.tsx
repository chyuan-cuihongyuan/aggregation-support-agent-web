"use client";

/**
 * 工作流工作室（六期 AI 簇 0268-0276 集成页）：
 * 蓝图库 → 参数表单编辑 → SVG 拓扑预览 → 校验联动（本地预检+远程 GraphValidator）
 * → 实例化 → 运行回放 → 版本对比。全部零 npm 新依赖。
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import NodeParamForm from "@/components/workflow/NodeParamForm";
import WorkflowGraphView from "@/components/workflow/WorkflowGraphView";
import WorkflowRunReplay from "@/components/workflow/WorkflowRunReplay";
import GraphDiffView from "@/components/workflow/GraphDiffView";
import {
  diffBlueprints,
  instantiateBlueprint,
  listBlueprints,
  validateDsl,
} from "@/lib/workflow/blueprint-api";
import { dslToCanvas } from "@/lib/workflow/canvas-mapper";
import type { CanvasData, GraphDefinition, GraphDiffResult, WorkflowRun } from "@/lib/workflow/types";
import { validateWorkflow } from "@/lib/workflow/validate-client";
import type { ValidationError } from "@/lib/workflow/validate-client";

export default function WorkflowStudioPage() {
  const [templates, setTemplates] = useState<Awaited<ReturnType<typeof listBlueprints>>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [canvas, setCanvas] = useState<CanvasData | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [instantiateParams, setInstantiateParams] = useState("{}");
  const [instantiateResult, setInstantiateResult] = useState<string>("");
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [diff, setDiff] = useState<GraphDiffResult | null>(null);
  const [message, setMessage] = useState("");

  const loadTemplates = useCallback(async () => {
    try {
      setTemplates(await listBlueprints());
    } catch (error) {
      setMessage(`蓝图加载失败: ${(error as Error).message}`);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const graph: GraphDefinition | null = useMemo(() => {
    if (!selected) {
      return null;
    }
    try {
      setCanvas(dslToCanvas(selected.graphJson));
      return JSON.parse(selected.graphJson) as GraphDefinition;
    } catch {
      setCanvas(null);
      return null;
    }
  }, [selected]);

  const errorNodeIds = errors.filter((error) => error.nodeId !== "*").map((error) => error.nodeId);

  const handleValidate = useCallback(async () => {
    if (!graph) {
      return;
    }
    try {
      const allErrors = await validateWorkflow(graph, async (dsl) => validateDsl(dsl));
      setErrors(allErrors);
      setMessage(allErrors.length === 0 ? "校验通过" : `发现 ${allErrors.length} 个问题`);
    } catch (error) {
      setMessage(`校验失败: ${(error as Error).message}`);
    }
  }, [graph]);

  const handleInstantiate = useCallback(async () => {
    if (selectedId == null) {
      return;
    }
    try {
      const params = JSON.parse(instantiateParams) as Record<string, string>;
      const result = await instantiateBlueprint(selectedId, params);
      setInstantiateResult(result.graphJson);
      setMessage(`实例化完成，替换 ${result.replacements.length} 处，校验 ${result.valid ? "通过" : "未过"}`);
    } catch (error) {
      setMessage(`实例化失败: ${(error as Error).message}`);
    }
  }, [selectedId, instantiateParams]);

  const handleReplay = useCallback(async (runId: string) => {
    try {
      const { requestJson } = await import("@/lib/api");
      setRun(await requestJson<WorkflowRun>(`/api/v1/workflow/runs/${encodeURIComponent(runId)}`));
    } catch (error) {
      setMessage(`运行加载失败: ${(error as Error).message}`);
    }
  }, []);

  const handleDiff = useCallback(async (before: string, after: string) => {
    try {
      setDiff(await diffBlueprints(before, after));
    } catch (error) {
      setMessage(`对比失败: ${(error as Error).message}`);
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6" data-testid="workflow-studio">
      <h1 className="text-xl font-semibold">工作流工作室</h1>
      {message ? <div className="rounded bg-slate-100 px-3 py-2 text-sm">{message}</div> : null}

      <section className="rounded border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">蓝图库</h2>
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              className={`rounded border px-3 py-1 text-sm ${template.id === selectedId ? "border-sky-500 bg-sky-50" : "border-slate-300"}`}
              onClick={() => setSelectedId(template.id ?? null)}
            >
              {template.name}
            </button>
          ))}
          {templates.length === 0 ? <span className="text-sm text-slate-400">暂无蓝图</span> : null}
        </div>
      </section>

      {graph && canvas ? (
        <section className="space-y-3 rounded border border-slate-200 p-4">
          <h2 className="font-medium">拓扑预览</h2>
          <WorkflowGraphView canvas={canvas} highlightedNodeIds={errorNodeIds} />
          <div className="space-y-2">
            {graph.nodes.map((node) => (
              <NodeParamForm
                key={node.id}
                nodeType={node.type}
                params={node.config}
                errors={errors
                  .filter((error) => error.nodeId === node.id && error.field)
                  .map((error) => ({ field: error.field as string, message: error.message }))}
                disabled
                onChange={() => undefined}
              />
            ))}
          </div>
          <button className="rounded bg-sky-600 px-3 py-1 text-sm text-white" onClick={() => void handleValidate()}>
            校验（本地预检 + 远程）
          </button>
          {errors.length > 0 ? (
            <ul className="list-disc pl-5 text-xs text-red-500">
              {errors.map((error, index) => (
                <li key={index}>
                  [{error.nodeId}]{error.field ? `${error.field}: ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {selectedId != null ? (
        <section className="space-y-2 rounded border border-slate-200 p-4">
          <h2 className="font-medium">实例化</h2>
          <textarea
            className="w-full rounded border border-slate-300 p-2 font-mono text-xs"
            rows={3}
            value={instantiateParams}
            onChange={(event) => setInstantiateParams(event.target.value)}
          />
          <button className="rounded bg-emerald-600 px-3 py-1 text-sm text-white" onClick={() => void handleInstantiate()}>
            实例化
          </button>
          {instantiateResult ? (
            <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs">{instantiateResult}</pre>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-2 rounded border border-slate-200 p-4">
        <h2 className="font-medium">运行回放</h2>
        <input
          className="w-full rounded border border-slate-300 p-2 text-sm"
          placeholder="输入 runId 加载运行历史"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleReplay((event.target as HTMLInputElement).value.trim());
            }
          }}
        />
        {run ? <WorkflowRunReplay run={run} /> : null}
      </section>

      <section className="space-y-2 rounded border border-slate-200 p-4">
        <h2 className="font-medium">版本对比</h2>
        <DiffInputs onDiff={handleDiff} />
        {diff ? <GraphDiffView diff={diff} /> : null}
      </section>
    </div>
  );
}

function DiffInputs({ onDiff }: { onDiff: (before: string, after: string) => void }) {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  return (
    <div className="space-y-2">
      <textarea
        className="w-full rounded border border-slate-300 p-2 font-mono text-xs"
        rows={3}
        placeholder="before DSL JSON"
        value={before}
        onChange={(event) => setBefore(event.target.value)}
      />
      <textarea
        className="w-full rounded border border-slate-300 p-2 font-mono text-xs"
        rows={3}
        placeholder="after DSL JSON"
        value={after}
        onChange={(event) => setAfter(event.target.value)}
      />
      <button
        className="rounded bg-amber-600 px-3 py-1 text-sm text-white"
        onClick={() => onDiff(before, after)}
      >
        对比
      </button>
    </div>
  );
}
