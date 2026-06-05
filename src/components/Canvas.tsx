import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EntityNode, type EntityNodeData } from "./EntityNode";
import { useApp } from "../store/useApp";
import type { ID } from "../types/model";

const nodeTypes = { entity: EntityNode };

interface Layout {
  nodes: Node<EntityNodeData>[];
  edges: Edge[];
}

function buildLayout(
  data: ReturnType<typeof useApp.getState>["data"],
  mode: ReturnType<typeof useApp.getState>["viewMode"],
  selected: { type: string; id: ID } | null
): Layout {
  const nodes: Node<EntityNodeData>[] = [];
  const edges: Edge[] = [];
  let id = 0;
  const mkId = (p: string) => `${p}_${id++}`;

  // determine highlights
  const isRel = (type: string, refId: string) =>
    !!selected && selected.type === type && selected.id === refId;
  const allRefs = collectRelated(data, selected);
  const isHL = (type: string, refId: string) =>
    isRel(type, refId) || allRefs.has(`${type}:${refId}`);

  if (mode === "operacion" || mode === "trazabilidad") {
    // Providers
    const providers = uniqueProviders(data.batches);
    providers.forEach((p, i) => {
      nodes.push({
        id: mkId(`prov_${p}`),
        type: "entity",
        position: { x: 40, y: 40 + i * 130 },
        data: { type: "provider", refId: p, highlight: isHL("provider", p), dim: !!selected && !isHL("provider", p) } as EntityNodeData,
      });
    });

    // Batches
    data.batches.forEach((b, i) => {
      const refId = b.id;
      const nodeId = mkId(`batch_${b.id}`);
      nodes.push({
        id: nodeId,
        type: "entity",
        position: { x: 320, y: 40 + i * 110 },
        data: { type: "batch", refId, highlight: isHL("batch", refId), dim: !!selected && !isHL("batch", refId) } as EntityNodeData,
      });
      // edge provider -> batch
      const pNode = nodes.find((n) => n.id.startsWith("prov_") && (n.data as EntityNodeData).refId === b.proveedor);
      if (pNode) edges.push(makeEdge(pNode.id, nodeId, "flow_physical", b.isEmergency ? "#dc2626" : "#10b981"));
    });

    // Ingredients
    data.ingredients.forEach((i, idx) => {
      const nodeId = mkId(`ing_${i.id}`);
      nodes.push({
        id: nodeId,
        type: "entity",
        position: { x: 620, y: 40 + idx * 90 },
        data: { type: "ingredient", refId: i.id, highlight: isHL("ingredient", i.id), dim: !!selected && !isHL("ingredient", i.id) } as EntityNodeData,
      });
      // edges batch -> ingredient
      data.batches
        .filter((b) => b.ingredienteId === i.id)
        .forEach((b) => {
          const bNode = nodes.find((n) => n.id.startsWith("batch_") && (n.data as EntityNodeData).refId === b.id);
          if (bNode) edges.push(makeEdge(bNode.id, nodeId, "flow_physical", "#06b6d4"));
        });
    });

    // Recipes (one per product)
    data.products.forEach((p, idx) => {
      const nodeId = mkId(`rec_${p.id}`);
      nodes.push({
        id: nodeId,
        type: "entity",
        position: { x: 920, y: 40 + idx * 110 },
        data: { type: "recipe", refId: p.id, highlight: isHL("recipe", p.id), dim: !!selected && !isHL("recipe", p.id) } as EntityNodeData,
      });
      data.recipeItems
        .filter((r) => r.productoId === p.id)
        .forEach((r) => {
          const iNode = nodes.find((n) => n.id.startsWith("ing_") && (n.data as EntityNodeData).refId === r.ingredienteId);
          if (iNode) edges.push(makeEdge(iNode.id, nodeId, "flow_physical", "#8b5cf6"));
        });
    });

    // Products
    data.products.forEach((p, idx) => {
      const nodeId = mkId(`prod_${p.id}`);
      nodes.push({
        id: nodeId,
        type: "entity",
        position: { x: 1220, y: 40 + idx * 110 },
        data: { type: "product", refId: p.id, highlight: isHL("product", p.id), dim: !!selected && !isHL("product", p.id) } as EntityNodeData,
      });
      const rNode = nodes.find((n) => n.id.startsWith("rec_") && (n.data as EntityNodeData).refId === p.id);
      if (rNode) edges.push(makeEdge(rNode.id, nodeId, "flow_physical", "#ec4899"));
    });

    // Sales
    data.sales.forEach((s, idx) => {
      const nodeId = mkId(`sale_${s.id}`);
      nodes.push({
        id: nodeId,
        type: "entity",
        position: { x: 1520, y: 40 + idx * 130 },
        data: { type: "sale", refId: s.id, status: s.status, highlight: isHL("sale", s.id), dim: !!selected && !isHL("sale", s.id) } as EntityNodeData,
      });
      // edges from products
      s.items.forEach((it) => {
        const pNode = nodes.find((n) => n.id.startsWith("prod_") && (n.data as EntityNodeData).refId === it.productoId);
        if (pNode) edges.push(makeEdge(pNode.id, nodeId, "flow_consumption", "#3b82f6"));
      });
    });

    // Allocations
    data.allocations.forEach((a, idx) => {
      const nodeId = mkId(`alloc_${a.id}`);
      nodes.push({
        id: nodeId,
        type: "entity",
        position: { x: 1820, y: 40 + idx * 60 },
        data: { type: "allocation", refId: a.id, highlight: isHL("allocation", a.id), dim: !!selected && !isHL("allocation", a.id) } as EntityNodeData,
      });
      const bNode = nodes.find((n) => n.id.startsWith("batch_") && (n.data as EntityNodeData).refId === a.batchId);
      const sNode = nodes.find((n) => n.id.startsWith("sale_") && (n.data as EntityNodeData).refId === a.saleId);
      if (bNode) edges.push(makeEdge(bNode.id, nodeId, "flow_consumption", "#facc15"));
      if (sNode) edges.push(makeEdge(nodeId, sNode.id, "flow_consumption", "#facc15"));
    });
  } else if (mode === "finanzas") {
    // Sankey-ish: Categories -> Revenue -> {MP, Variables, Fixed, Personal, Tax} -> Result
    const cats = unique(data.products.map((p) => p.categoria));
    cats.forEach((c, i) => {
      nodes.push({
        id: mkId(`cat_${c}`),
        type: "entity",
        position: { x: 40, y: 40 + i * 130 },
        data: { type: "product", refId: data.products.find((p) => p.categoria === c)?.id ?? c, highlight: false } as EntityNodeData,
      });
    });
    nodes.push({ id: mkId("rev"), type: "entity", position: { x: 380, y: 240 }, data: { type: "revenue", refId: "rev" } as EntityNodeData });
    nodes.push({ id: mkId("mp"), type: "entity", position: { x: 720, y: 60 }, data: { type: "cost_mp", refId: "mp" } as EntityNodeData });
    nodes.push({ id: mkId("var"), type: "entity", position: { x: 720, y: 200 }, data: { type: "variable", refId: "var" } as EntityNodeData });
    nodes.push({ id: mkId("fix"), type: "entity", position: { x: 720, y: 340 }, data: { type: "fixed", refId: "fix" } as EntityNodeData });
    nodes.push({ id: mkId("staff"), type: "entity", position: { x: 720, y: 480 }, data: { type: "staff", refId: "staff" } as EntityNodeData });
    nodes.push({ id: mkId("tax"), type: "entity", position: { x: 720, y: 620 }, data: { type: "tax", refId: "tax" } as EntityNodeData });
    nodes.push({ id: mkId("res"), type: "entity", position: { x: 1060, y: 320 }, data: { type: "result", refId: "res" } as EntityNodeData });
    cats.forEach((c) => {
      const cNode = nodes.find((n) => n.id.startsWith("cat_") && n.id.includes(c));
      if (cNode) edges.push(makeEdge(cNode.id, "rev", "flow_money", "#16a34a", 2));
    });
    ["mp", "var", "fix", "staff", "tax"].forEach((k) => {
      edges.push(makeEdge("rev", k, "flow_money", "#dc2626", 2));
      edges.push(makeEdge(k, "res", "flow_money", "#dc2626", 2));
    });
  } else if (mode === "forecast") {
    nodes.push({ id: mkId("fc"), type: "entity", position: { x: 40, y: 200 }, data: { type: "forecast", refId: "fc" } as EntityNodeData });
    nodes.push({ id: mkId("rl"), type: "entity", position: { x: 320, y: 200 }, data: { type: "real", refId: "rl" } as EntityNodeData });
    nodes.push({ id: mkId("vr"), type: "entity", position: { x: 600, y: 200 }, data: { type: "variance", refId: "vr" } as EntityNodeData });
    nodes.push({ id: mkId("dr"), type: "entity", position: { x: 880, y: 200 }, data: { type: "driver", refId: "dr" } as EntityNodeData });
    nodes.push({ id: mkId("ol"), type: "entity", position: { x: 1160, y: 200 }, data: { type: "outlook", refId: "ol" } as EntityNodeData });
    edges.push(makeEdge("fc", "rl", "flow_analysis", "#3b82f6"));
    edges.push(makeEdge("rl", "vr", "flow_analysis", "#22c55e"));
    edges.push(makeEdge("fc", "vr", "flow_analysis", "#3b82f6"));
    edges.push(makeEdge("vr", "dr", "flow_analysis", "#f59e0b"));
    edges.push(makeEdge("dr", "ol", "flow_analysis", "#06b6d4"));
  }

  return { nodes, edges };
}

function makeEdge(source: string, target: string, type: string, color: string, width = 1.5): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: "default",
    style: { stroke: color, strokeWidth: width, opacity: 0.6 },
    animated: type === "flow_consumption",
  };
}

function uniqueProviders(batches: ReturnType<typeof useApp.getState>["data"]["batches"]): string[] {
  return Array.from(new Set(batches.map((b) => b.proveedor)));
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function collectRelated(
  data: ReturnType<typeof useApp.getState>["data"],
  sel: { type: string; id: ID } | null
): Set<string> {
  const out = new Set<string>();
  if (!sel) return out;
  const { type, id } = sel;
  out.add(`${type}:${id}`);

  if (type === "product") {
    data.recipeItems.filter((r) => r.productoId === id).forEach((r) => {
      out.add(`ingredient:${r.ingredienteId}`);
    });
    data.recipeItems.filter((r) => r.productoId === id).forEach((r) => {
      data.batches.filter((b) => b.ingredienteId === r.ingredienteId).forEach((b) => {
        out.add(`batch:${b.id}`);
        out.add(`provider:${b.proveedor}`);
      });
    });
    data.sales.forEach((s) => {
      if (s.items.some((it) => it.productoId === id)) {
        out.add(`sale:${s.id}`);
      }
    });
  } else if (type === "sale") {
    const s = data.sales.find((x) => x.id === id);
    s?.items.forEach((it) => {
      out.add(`product:${it.productoId}`);
      out.add(`recipe:${it.productoId}`);
    });
    data.allocations.filter((a) => a.saleId === id).forEach((a) => {
      out.add(`batch:${a.batchId}`);
      out.add(`ingredient:${a.ingredienteId}`);
      out.add(`allocation:${a.id}`);
    });
  } else if (type === "batch") {
    out.add(`ingredient:${data.batches.find((b) => b.id === id)?.ingredienteId ?? ""}`);
    out.add(`provider:${data.batches.find((b) => b.id === id)?.proveedor ?? ""}`);
    data.allocations.filter((a) => a.batchId === id).forEach((a) => {
      out.add(`allocation:${a.id}`);
      out.add(`sale:${a.saleId}`);
    });
  } else if (type === "ingredient") {
    data.batches.filter((b) => b.ingredienteId === id).forEach((b) => {
      out.add(`batch:${b.id}`);
      out.add(`provider:${b.proveedor}`);
    });
    data.recipeItems.filter((r) => r.ingredienteId === id).forEach((r) => {
      out.add(`recipe:${r.productoId}`);
      out.add(`product:${r.productoId}`);
    });
  } else if (type === "provider") {
    data.batches.filter((b) => b.proveedor === id).forEach((b) => {
      out.add(`batch:${b.id}`);
      out.add(`ingredient:${b.ingredienteId}`);
    });
  } else if (type === "recipe") {
    out.add(`product:${id}`);
    data.recipeItems.filter((r) => r.productoId === id).forEach((r) => {
      out.add(`ingredient:${r.ingredienteId}`);
    });
  } else if (type === "allocation") {
    const a = data.allocations.find((x) => x.id === id);
    if (a) {
      out.add(`batch:${a.batchId}`);
      out.add(`ingredient:${a.ingredienteId}`);
      out.add(`sale:${a.saleId}`);
    }
  }
  return out;
}

export function Canvas() {
  const data = useApp((s) => s.data);
  const mode = useApp((s) => s.viewMode);
  const selected = useApp((s) => s.selectedEntity);

  const { nodes, edges } = useMemo(() => buildLayout(data, mode, selected), [data, mode, selected]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#1f2937" />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          nodeColor={(n) => {
            const t = (n.data as EntityNodeData)?.type;
            return (
              {
                provider: "#f59e0b",
                batch: "#10b981",
                ingredient: "#06b6d4",
                recipe: "#8b5cf6",
                product: "#ec4899",
                sale: "#3b82f6",
                allocation: "#facc15",
              } as Record<string, string>
            )[t ?? ""] ?? "#6b7280";
          }}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </div>
  );
}
