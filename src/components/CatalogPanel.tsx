import { useMemo, useState } from "react";
import { useApp } from "../store/useApp";
import { fmtARS, fmtPct, productMargin, computeProductCostMap } from "../lib/calc";
import type { Categoria, Product, RecipeItem, UnidadBase } from "../types/model";
import { TC_CAT_LABEL } from "../data/totem";

const CATEGORIAS: Categoria[] = [
  "Sandwiches",
  "Pizzas",
  "Tostados",
  "Desayuno",
  "Bebidas",
  "Alfajores_Dulces",
  "Snacks_Salados",
  "Otros",
];

const UNIDADES: UnidadBase[] = [
  "g",
  "kg",
  "ml",
  "l",
  "unidad",
  "botella",
  "vaso",
  "porcion",
  "paquete",
];

// Cost map: id -> ARS per unit. For a BOM leaf (insumo) it's the avg batch
// cost. For a composite / sellable, it's the sum of its components' cost.
function buildCostMap(products: Product[], batches: ReturnType<typeof useApp.getState>["data"]["batches"]): Map<string, number> {
  return computeProductCostMap(products, batches);
}

export function CatalogPanel() {
  const data = useApp((s) => s.data);
  const addProduct = useApp((s) => s.addProduct);
  const updateProduct = useApp((s) => s.updateProduct);
  const deleteProduct = useApp((s) => s.deleteProduct);
  const addRecipeItem = useApp((s) => s.addRecipeItem);
  const updateRecipeItem = useApp((s) => s.updateRecipeItem);
  const deleteRecipeItem = useApp((s) => s.deleteRecipeItem);
  const syncTotemProductos = useApp((s) => s.syncTotemProductos);
  const syncTotemPedidos = useApp((s) => s.syncTotemPedidos);

  const [selectedId, setSelectedId] = useState<string>(data.products[0]?.id ?? "");
  const [syncing, setSyncing] = useState<"" | "productos" | "pedidos">("");

  const selected = useMemo(() => data.products.find((p) => p.id === selectedId), [data.products, selectedId]);
  const costMap = useMemo(() => buildCostMap(data.products, data.batches), [data.products, data.batches]);
  const recipe = useMemo(() => data.recipeItems.filter((r) => r.productoId === selectedId), [data.recipeItems, selectedId]);

  const syncProductos = () => {
    setSyncing("productos");
    const n = syncTotemProductos();
    setSyncing("");
    alert(`${n} producto(s) nuevo(s) del totem importados.`);
  };
  const syncPedidos = () => {
    setSyncing("pedidos");
    const r = syncTotemPedidos();
    setSyncing("");
    alert(`Totem: ${r.imported} pedido(s) importado(s), ${r.skipped} saltado(s).`);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 360px", gap: 12, height: "100%", padding: 12, overflow: "hidden" }}>
      {/* LEFT: lista de productos */}
      <div style={card}>
        <div style={cardHeader}>
          <span>Catálogo ({data.products.length})</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              style={btnSmall}
              onClick={syncProductos}
              disabled={syncing !== ""}
              title="Importar productos del totem (tc_producto)"
            >
              {syncing === "productos" ? "..." : "🔄 Productos"}
            </button>
            <button
              style={btnSmall}
              onClick={syncPedidos}
              disabled={syncing !== ""}
              title="Importar pedidos PAGADOS del totem (tc_pedido)"
            >
              {syncing === "pedidos" ? "..." : "🔄 Pedidos"}
            </button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {data.products.map((p) => {
            const cost = costMap.get(p.id) ?? 0;
            const m = productMargin(p.id, p.precioVentaDefault, data.recipeItems, costMap).marginPct;
            const isSel = p.id === selectedId;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: isSel ? "#1e293b" : "transparent",
                  border: isSel ? "1px solid #3b82f6" : "1px solid transparent",
                  marginBottom: 2,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{p.nombre}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtARS(p.precioVentaDefault)}</span>
                </div>
                <div style={{ fontSize: 10, color: "#64748b", display: "flex", gap: 8, marginTop: 2 }}>
                  <span>{p.categoria}</span>
                  <span>· {p.unidadBase}</span>
                  {p.tcProductoId && <span style={{ color: "#06b6d4" }}>↻ totem</span>}
                  {p.esInsumoBase && <span style={{ color: "#f59e0b" }}>📦 insumo</span>}
                </div>
                {!p.esInsumoBase && p.precioVentaDefault > 0 && (
                  <div style={{ fontSize: 10, marginTop: 2, color: m >= 30 ? "#10b981" : m >= 15 ? "#f59e0b" : "#dc2626" }}>
                    costo {fmtARS(cost)} · margen {fmtPct(m)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          style={{ ...btn, marginTop: 8 }}
          onClick={() => {
            const id = addProduct({
              nombre: "Nuevo producto",
              categoria: "Otros",
              precioVentaDefault: 0,
              activo: true,
              unidadBase: "unidad",
              esInsumoBase: false,
            });
            setSelectedId(id);
          }}
        >
          + Nuevo producto
        </button>
      </div>

      {/* CENTER: editor del producto seleccionado */}
      <div style={card}>
        {selected ? (
          <>
            <div style={cardHeader}>
              <span>Producto</span>
              <button
                style={{ ...btnSmall, background: "#7f1d1d" }}
                onClick={() => {
                  if (confirm(`¿Eliminar ${selected.nombre}?`)) {
                    deleteProduct(selected.id);
                    setSelectedId(data.products[0]?.id ?? "");
                  }
                }}
              >
                Eliminar
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <Field label="Nombre">
                <input style={input} value={selected.nombre} onChange={(e) => updateProduct(selected.id, { nombre: e.target.value })} />
              </Field>
              <Field label="Precio venta (ARS)">
                <input
                  style={input}
                  type="number"
                  value={selected.precioVentaDefault}
                  onChange={(e) => updateProduct(selected.id, { precioVentaDefault: Number(e.target.value) })}
                />
              </Field>
              <Field label="Categoría admin">
                <select style={input} value={selected.categoria} onChange={(e) => updateProduct(selected.id, { categoria: e.target.value as Categoria })}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Unidad base">
                <select style={input} value={selected.unidadBase} onChange={(e) => updateProduct(selected.id, { unidadBase: e.target.value as UnidadBase })}>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Categoría totem (tc_categoria)">
                <select
                  style={input}
                  value={selected.tcCategoria ?? ""}
                  onChange={(e) => updateProduct(selected.id, { tcCategoria: Number(e.target.value) as Product["tcCategoria"] })}
                >
                  <option value="">— sin sync —</option>
                  {(Object.keys(TC_CAT_LABEL) as unknown as Array<keyof typeof TC_CAT_LABEL>).map((k) => {
                    const v = k as keyof typeof TC_CAT_LABEL;
                    return <option key={k} value={k}>{v} = {TC_CAT_LABEL[v]}</option>;
                  })}
                </select>
              </Field>
              <Field label="Estado">
                <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={selected.activo}
                    onChange={(e) => updateProduct(selected.id, { activo: e.target.checked })}
                  />
                  {selected.activo ? "Activo (se vende)" : "Pausado"}
                </label>
              </Field>
            </div>

            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
              Costo: <b style={{ color: "#e2e8f0" }}>{fmtARS(costMap.get(selected.id) ?? 0)}</b>{" "}
              · Margen:{" "}
              <b style={{ color: "#e2e8f0" }}>{fmtPct(productMargin(selected.id, selected.precioVentaDefault, data.recipeItems, costMap).marginPct)}</b>
              {selected.tcProductoId && (
                <span style={{ marginLeft: 8, color: "#06b6d4" }}>↻ Sincronizado con totem ({selected.tcProductoId})</span>
              )}
            </div>

            <div style={cardHeader}>
              <span>Receta / BOM ({recipe.length} líneas)</span>
            </div>
            <RecipeEditor
              productId={selected.id}
              items={recipe}
              products={data.products}
              addRecipeItem={addRecipeItem}
              updateRecipeItem={updateRecipeItem}
              deleteRecipeItem={deleteRecipeItem}
            />
          </>
        ) : (
          <div style={{ padding: 20, color: "#64748b", textAlign: "center" }}>Seleccioná un producto a la izquierda</div>
        )}
      </div>

      {/* RIGHT: árbol de explosión + costo por nivel */}
      <div style={card}>
        <div style={cardHeader}><span>Cost breakdown</span></div>
        {selected ? <CostTree productId={selected.id} products={data.products} recipeItems={data.recipeItems} costMap={costMap} /> : null}
      </div>
    </div>
  );
}

// ---------- Editor de receta (BOM) ----------

function RecipeEditor(props: {
  productId: string;
  items: RecipeItem[];
  products: Product[];
  addRecipeItem: ReturnType<typeof useApp.getState>["addRecipeItem"];
  updateRecipeItem: ReturnType<typeof useApp.getState>["updateRecipeItem"];
  deleteRecipeItem: ReturnType<typeof useApp.getState>["deleteRecipeItem"];
}) {
  const { productId, items, products, addRecipeItem, updateRecipeItem, deleteRecipeItem } = props;
  return (
    <div>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {items.length === 0 && <div style={{ fontSize: 11, color: "#64748b", padding: 8 }}>Sin líneas. Producto = hoja del BOM.</div>}
        {items.map((it) => {
          const comp = products.find((p) => p.id === it.componenteId);
          const isFraction = comp && !comp.esInsumoBase;
          return (
            <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 60px 24px", gap: 4, alignItems: "center", marginBottom: 4, padding: 4, background: "#0f172a", borderRadius: 4 }}>
              <select
                style={{ ...input, fontSize: 11 }}
                value={it.componenteId}
                onChange={(e) => updateRecipeItem(it.id, { componenteId: e.target.value })}
              >
                {products
                  .filter((p) => p.id !== productId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.unidadBase}){p.esInsumoBase ? "" : " ⚙"}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                step="0.001"
                style={{ ...input, fontSize: 11 }}
                value={it.cantidad}
                onChange={(e) => updateRecipeItem(it.id, { cantidad: Number(e.target.value) })}
                title={isFraction ? `Fracción o múltiplo de ${comp?.unidadBase}` : "Cantidad en unidadBase del componente"}
              />
              <input
                type="number"
                step="0.01"
                max="1"
                style={{ ...input, fontSize: 11 }}
                value={it.mermaPct}
                onChange={(e) => updateRecipeItem(it.id, { mermaPct: Number(e.target.value) })}
                disabled={!!isFraction}
                title={isFraction ? "Merma no aplica a fraccionar" : "Merma 0..1"}
              />
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{isFraction ? "×frac" : "×full"}</span>
              <button
                style={{ ...btnSmall, background: "#7f1d1d", padding: "2px 6px" }}
                onClick={() => deleteRecipeItem(it.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        style={{ ...btn, marginTop: 6, fontSize: 11 }}
        onClick={() => {
          const others = products.filter((p) => p.id !== productId);
          const firstLeaf = others.find((p) => p.esInsumoBase);
          addRecipeItem({
            productoId: productId,
            componenteId: firstLeaf?.id ?? others[0]?.id ?? "",
            cantidad: 1,
            mermaPct: 0,
          });
        }}
      >
        + Agregar línea
      </button>
    </div>
  );
}

// ---------- Cost breakdown tree (multi-nivel) ----------

function CostTree(props: { productId: string; products: Product[]; recipeItems: RecipeItem[]; costMap: Map<string, number> }) {
  const { productId, products, recipeItems, costMap } = props;
  const product = products.find((p) => p.id === productId);
  if (!product) return null;

  const lines: { depth: number; name: string; qty: number; unit: string; costUnit: number; subtotal: number; isLeaf: boolean }[] = [];
  const visit = (pid: string, mult: number, depth: number, visited: Set<string>) => {
    if (visited.has(pid)) return;
    const next = new Set(visited);
    next.add(pid);
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    const recipe = recipeItems.filter((r) => r.productoId === pid);
    if (recipe.length === 0) {
      const cost = costMap.get(pid) ?? 0;
      lines.push({ depth, name: p.nombre, qty: mult, unit: p.unidadBase, costUnit: cost, subtotal: cost * mult, isLeaf: true });
      return;
    }
    lines.push({ depth, name: `↘ ${p.nombre}`, qty: mult, unit: p.unidadBase, costUnit: 0, subtotal: 0, isLeaf: false });
    for (const it of recipe) {
      visit(it.componenteId, mult * it.cantidad * (1 + it.mermaPct), depth + 1, next);
    }
  };
  visit(productId, 1, 0, new Set());

  const total = costMap.get(productId) ?? 0;
  return (
    <div style={{ overflowY: "auto", fontSize: 11 }}>
      <div style={{ padding: "8px 10px", background: "#0f172a", borderRadius: 6, marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Costo total: {fmtARS(total)}</div>
        <div style={{ fontSize: 10, color: "#94a3b8" }}>1 {product.unidadBase} de {product.nombre}</div>
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            paddingLeft: 8 + l.depth * 14,
            padding: "2px 4px",
            fontSize: 11,
            color: l.isLeaf ? "#e2e8f0" : "#94a3b8",
            fontWeight: l.depth === 0 ? 600 : 400,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {l.name} <span style={{ color: "#64748b" }}>×{l.qty.toFixed(3)} {l.unit}</span>
          </span>
          <span>{l.isLeaf ? fmtARS(l.subtotal) : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- helpers de UI ----------

const card: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: 8,
  padding: 10,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const cardHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#cbd5e1" };
const input: React.CSSProperties = { background: "#0f172a", border: "1px solid #334155", borderRadius: 4, color: "#e2e8f0", padding: "4px 6px", fontSize: 12, width: "100%" };
const btn: React.CSSProperties = { background: "#1d4ed8", color: "white", border: "none", borderRadius: 4, padding: "6px 10px", fontSize: 12, cursor: "pointer" };
const btnSmall: React.CSSProperties = { ...btn, padding: "3px 6px", fontSize: 10 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
      {children}
    </label>
  );
}
