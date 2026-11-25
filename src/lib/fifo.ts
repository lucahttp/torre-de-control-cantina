import type { Allocation, Batch, ID, Product, RecipeItem, Sale, SaleItem } from "../types/model";

// ---------- FIFO Engine (v2: multi-level BOM explosion) ----------

export interface FIFOResult {
  allocations: Allocation[];
  missing: { productoId: ID; qtyBase: number }[];
}

/**
 * Allocate `qtyNeeded` of a product across its batches using FIFO.
 * Mutates batch.stockRestante. Returns new allocations and any missing qty.
 * In v2, "product" replaces "ingredient" — the same function is used for
 * direct products (alfajor), bottle-style products (gaseosa 1.5L) y
 * raw materials (harina).
 */
export function allocateFIFO(
  productoId: ID,
  qtyNeeded: number,
  batches: Batch[],
  ctx: { saleId: ID; saleItemId: ID }
): FIFOResult {
  const ordered = [...batches]
    .filter((b) => b.productoId === productoId && b.stockRestante > 0)
    .sort((a, b) => a.fechaCompraReal.localeCompare(b.fechaCompraReal) || a.id.localeCompare(b.id));

  const allocations: Allocation[] = [];
  let remaining = qtyNeeded;
  let i = 0;

  while (remaining > 0 && i < ordered.length) {
    const b = ordered[i];
    const take = Math.min(remaining, b.stockRestante);
    b.stockRestante -= take;
    allocations.push({
      id: `a_${ctx.saleId}_${ctx.saleItemId}_${b.id}_${i}`,
      saleId: ctx.saleId,
      saleItemId: ctx.saleItemId,
      ingredienteId: b.productoId, // v2: campo conservado por compat con trazabilidad
      batchId: b.id,
      qtyBase: take,
      costArs: take * b.costoUnidadBase,
    });
    remaining -= take;
    i++;
  }

  return {
    allocations,
    missing: remaining > 0 ? [{ productoId, qtyBase: remaining }] : [],
  };
}

/**
 * Multi-level BOM explosion + FIFO allocation.
 * Recorre recursivamente la receta de un producto. Si tiene líneas, multiplica
 * por (cantidad × (1 + merma)) y recursa sobre cada componente. Si no tiene
 * receta, es hoja del BOM y consume batches propios.
 *
 * Soporta los 3 casos:
 *  - directo: producto sin receta → consume batches del producto.
 *  - compuesto: producto con receta de sub-productos/insumos → recursa.
 *  - fraccionado: línea con cantidad < 1 apuntando a una botella → consume
 *    una fracción de botella (1 vaso = 1/6 botella = cantidad 0.166).
 */
export function explodeAndAllocate(
  productoId: ID,
  unidades: number,
  ctx: { saleId: ID; saleItemId: ID },
  products: Product[],
  recipeItems: RecipeItem[],
  batches: Batch[],
  _visited: Set<ID> = new Set()
): FIFOResult {
  // Detección de ciclos
  if (_visited.has(productoId)) {
    return { allocations: [], missing: [{ productoId, qtyBase: unidades }] };
  }
  const visited = new Set(_visited);
  visited.add(productoId);

  const recipe = recipeItems.filter((r) => r.productoId === productoId);
  if (recipe.length === 0) {
    return allocateFIFO(productoId, unidades, batches, ctx);
  }

  const allAllocs: Allocation[] = [];
  const allMissing: { productoId: ID; qtyBase: number }[] = [];
  for (const line of recipe) {
    const needed = unidades * line.cantidad * (1 + (line.mermaPct || 0));
    const r = explodeAndAllocate(line.componenteId, needed, ctx, products, recipeItems, batches, visited);
    allAllocs.push(...r.allocations);
    allMissing.push(...r.missing);
  }
  return { allocations: allAllocs, missing: allMissing };
}

/**
 * Compute total qtyBase required for a sale item, accounting for merma
 * recursively. Returns a map of leaf-product-id -> qty in its unidadBase.
 * Useful for showing "what stock will this sale touch" before committing.
 */
export function requiredQtyForSaleItem(
  item: SaleItem,
  products: Product[],
  recipeItems: RecipeItem[],
  _visited: Set<ID> = new Set()
): Map<ID, number> {
  const out = new Map<ID, number>();
  if (_visited.has(item.productoId)) return out;
  const visited = new Set(_visited);
  visited.add(item.productoId);

  const recipe = recipeItems.filter((r) => r.productoId === item.productoId);
  if (recipe.length === 0) {
    out.set(item.productoId, (out.get(item.productoId) ?? 0) + item.unidades);
    return out;
  }
  for (const r of recipe) {
    const real = (r.cantidad * (1 + (r.mermaPct || 0))) / Math.max(0.0001, 1);
    const child: SaleItem = { ...item, productoId: r.componenteId, unidades: item.unidades * r.cantidad * (1 + (r.mermaPct || 0)) };
    void real;
    const sub = requiredQtyForSaleItem(child, products, recipeItems, visited);
    sub.forEach((qty, k) => out.set(k, (out.get(k) ?? 0) + qty));
  }
  return out;
}

/**
 * Cost a sale from its allocations (sum of costArs).
 */
export function saleCOGS(sale: Sale, allocations: Allocation[]): number {
  return allocations
    .filter((a) => a.saleId === sale.id)
    .reduce((s, a) => s + a.costArs, 0);
}

/**
 * Reverse (rollback) all allocations for a given sale — restores batch stock.
 */
export function rollbackAllocations(sale: Sale, allocations: Allocation[], batches: Batch[]) {
  for (const a of allocations) {
    if (a.saleId !== sale.id) continue;
    const b = batches.find((x) => x.id === a.batchId);
    if (b) b.stockRestante += a.qtyBase;
  }
}
