/**
 * 知识图谱可视化组件
 *
 * 使用力导向图展示知识图谱的实体和关系
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@chyuan/ui-kit";
import { Button } from "@chyuan/ui-kit";
import { Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { requestJson } from "@chyuan/ui-kit";
import type { GraphNode, GraphSubgraph } from "@/types/api";

// 动态导入力导向图组件，避免 SSR 问题
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
      <p className="text-sm text-muted-foreground">加载图谱渲染引擎...</p>
    </div>
  ),
});

/** 实体类型颜色映射 */
const ENTITY_COLORS: Record<string, string> = {
  CONCEPT: "#3b82f6",
  PERSON: "#22c55e",
  ORGANIZATION: "#f59e0b",
  TECHNOLOGY: "#a855f7",
  PRODUCT: "#ef4444",
  EVENT: "#06b6d4",
};

/** 关系类型颜色映射 */
const RELATION_COLORS: Record<string, string> = {
  RELATED_TO: "#94a3b8",
  PART_OF: "#3b82f6",
  DEPENDS_ON: "#f59e0b",
  BELONGS_TO: "#22c55e",
  USES: "#a855f7",
  LOCATED_IN: "#06b6d4",
};

/** ForceGraph 节点类型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraphNode = any;

/** ForceGraph 连接类型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraphLink = any;

interface GraphData {
  nodes: { id: string; label: string; type: string; val: number; score?: number }[];
  links: { source: string; target: string; label: string; type: string }[];
}

interface GraphViewerProps {
  initialData?: GraphSubgraph;
  onNodeClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

export function GraphViewer({ initialData, onNodeClick, width, height }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({ w: width || 800, h: height || 500 });
  const [externalData, setExternalData] = useState<GraphSubgraph | null>(null);

  // 监听容器尺寸
  useEffect(() => {
    if (!containerRef.current || width) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          w: Math.floor(entry.contentRect.width),
          h: Math.floor(entry.contentRect.height) || 500,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width]);

  // 转换子图数据为力导向图格式
  const convertToGraphData = useCallback((subgraph: GraphSubgraph): GraphData => {
    const nodes = subgraph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      val: 10,
      score: n.score,
    }));
    const links = subgraph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label,
      type: e.type,
    }));
    return { nodes, links };
  }, []);

  // 计算图谱数据（优先使用外部数据，否则使用初始数据）
  const graphData = useMemo(() => {
    const source = externalData || initialData;
    return source ? convertToGraphData(source) : { nodes: [], links: [] };
  }, [externalData, initialData, convertToGraphData]);

  // 搜索实体
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await requestJson<GraphSubgraph>(
        `/api/v1/graph/visualization?query=${encodeURIComponent(searchQuery)}&limit=50`
      );
      setExternalData(res);
      setHighlightNodes(new Set());
    } catch {
      // 静默处理
    }
  }, [searchQuery]);

  // 高亮搜索匹配节点
  const handleHighlight = useCallback(() => {
    if (!searchQuery.trim()) {
      setHighlightNodes(new Set());
      return;
    }
    const matched = new Set(
      graphData.nodes
        .filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((n) => n.id)
    );
    setHighlightNodes(matched);
  }, [searchQuery, graphData.nodes]);

  // 缩放控制
  const handleZoomIn = useCallback(() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300), []);
  const handleZoomOut = useCallback(() => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 300), []);
  const handleFitAll = useCallback(() => fgRef.current?.zoomToFit(400, 50), []);

  // 节点渲染
  const nodeCanvasObject = useCallback(
    (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.label;
      const fontSize = Math.max(12 / globalScale, 2);
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(label).width;
      const bgWidth = textWidth + fontSize;
      const bgHeight = fontSize * 1.8;
      const isHighlighted = highlightNodes.has(node.id);

      // 节点背景
      ctx.fillStyle = isHighlighted
        ? "#fbbf24"
        : ENTITY_COLORS[node.type] || "#64748b";
      ctx.globalAlpha = isHighlighted ? 1 : 0.85;
      ctx.beginPath();
      ctx.roundRect(node.x - bgWidth / 2, node.y - bgHeight / 2, bgWidth, bgHeight, 3);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 节点文字
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, node.x, node.y);
    },
    [highlightNodes]
  );

  return (
    <div ref={containerRef} className="flex flex-col h-full gap-2">
      {/* 工具栏 */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索实体..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="outline" onClick={handleSearch} className="h-8 px-2">
            <Search className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleHighlight} className="h-8 px-2">
            定位
          </Button>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={handleZoomIn} className="h-8 px-2">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut} className="h-8 px-2">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleFitAll} className="h-8 px-2">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(ENTITY_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>

      {/* 图谱画布 */}
      <div className="flex-1 rounded-lg border bg-background overflow-hidden">
        {graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">暂无图谱数据</p>
              <p className="text-xs text-muted-foreground">请先上传文档构建图谱，或搜索实体查看</p>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={dimensions.w}
            height={dimensions.h || 500}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: ForceGraphNode, color: string, ctx: CanvasRenderingContext2D) => {
              const fontSize = 12;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(node.label).width;
              ctx.fillStyle = color;
              ctx.fillRect(
                node.x - textWidth / 2 - 4,
                node.y - fontSize,
                textWidth + 8,
                fontSize * 2
              );
            }}
            linkColor={(link: ForceGraphLink) => RELATION_COLORS[link.type] || "#94a3b8"}
            linkWidth={1}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            onNodeClick={(node: ForceGraphNode) => {
              if (onNodeClick) {
                onNodeClick({
                  id: node.id,
                  label: node.label,
                  type: node.type,
                  score: node.score,
                });
              }
            }}
            backgroundColor="transparent"
            cooldownTicks={100}
          />
        )}
      </div>
    </div>
  );
}
