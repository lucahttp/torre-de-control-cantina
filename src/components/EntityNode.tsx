import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { fmtARS } from "../lib/calc";
import { useApp } from "../store/useApp";

export type EntityNodeData = {
  type:
    | "provider"
    | "batch"
    | "ingredient"
    | "recipe"
    | "product"
    | "sale"
    | "allocation"
    | "revenue"
    | "cost_mp"
    | "variable"
    | "fixed"
    | "staff"
    | "tax"
    | "result"
    | "forecast"
    | "real"
    | "variance"
    | "driver"
    | "outlook";
  refId: string;
  highlight?: boolean;
  dim?: boolean;
  [k: string]: unknown;
};

const COLORS: Record<EntityNodeData["type"], { bg: string; border: string; accent: string; label: string }> = {
  provider: { bg: "#1f2937", border: "#f59e0b", accent: "#fbbf24", label: "Proveedor" },
  batch: { bg: "#1f2937", border: "#10b981", accent: "#34d399", label: "Lote" },
  ingredient: { bg: "#1f2937", border: "#06b6d4", accent: "#22d3ee", label: "Insumo" },
  recipe: { bg: "#1f2937", border: "#8b5cf6", accent: "#a78bfa", label: "Receta" },
  product: { bg: "#1f2937", border: "#ec4899", accent: "#f472b6", label: "Producto" },
  sale: { bg: "#1f2937", border: "#3b82f6", accent: "#60a5fa", label: "Venta" },
  allocation: { bg: "#0b1220", border: "#facc15", accent: "#fde68a", label: "Allocation" },
  revenue: { bg: "#052e1a", border: "#16a34a", accent: "#4ade80", label: "Ingresos" },
  cost_mp: { bg: "#3a1010", border: "#dc2626", accent: "#f87171", label: "Materia Prima" },
  variable: { bg: "#3a2a10", border: "#ea580c", accent: "#fb923c", label: "Variables" },
  fixed: { bg: "#1e1b4b", border: "#6366f1", accent: "#a5b4fc", label: "Fijos" },
  staff: { bg: "#1e1b4b", border: "#818cf8", accent: "#c7d2fe", label: "Personal" },
  tax: { bg: "#3a1010", border: "#dc2626", accent: "#fca5a5", label: "Impuestos" },
  result: { bg: "#042f2e", border: "#14b8a6", accent: "#5eead4", label: "Resultado" },
  forecast: { bg: "#0c1a3a", border: "#3b82f6", accent: "#93c5fd", label: "Forecast" },
  real: { bg: "#0c1a3a", border: "#22c55e", accent: "#86efac", label: "Real" },
  variance: { bg: "#0c1a3a", border: "#f59e0b", accent: "#fcd34d", label: "Variance" },
  driver: { bg: "#0c1a3a", border: "#a855f7", accent: "#d8b4fe", label: "Drivers" },
  outlook: { bg: "#0c1a3a", border: "#06b6d4", accent: "#67e8f9", label: "Outlook" },
};

function EntityNodeImpl({ data, selected }: NodeProps) {
  const d = data as unknown as EntityNodeData;
  const c = COLORS[d.type];
  const select = useApp((s) => s.selectEntity);
  const isHighlighted = d.highlight;
  const isDim = d.dim;

  return (
    <div
      onClick={() => select({ type: d.type, id: d.refId })}
      style={{
        background: c.bg,
        border: `2px solid ${selected ? "#fff" : c.border}`,
        borderRadius: 10,
        padding: 10,
        minWidth: 180,
        maxWidth: 240,
        color: "#e5e7eb",
        cursor: "pointer",
        opacity: isDim ? 0.3 : 1,
        boxShadow: isHighlighted ? `0 0 0 3px ${c.accent}80` : "0 1px 2px rgba(0,0,0,0.4)",
        transition: "opacity 0.2s, box-shadow 0.2s",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: c.accent }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: c.accent,
            fontWeight: 700,
          }}
        >
          {c.label}
        </span>
        {d.status === "NEEDS_STOCK" && (
          <span style={{ fontSize: 9, background: "#dc2626", color: "#fff", padding: "1px 6px", borderRadius: 4 }}>
            NEEDS
          </span>
        )}
      </div>
      <Body type={d.type} refId={d.refId} />
      <Handle type="source" position={Position.Bottom} style={{ background: c.accent }} />
    </div>
  );
}

function Body({ type, refId }: { type: EntityNodeData["type"]; refId: string }) {
  const data = useApp((s) => s.data);

  switch (type) {
    case "provider": {
      const prov = refId; // proveedor name
      const provBatches = data.batches.filter((b) => b.proveedor === prov);
      const total = provBatches.reduce((s, b) => s + b.costoTotal, 0);
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{prov}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {provBatches.length} lotes · {fmtARS(total)}
          </div>
        </div>
      );
    }
    case "batch": {
      const b = data.batches.find((x) => x.id === refId);
      if (!b) return <div>batch not found</div>;
      const ing = data.products.filter((p) => p.esInsumoBase).find((i) => i.id === b.productoId);
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{ing?.nombre ?? b.productoId}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>
            {b.proveedor} · {b.fechaCompraReal}
          </div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            Stock: <b>{Math.round(b.stockRestante)}</b> {ing?.unidadBase} · {fmtARS(b.costoUnidadBase)}/{ing?.unidadBase}
          </div>
          {b.isEmergency && <div style={{ fontSize: 9, color: "#fca5a5" }}>⚠ Emergencia</div>}
        </div>
      );
    }
    case "ingredient": {
      const i = data.products.filter((p) => p.esInsumoBase).find((x) => x.id === refId);
      if (!i) return <div>ingredient not found</div>;
      const batches = data.batches.filter((b) => b.productoId === i.id);
      const stock = batches.reduce((s, b) => s + b.stockRestante, 0);
      const avgCost = batches.length
        ? batches.reduce((s, b) => s + b.stockRestante * b.costoUnidadBase, 0) / Math.max(1, stock)
        : 0;
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{i.nombre}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {batches.length} lotes · stock {Math.round(stock)} {i.unidadBase}
          </div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            Costo prom: <b>{fmtARS(avgCost)}</b>/{i.unidadBase}
          </div>
        </div>
      );
    }
    case "recipe": {
      const p = data.products.find((x) => x.id === refId);
      if (!p) return <div>recipe not found</div>;
      const items = data.recipeItems.filter((r) => r.productoId === p.id);
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>BOM {p.nombre}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{items.length} ingredientes</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>
            {items
              .slice(0, 3)
              .map((it) => {
                const ing = data.products.filter((p) => p.esInsumoBase).find((i) => i.id === it.componenteId);
                return `${ing?.nombre ?? "?"} ${Math.round(it.cantidad)}`;
              })
              .join(" · ")}
          </div>
        </div>
      );
    }
    case "product": {
      const p = data.products.find((x) => x.id === refId);
      if (!p) return <div>product not found</div>;
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nombre}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{p.categoria}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            <b>{fmtARS(p.precioVentaDefault)}</b>
          </div>
        </div>
      );
    }
    case "sale": {
      const s = data.sales.find((x) => x.id === refId);
      if (!s) return <div>sale not found</div>;
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {s.items.length} ítem{s.items.length > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{s.fecha}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            Total: <b>{fmtARS(s.total)}</b>
          </div>
        </div>
      );
    }
    case "allocation": {
      const a = data.allocations.find((x) => x.id === refId);
      if (!a) return <div>allocation not found</div>;
      const ing = data.products.filter((p) => p.esInsumoBase).find((i) => i.id === a.ingredienteId);
      const b = data.batches.find((x) => x.id === a.batchId);
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>{ing?.nombre ?? a.ingredienteId}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>← {b?.id}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            {Math.round(a.qtyBase)} {ing?.unidadBase} · {fmtARS(a.costArs)}
          </div>
        </div>
      );
    }
    case "revenue":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Ingresos</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Total del mes</div>
        </div>
      );
    case "cost_mp":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Materia Prima</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Costo real por lote</div>
        </div>
      );
    case "variable":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Costos Variables</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>MP%, tarjeta, packaging</div>
        </div>
      );
    case "fixed":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Costos Fijos</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Canon, servicios, etc.</div>
        </div>
      );
    case "staff":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Personal</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{data.personal.length} personas</div>
        </div>
      );
    case "tax":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Régimen</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {data.tax.regimen} {data.tax.categoria && `· ${data.tax.categoria}`}
          </div>
        </div>
      );
    case "result":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Resultado</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Ganancia / pérdida</div>
        </div>
      );
    case "forecast":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Forecast</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Plan del mes</div>
        </div>
      );
    case "real":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Real</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Acumulado</div>
        </div>
      );
    case "variance":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Variance</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Real − Plan</div>
        </div>
      );
    case "driver":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Drivers</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Volumen · Precio · Mix</div>
        </div>
      );
    case "outlook":
      return (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Outlook</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Pronóstico revisado</div>
        </div>
      );
    default:
      return null;
  }
}

export const EntityNode = memo(EntityNodeImpl);
