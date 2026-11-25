import { useApp } from "../store/useApp";
import { fmtARS } from "../lib/calc";

export function DetailPanel() {
  const sel = useApp((s) => s.selectedEntity);
  const close = () => useApp.getState().selectEntity(null);
  const data = useApp((s) => s.data);

  if (!sel) {
    return (
      <aside style={panelStyle}>
        <h3 style={h3}>Detalle</h3>
        <p style={{ color: "#9ca3af", fontSize: 13 }}>Click en cualquier nodo del canvas para ver su trazabilidad.</p>
      </aside>
    );
  }

  return (
    <aside style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={h3}>Detalle · {sel.type}</h3>
        <button onClick={close} style={btn}>×</button>
      </div>
      <EntityDetail type={sel.type} id={sel.id} data={data} />
    </aside>
  );
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: 70,
  right: 10,
  width: 360,
  maxHeight: "calc(100vh - 90px)",
  overflowY: "auto",
  background: "rgba(15, 23, 42, 0.95)",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: 14,
  color: "#e5e7eb",
  fontSize: 13,
  zIndex: 10,
  backdropFilter: "blur(6px)",
};

const h3: React.CSSProperties = { margin: 0, fontSize: 14, fontWeight: 600 };
const btn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #475569",
  color: "#e5e7eb",
  width: 24,
  height: 24,
  borderRadius: 4,
  cursor: "pointer",
};
const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "4px 0",
  borderBottom: "1px solid #1e293b",
  fontSize: 12,
};
const section: React.CSSProperties = { marginTop: 10, fontWeight: 600, fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 };

function EntityDetail({ type, id, data }: { type: string; id: string; data: ReturnType<typeof useApp.getState>["data"] }) {
  if (type === "product") {
    const p = data.products.find((x) => x.id === id);
    if (!p) return <div>No encontrado</div>;
    const items = data.recipeItems.filter((r) => r.productoId === p.id);
    const sales = data.sales.filter((s) => s.items.some((it) => it.productoId === p.id));
    const totalUnidades = sales.reduce((s, sa) => s + sa.items.filter((it) => it.productoId === p.id).reduce((x, it) => x + it.unidades, 0), 0);
    const totalIngresos = sales.reduce((s, sa) => s + sa.items.filter((it) => it.productoId === p.id).reduce((x, it) => x + it.importe, 0), 0);
    return (
      <div>
        <div style={row}><span>Nombre</span><b>{p.nombre}</b></div>
        <div style={row}><span>Categoría</span><b>{p.categoria}</b></div>
        <div style={row}><span>Precio</span><b>{fmtARS(p.precioVentaDefault)}</b></div>
        <div style={row}><span>Activo</span><b>{p.activo ? "sí" : "no"}</b></div>
        <div style={section}>Receta</div>
        {items.map((it) => {
          const ing = data.products.filter((p) => p.esInsumoBase).find((i) => i.id === it.componenteId);
          return <div key={it.id} style={row}><span>{ing?.nombre}</span><b>{it.cantidad} {ing?.unidadBase}</b></div>;
        })}
        <div style={section}>Ventas del día</div>
        <div style={row}><span>Ventas con este producto</span><b>{sales.length}</b></div>
        <div style={row}><span>Unidades vendidas</span><b>{totalUnidades}</b></div>
        <div style={row}><span>Ingresos</span><b>{fmtARS(totalIngresos)}</b></div>
      </div>
    );
  }
  if (type === "sale") {
    const s = data.sales.find((x) => x.id === id);
    if (!s) return <div>No encontrada</div>;
    const allocs = data.allocations.filter((a) => a.saleId === s.id);
    return (
      <div>
        <div style={row}><span>ID</span><b>{s.id}</b></div>
        <div style={row}><span>Fecha</span><b>{s.fecha}</b></div>
        <div style={row}><span>Status</span><b>{s.status}</b></div>
        <div style={row}><span>Total</span><b>{fmtARS(s.total)}</b></div>
        <div style={section}>Líneas ({s.items.length})</div>
        {s.items.map((it) => {
          const p = data.products.find((x) => x.id === it.productoId);
          return <div key={it.id} style={row}><span>{p?.nombre}</span><b>{it.unidades}u · {fmtARS(it.importe)}</b></div>;
        })}
        <div style={section}>Trazabilidad (allocations)</div>
        {allocs.length === 0 && <div style={{ color: "#9ca3af", fontSize: 11 }}>Sin allocations</div>}
        {allocs.map((a) => {
          const ing = data.products.filter((p) => p.esInsumoBase).find((i) => i.id === a.ingredienteId);
          const b = data.batches.find((x) => x.id === a.batchId);
          return (
            <div key={a.id} style={row}>
              <span>{ing?.nombre} ← <code style={{ fontSize: 10 }}>{b?.id}</code></span>
              <b>{Math.round(a.qtyBase)} · {fmtARS(a.costArs)}</b>
            </div>
          );
        })}
      </div>
    );
  }
  if (type === "batch") {
    const b = data.batches.find((x) => x.id === id);
    if (!b) return <div>No encontrado</div>;
    const ing = data.products.filter((p) => p.esInsumoBase).find((i) => i.id === b.productoId);
    const allocs = data.allocations.filter((a) => a.batchId === b.id);
    const sales = data.sales.filter((s) => allocs.some((a) => a.saleId === s.id));
    return (
      <div>
        <div style={row}><span>Lote</span><b>{b.id}</b></div>
        <div style={row}><span>Insumo</span><b>{ing?.nombre}</b></div>
        <div style={row}><span>Proveedor</span><b>{b.proveedor}</b></div>
        <div style={row}><span>Compra</span><b>{b.fechaCompraReal}</b></div>
        <div style={row}><span>Costo total</span><b>{fmtARS(b.costoTotal)}</b></div>
        <div style={row}><span>Costo/unidad</span><b>{fmtARS(b.costoUnidadBase)}</b></div>
        <div style={row}><span>Stock restante</span><b>{Math.round(b.stockRestante)} {ing?.unidadBase}</b></div>
        {b.vencimiento && <div style={row}><span>Vence</span><b>{b.vencimiento}</b></div>}
        {b.isEmergency && <div style={row}><span>Flag</span><b style={{ color: "#fca5a5" }}>⚠ Emergencia</b></div>}
        <div style={section}>Usado en ventas</div>
        <div style={row}><span>Ventas</span><b>{sales.length}</b></div>
        <div style={row}><span>Allocations</span><b>{allocs.length}</b></div>
        {sales.slice(0, 10).map((s) => (
          <div key={s.id} style={row}><span>{s.id}</span><b>{fmtARS(s.total)}</b></div>
        ))}
      </div>
    );
  }
  if (type === "ingredient") {
    const i = data.products.filter((p) => p.esInsumoBase).find((x) => x.id === id);
    if (!i) return <div>No encontrado</div>;
    const batches = data.batches.filter((b) => b.productoId === i.id);
    const stock = batches.reduce((s, b) => s + b.stockRestante, 0);
    return (
      <div>
        <div style={row}><span>Insumo</span><b>{i.nombre}</b></div>
        <div style={row}><span>Unidad base</span><b>{i.unidadBase}</b></div>
        <div style={row}><span>Stock total</span><b>{Math.round(stock)} {i.unidadBase}</b></div>
        <div style={row}><span>Lotes</span><b>{batches.length}</b></div>
        <div style={section}>Lotes</div>
        {batches.map((b) => (
          <div key={b.id} style={row}>
            <span>{b.id} ({b.proveedor})</span>
            <b>{Math.round(b.stockRestante)} {i.unidadBase}</b>
          </div>
        ))}
      </div>
    );
  }
  if (type === "allocation") {
    const a = data.allocations.find((x) => x.id === id);
    if (!a) return <div>No encontrada</div>;
    return (
      <div>
        <div style={row}><span>Venta</span><b>{a.saleId}</b></div>
        <div style={row}><span>Insumo</span><b>{a.ingredienteId}</b></div>
        <div style={row}><span>Lote</span><b>{a.batchId}</b></div>
        <div style={row}><span>Cantidad</span><b>{Math.round(a.qtyBase)}</b></div>
        <div style={row}><span>Costo</span><b>{fmtARS(a.costArs)}</b></div>
      </div>
    );
  }
  if (type === "provider") {
    const provBatches = data.batches.filter((b) => b.proveedor === id);
    return (
      <div>
        <div style={row}><span>Proveedor</span><b>{id}</b></div>
        <div style={row}><span>Lotes</span><b>{provBatches.length}</b></div>
        <div style={row}><span>Total comprado</span><b>{fmtARS(provBatches.reduce((s, b) => s + b.costoTotal, 0))}</b></div>
        <div style={section}>Lotes</div>
        {provBatches.map((b) => (
          <div key={b.id} style={row}><span>{b.id} · {b.productoId}</span><b>{fmtARS(b.costoTotal)}</b></div>
        ))}
      </div>
    );
  }
  return <div style={{ color: "#9ca3af" }}>Detalle no implementado para {type}.</div>;
}
