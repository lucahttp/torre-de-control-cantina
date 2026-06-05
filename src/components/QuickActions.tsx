import { useState } from "react";
import { useApp } from "../store/useApp";
import { fmtARS } from "../lib/calc";
import { requiredQtyForSaleItem, allocateFIFO } from "../lib/fifo";
import type { Sale, SaleItem } from "../types/model";

export function QuickActions() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={btn}
      >
        Quick Actions ▾
      </button>
      {open && (
        <div style={menu}>
          <NewSaleInline onClose={() => setOpen(false)} />
          <NewBatchInline onClose={() => setOpen(false)} />
          <ResolveNeedsStockInline onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #475569",
  color: "#e5e7eb",
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
};
const menu: React.CSSProperties = {
  position: "absolute",
  top: "110%",
  right: 0,
  background: "rgba(15, 23, 42, 0.98)",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: 12,
  minWidth: 320,
  zIndex: 20,
  color: "#e5e7eb",
  fontSize: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
const label: React.CSSProperties = { display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 4 };
const input: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  color: "#e5e7eb",
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 12,
  width: "100%",
  boxSizing: "border-box",
};
const action: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 6,
  padding: 8,
};

function NewSaleInline({ onClose }: { onClose: () => void }) {
  const data = useApp((s) => s.data);
  const importData = useApp((s) => s.importData);
  const [productoId, setProductoId] = useState<string>(data.products[0]?.id ?? "");
  const [unidades, setUnidades] = useState(1);
  const [precio, setPrecio] = useState(data.products[0]?.precioVentaDefault ?? 0);

  const submit = () => {
    const p = data.products.find((x) => x.id === productoId);
    if (!p) return;
    const saleId = `s_${Date.now()}`;
    const siId = `si_${Date.now()}`;
    const saleItem: SaleItem = {
      id: siId,
      productoId: p.id,
      unidades,
      precioUnitario: precio,
      importe: unidades * precio,
    };
    const sale: Sale = {
      id: saleId,
      fecha: new Date().toISOString().slice(0, 10),
      items: [saleItem],
      total: saleItem.importe,
      status: "OK",
    };

    // FIFO allocation
    const next = structuredClone(data);
    const required = requiredQtyForSaleItem(saleItem, next.recipeItems);
    let hasMissing = false;
    for (const [ingId, qty] of required) {
      const res = allocateFIFO(ingId, qty, next.batches, { saleId, saleItemId: siId });
      for (const a of res.allocations) next.allocations.push(a);
      if (res.missing.length > 0) {
        hasMissing = true;
        next.notifications.push({
          id: `n_${Date.now()}`,
          fecha: sale.fecha,
          nivel: "warning",
          titulo: "Faltante de stock",
          mensaje: `Venta ${saleId}: ${res.missing[0].qtyBase.toFixed(0)} unidades de ${ingId} no cubiertas`,
          refTipo: "sale",
          refId: saleId,
          leida: false,
        });
      }
    }
    sale.status = hasMissing ? "NEEDS_STOCK" : "OK";
    next.sales.push(sale);
    importData(next);
    onClose();
  };

  return (
    <div style={action}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Nueva venta</div>
      <label style={label}>Producto</label>
      <select style={input} value={productoId} onChange={(e) => {
        const id = e.target.value;
        setProductoId(id);
        const p = data.products.find((x) => x.id === id);
        if (p) setPrecio(p.precioVentaDefault);
      }}>
        {data.products.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={label}>Unidades</label>
          <input type="number" min={1} style={input} value={unidades} onChange={(e) => setUnidades(Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Precio</label>
          <input type="number" style={input} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} />
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8" }}>Importe: {fmtARS(unidades * precio)}</div>
      <button onClick={submit} style={{ ...btn, marginTop: 6, width: "100%", background: "#16a34a" }}>Cobrar</button>
    </div>
  );
}

function NewBatchInline({ onClose }: { onClose: () => void }) {
  const data = useApp((s) => s.data);
  const importData = useApp((s) => s.importData);
  const [ingredienteId, setIngredienteId] = useState<string>(data.ingredients[0]?.id ?? "");
  const [proveedor, setProveedor] = useState("Coto");
  const [cantidad, setCantidad] = useState(1000);
  const [costo, setCosto] = useState(1000);
  const [emergencia, setEmergencia] = useState(false);

  const submit = () => {
    const id = `b_${Date.now()}`;
    const ing = data.ingredients.find((i) => i.id === ingredienteId);
    if (!ing) return;
    const next = structuredClone(data);
    next.batches.push({
      id,
      ingredienteId,
      proveedor,
      fechaCompraReal: new Date().toISOString().slice(0, 10),
      costoTotal: costo,
      costoUnidadBase: costo / Math.max(1, cantidad),
      cantidadInicial: cantidad,
      stockRestante: cantidad,
      isEmergency: emergencia,
    });
    importData(next);
    onClose();
  };

  return (
    <div style={action}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Nuevo lote (compra)</div>
      <label style={label}>Insumo</label>
      <select style={input} value={ingredienteId} onChange={(e) => setIngredienteId(e.target.value)}>
        {data.ingredients.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
      </select>
      <label style={label}>Proveedor</label>
      <input style={input} value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={label}>Cantidad</label>
          <input type="number" style={input} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Costo total</label>
          <input type="number" style={input} value={costo} onChange={(e) => setCosto(Number(e.target.value))} />
        </div>
      </div>
      <label style={{ ...label, marginTop: 6 }}>
        <input type="checkbox" checked={emergencia} onChange={(e) => setEmergencia(e.target.checked)} /> Compra de emergencia
      </label>
      <button onClick={submit} style={{ ...btn, marginTop: 6, width: "100%", background: "#16a34a" }}>Registrar lote</button>
    </div>
  );
}

function ResolveNeedsStockInline({ onClose }: { onClose: () => void }) {
  const data = useApp((s) => s.data);
  const importData = useApp((s) => s.importData);
  const pending = data.sales.filter((s) => s.status === "NEEDS_STOCK");
  return (
    <div style={action}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Resolver NEEDS_STOCK</div>
      {pending.length === 0 && <div style={{ color: "#94a3af" }}>No hay ventas pendientes.</div>}
      {pending.map((s) => (
        <div key={s.id} style={{ ...row, fontSize: 11 }}>
          <span>{s.id}</span>
          <button
            style={{ ...btn, padding: "2px 8px" }}
            onClick={() => {
              const next = structuredClone(data);
              const target = next.sales.find((x) => x.id === s.id);
              if (target) {
                target.status = "RESOLVED";
                next.notifications.push({
                  id: `n_${Date.now()}`,
                  fecha: target.fecha,
                  nivel: "info",
                  titulo: "Resuelto",
                  mensaje: `${s.id} marcada como resuelta. Cargá lotes para recostear.`,
                  refTipo: "sale",
                  refId: s.id,
                  leida: false,
                });
              }
              importData(next);
              onClose();
            }}
          >
            Marcar resuelta
          </button>
        </div>
      ))}
    </div>
  );
}

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "4px 0",
  borderBottom: "1px solid #1e293b",
};
