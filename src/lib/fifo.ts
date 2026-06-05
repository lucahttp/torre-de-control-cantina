import type { Allocation, Batch, ID, RecipeItem, Sale, SaleItem } from "../types/model";

// ---------- FIFO Engine ----------

export interface FIFOResult {
  allocations: Allocation[];
  missing: { ingredienteId: ID; qtyBase: number }[];
}

/**
 * Allocate `qtyNeeded` of an ingredient across batches using FIFO.
 * Mutates batch.stockRestante. Returns new allocations and any missing qty.
 */
export function allocateFIFO(
  ingredienteId: ID,
  qtyNeeded: number,
  batches: Batch[],
  ctx: { saleId: ID; saleItemId: ID }
): FIFOResult {
  const ordered = [...batches]
    .filter((b) => b.ingredienteId === ingredienteId && b.stockRestante > 0)
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
      ingredienteId,
      batchId: b.id,
      qtyBase: take,
      costArs: take * b.costoUnidadBase,
    });
    remaining -= take;
    i++;
  }

  return {
    allocations,
    missing: remaining > 0 ? [{ ingredienteId, qtyBase: remaining }] : [],
  };
}

/**
 * Compute total qtyBase required for a sale item, accounting for merma.
 */
export function requiredQtyForSaleItem(item: SaleItem, recipeItems: RecipeItem[]): Map<ID, number> {
  const out = new Map<ID, number>();
  for (const r of recipeItems) {
    if (r.productoId !== item.productoId) continue;
    const real = r.cantidad / Math.max(0.0001, 1 - r.mermaPct);
    out.set(r.ingredienteId, (out.get(r.ingredienteId) ?? 0) + real * item.unidades);
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
