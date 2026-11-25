import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppData, ID, Product, RecipeItem, Sale, SaleItem, Allocation } from "../types/model";
import { demoData } from "../data/demo";
import { totemProductos, totemPedidos, TC_CAT_TO_CATEGORIA } from "../data/totem";
import { explodeAndAllocate } from "../lib/fifo";

type ViewMode = "operacion" | "trazabilidad" | "finanzas" | "forecast" | "catalogo";

interface AppState {
  data: AppData;
  selectedEntity: { type: string; id: ID } | null;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  selectEntity: (e: AppState["selectedEntity"]) => void;
  resetDemo: () => void;
  importData: (d: AppData) => void;
  exportData: () => AppData;
  // catalog: productos admin-only (los del totem se sincronizan via syncTotemProductos)
  addProduct: (p: Omit<Product, "id">) => ID;
  updateProduct: (id: ID, patch: Partial<Product>) => void;
  deleteProduct: (id: ID) => void;
  addRecipeItem: (r: Omit<RecipeItem, "id">) => ID;
  updateRecipeItem: (id: ID, patch: Partial<RecipeItem>) => void;
  deleteRecipeItem: (id: ID) => void;
  // v2: sync con totem
  syncTotemProductos: () => number;
  syncTotemPedidos: () => { imported: number; skipped: number };
}

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      data: demoData,
      selectedEntity: null,
      viewMode: "operacion",
      setViewMode: (m) => set({ viewMode: m }),
      selectEntity: (e) => set({ selectedEntity: e }),
      resetDemo: () => set({ data: demoData, selectedEntity: null }),
      importData: (d) => set({ data: d }),
      exportData: () => get().data,

      addProduct: (p) => {
        const id = newId("p");
        set((s) => ({ data: { ...s.data, products: [...s.data.products, { ...p, id }] } }));
        return id;
      },
      updateProduct: (id, patch) => {
        set((s) => ({
          data: {
            ...s.data,
            products: s.data.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        }));
      },
      deleteProduct: (id) => {
        set((s) => ({
          data: {
            ...s.data,
            products: s.data.products.filter((p) => p.id !== id),
            recipeItems: s.data.recipeItems.filter((r) => r.productoId !== id && r.componenteId !== id),
          },
        }));
      },
      addRecipeItem: (r) => {
        const id = newId("r");
        set((s) => ({ data: { ...s.data, recipeItems: [...s.data.recipeItems, { ...r, id }] } }));
        return id;
      },
      updateRecipeItem: (id, patch) => {
        set((s) => ({
          data: {
            ...s.data,
            recipeItems: s.data.recipeItems.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          },
        }));
      },
      deleteRecipeItem: (id) => {
        set((s) => ({ data: { ...s.data, recipeItems: s.data.recipeItems.filter((r) => r.id !== id) } }));
      },

      // v2: importa productos del totem como Products. Upsert por tcProductoId.
      syncTotemProductos: () => {
        const state = get();
        const updated = state.data.products.map((p) => {
          if (!p.tcProductoId) return p;
          const tp = totemProductos.find((t) => t.tc_productoid === p.tcProductoId);
          if (!tp) return p;
          return {
            ...p,
            nombre: tp.tc_name,
            precioVentaDefault: tp.tc_precio,
            activo: tp.tc_disponible,
            tcCategoria: tp.tc_categoria,
            categoria: TC_CAT_TO_CATEGORIA[tp.tc_categoria],
          };
        });
        const existingIds = new Set(updated.map((p) => p.tcProductoId).filter(Boolean));
        const toAdd: Product[] = totemProductos
          .filter((tp) => !existingIds.has(tp.tc_productoid))
          .map((tp) => ({
            id: newId("p"),
            nombre: tp.tc_name,
            precioVentaDefault: tp.tc_precio,
            activo: tp.tc_disponible,
            tcCategoria: tp.tc_categoria,
            tcProductoId: tp.tc_productoid,
            categoria: TC_CAT_TO_CATEGORIA[tp.tc_categoria],
            unidadBase: "unidad",
            esInsumoBase: false,
          }));
        set({ data: { ...state.data, products: [...updated, ...toAdd] } });
        return toAdd.length;
      },

      // v2: importa pedidos PAGADOS del totem. Por cada item, hace explosion BOM
      // multi-nivel y crea Allocation rows. Si una hoja no tiene stock suficiente,
      // la venta queda como NEEDS_STOCK.
      syncTotemPedidos: () => {
        const state = get();
        const { products, recipeItems, batches, sales, notifications } = state.data;
        const alreadyImported = new Set(sales.filter((s) => s.id.startsWith("ped_")).map((s) => s.id));
        const newSales: Sale[] = [];
        const newAllocs: Allocation[] = [];
        let imported = 0;
        let skipped = 0;
        let needsStock = 0;

        for (const tp of totemPedidos) {
          if (tp.tc_estado !== 100000001) {
            skipped += 1;
            continue;
          }
          const saleId = `ped_${tp.tc_pedidoid}`;
          if (alreadyImported.has(saleId)) {
            skipped += 1;
            continue;
          }
          let carrito: Array<{ productoId: string; nombre: string; precio: number; qty: number; subtotal: number }>;
          try {
            carrito = JSON.parse(tp.tc_items);
          } catch {
            skipped += 1;
            continue;
          }
          const saleItems: SaleItem[] = [];
          const saleAllocs: Allocation[] = [];
          let missing = 0;
          for (let k = 0; k < carrito.length; k++) {
            const it = carrito[k];
            const product = products.find((p) => p.tcProductoId === it.productoId);
            if (!product) {
              missing += 1;
              continue;
            }
            const saleItemId = `${saleId}_si_${k}`;
            saleItems.push({
              id: saleItemId,
              productoId: product.id,
              unidades: it.qty,
              precioUnitario: it.precio,
              importe: it.subtotal,
            });
            const r = explodeAndAllocate(
              product.id,
              it.qty,
              { saleId, saleItemId },
              products,
              recipeItems,
              batches
            );
            saleAllocs.push(...r.allocations);
            missing += r.missing.length;
          }
          const total = saleItems.reduce((s, it) => s + it.importe, 0);
          const status: Sale["status"] = missing > 0 ? "NEEDS_STOCK" : "OK";
          if (status === "NEEDS_STOCK") needsStock += 1;
          newSales.push({
            id: saleId,
            fecha: tp.tc_fechacreacion,
            alumnoPresentes: 1,
            items: saleItems,
            total,
            status,
          });
          newAllocs.push(...saleAllocs);
          imported += 1;
        }
        if (newSales.length > 0) {
          set({
            data: {
              ...state.data,
              sales: [...sales, ...newSales],
              allocations: [...state.data.allocations, ...newAllocs],
              notifications: [
                ...notifications,
                {
                  id: newId("n"),
                  fecha: new Date().toISOString().slice(0, 10),
                  nivel: needsStock > 0 ? "warning" : "info",
                  titulo: needsStock > 0
                    ? `Totem: ${imported} pedido(s) importado(s) - ${needsStock} con stock faltante`
                    : `Totem: ${imported} pedido(s) importado(s)`,
                  mensaje: `${newAllocs.length} allocations FIFO.` + (skipped > 0 ? ` ${skipped} saltados.` : ""),
                  leida: false,
                },
              ],
            },
          });
        }
        return { imported, skipped };
      },
    }),
    { name: "cantina-graph-os" }
  )
);
