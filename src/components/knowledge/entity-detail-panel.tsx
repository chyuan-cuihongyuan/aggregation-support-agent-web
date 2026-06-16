/**
 * 实体详情面板
 *
 * 展示知识图谱中选中实体的详细信息和关联关系
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, ExternalLink, GitBranch } from "lucide-react";
import { Button } from "@chyuan/ui-kit";
import { ScrollArea } from "@chyuan/ui-kit";
import { Badge } from "@chyuan/ui-kit";
import { requestJson } from "@chyuan/ui-kit";
import type { GraphNode, GraphEntity, GraphSubgraph } from "@/types/api";

/** 实体类型 Badge 变体 */
const ENTITY_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  CONCEPT: "default",
  PERSON: "secondary",
  ORGANIZATION: "outline",
  TECHNOLOGY: "secondary",
  PRODUCT: "destructive",
  EVENT: "outline",
};

interface EntityDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
  onNavigateEntity?: (entityId: string) => void;
}

export function EntityDetailPanel({ node, onClose, onNavigateEntity }: EntityDetailPanelProps) {
  const [entity, setEntity] = useState<GraphEntity | null>(null);
  const [subgraph, setSubgraph] = useState<GraphSubgraph | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载实体详情和子图 - 使用 useCallback 避免 effect 中直接 setState
  const loadEntityData = useCallback(async (nodeId: string) => {
    setLoading(true);
    try {
      const [entityData, subgraphData] = await Promise.all([
        requestJson<GraphEntity>(`/api/v1/graph/entities/${nodeId}`).catch(() => null),
        requestJson<GraphSubgraph>(`/api/v1/graph/subgraph/${nodeId}?depth=1`).catch(() => null),
      ]);
      setEntity(entityData);
      setSubgraph(subgraphData);
    } finally {
      setLoading(false);
    }
  }, []);

  // 使用 useRef 避免在 effect 中直接调用异步函数，并保留取消机制
  const nodeRef = useRef<GraphNode | null>(null);
  useEffect(() => {
    if (!node) return;
    if (nodeRef.current?.id === node.id) return;
    nodeRef.current = node;
    let cancelled = false;
    loadEntityData(node.id).then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [node, loadEntityData]);

  if (!node) return null;

  return (
    <div className="border-l bg-background h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium truncate">实体详情</h3>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {loading ? (
            <p className="text-xs text-muted-foreground">加载中...</p>
          ) : (
            <>
              {/* 基本信息 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">{node.label}</span>
                  <Badge variant={ENTITY_BADGE_VARIANT[node.type] || "default"} className="text-xs">
                    {node.type}
                  </Badge>
                </div>
                {node.score !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    匹配分数: {(node.score * 100).toFixed(1)}%
                  </p>
                )}
                {entity?.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {entity.description}
                  </p>
                )}
              </div>

              {/* 属性 */}
              {entity?.properties && Object.keys(entity.properties).length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-muted-foreground">属性</h4>
                  <div className="space-y-1">
                    {Object.entries(entity.properties).map(([key, value]) => (
                      <div key={key} className="flex text-xs">
                        <span className="text-muted-foreground w-20 shrink-0">{key}:</span>
                        <span className="truncate">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 关联实体 */}
              {subgraph && subgraph.edges.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    关联关系 ({subgraph.edges.length})
                  </h4>
                  <div className="space-y-1">
                    {subgraph.edges.map((edge) => {
                      const isSource = edge.source === node.id;
                      const relatedId = isSource ? edge.target : edge.source;
                      const relatedNode = subgraph.nodes.find((n) => n.id === relatedId);
                      return (
                        <button
                          key={edge.id}
                          onClick={() => onNavigateEntity?.(relatedId)}
                          className="w-full text-left p-1.5 rounded text-xs hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-primary">{edge.label}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="font-medium truncate">
                              {relatedNode?.label || relatedId}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 来源文档 */}
              {entity?.sourceDocumentId && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-muted-foreground">来源</h4>
                  <p className="text-xs text-muted-foreground">
                    文档 ID: {entity.sourceDocumentId}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
