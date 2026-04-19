import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphNode, GraphEdge, EntityType } from "@/data/presets";

// react-force-graph-2d is browser-only; lazy load to avoid SSR issues.
type ForceGraphProps = {
  ref?: unknown;
  graphData: { nodes: unknown[]; links: unknown[] };
  nodeLabel?: string | ((n: unknown) => string);
  linkLabel?: string | ((l: unknown) => string);
  nodeRelSize?: number;
  linkColor?: (l: unknown) => string;
  linkWidth?: (l: unknown) => number;
  linkDirectionalArrowLength?: number;
  linkDirectionalArrowRelPos?: number;
  nodeCanvasObject?: (
    n: unknown,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
  cooldownTicks?: number;
  width?: number;
  height?: number;
  onNodeClick?: (n: unknown) => void;
};

const TYPE_COLORS: Record<EntityType, string> = {
  person: "#6366f1",
  film: "#0ea5e9",
  genre: "#8b5cf6",
  employee: "#6366f1",
  team: "#10b981",
  project: "#f59e0b",
  product: "#0ea5e9",
  issue: "#ef4444",
  fix: "#10b981",
  article: "#8b5cf6",
  paper: "#0ea5e9",
  topic: "#8b5cf6",
};

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedNodeIds?: string[];
  highlightedEdgeIds?: string[];
  showLabels: boolean;
  retrievedOnly: boolean;
  onNodeClick?: (id: string) => void;
}

export function GraphCanvas({
  nodes,
  edges,
  highlightedNodeIds = [],
  highlightedEdgeIds = [],
  showLabels,
  retrievedOnly,
  onNodeClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 480 });
  const [Comp, setComp] = useState<React.ComponentType<ForceGraphProps> | null>(null);

  useEffect(() => {
    let mounted = true;
    import("react-force-graph-2d").then((m) => {
      if (mounted) setComp(() => m.default as unknown as React.ComponentType<ForceGraphProps>);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(320, rect.width), h: Math.max(360, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const highlightNodeSet = useMemo(() => new Set(highlightedNodeIds), [highlightedNodeIds]);
  const highlightEdgeSet = useMemo(() => new Set(highlightedEdgeIds), [highlightedEdgeIds]);
  const hasHighlight = highlightNodeSet.size > 0;

  const data = useMemo(() => {
    const filteredNodes = retrievedOnly && hasHighlight
      ? nodes.filter((n) => highlightNodeSet.has(n.id))
      : nodes;
    const filteredEdges = retrievedOnly && hasHighlight
      ? edges.filter((e) => highlightEdgeSet.has(e.id))
      : edges;
    return {
      nodes: filteredNodes.map((n) => ({ ...n })),
      links: filteredEdges.map((e) => ({ ...e })),
    };
  }, [nodes, edges, retrievedOnly, hasHighlight, highlightNodeSet, highlightEdgeSet]);

  return (
    <div
      ref={containerRef}
      className="relative h-[480px] w-full overflow-hidden rounded-lg border border-border bg-card"
    >
      {Comp ? (
        <Comp
          graphData={data}
          width={size.w}
          height={size.h}
          nodeRelSize={6}
          cooldownTicks={80}
          linkColor={(l: unknown) => {
            const link = l as GraphEdge;
            if (hasHighlight && !highlightEdgeSet.has(link.id)) {
              return "rgba(120,120,120,0.15)";
            }
            return "rgba(120,120,140,0.55)";
          }}
          linkWidth={(l: unknown) => {
            const link = l as GraphEdge;
            return hasHighlight && highlightEdgeSet.has(link.id) ? 2.2 : 1;
          }}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkLabel={(l: unknown) => (l as GraphEdge).label}
          onNodeClick={(n: unknown) => {
            const node = n as GraphNode;
            onNodeClick?.(node.id);
          }}
          nodeCanvasObject={(n: unknown, ctx: CanvasRenderingContext2D, scale: number) => {
            const node = n as GraphNode & { x?: number; y?: number };
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const dim = hasHighlight && !highlightNodeSet.has(node.id);
            const color = TYPE_COLORS[node.type] || "#6b7280";
            ctx.globalAlpha = dim ? 0.2 : 1;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1.2 / scale;
            ctx.strokeStyle = "rgba(0,0,0,0.35)";
            ctx.stroke();
            if (showLabels || (hasHighlight && highlightNodeSet.has(node.id))) {
              const fontSize = Math.max(10, 12 / scale);
              ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "rgba(60,60,75,0.95)";
              ctx.fillText(node.label, x, y + 8);
            }
            ctx.globalAlpha = 1;
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Loading graph…
        </div>
      )}
      <Legend />
    </div>
  );
}

function Legend() {
  const items: Array<[EntityType, string]> = [
    ["person", "Person"],
    ["film", "Film/Paper/Product"],
    ["genre", "Genre/Topic/Article"],
    ["team", "Team/Fix"],
    ["project", "Project"],
    ["issue", "Issue"],
  ];
  return (
    <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 rounded-md border border-border bg-background/80 p-2 text-xs backdrop-blur">
      {items.map(([t, label]) => (
        <span key={t} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[t] }}
          />
          <span className="text-muted-foreground">{label}</span>
        </span>
      ))}
    </div>
  );
}
