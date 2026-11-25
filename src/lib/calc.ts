import type {
  Allocation,
  AppData,
  CostoFijo,
  Personal,
  PlanMensual,
  Product,
  Sale,
  VariableCosto,
} from "../types/model";

// ---------- Formatters ----------

export const fmtARS = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const fmtInt = (n: number) => Math.round(n).toLocaleString("es-AR");

// ---------- Product costing (v2: multi-level BOM) ----------

/**
 * Costo promedio de un producto. En v2 un producto es leaf si no tiene receta.
 * Si es leaf, devolvemos su costoPromedio. Si no, sumamos recursivamente.
 * El costoPromedio de un producto leaf se calcula como Σ(lote.costototal) /
 * Σ(lote.cantidadinicial) sobre sus batches — esa fórmula vive en la UI,
 * acá recibimos el mapa.
 */
export function productCost(
  productId: string,
  recipeItems: { productoId: string; componenteId: string; cantidad: number; mermaPct: number }[],
  productCostById: Map<string, number>,
  _visited: Set<string> = new Set()
): number {
  if (_visited.has(productId)) return 0;
  const visited = new Set(_visited);
  visited.add(productId);

  const recipe = recipeItems.filter((r) => r.productoId === productId);
  if (recipe.length === 0) {
    return productCostById.get(productId) ?? 0;
  }
  return recipe.reduce((s, r) => {
    const childCost = productCost(r.componenteId, recipeItems, productCostById, visited);
    return s + r.cantidad * childCost * (1 + (r.mermaPct || 0));
  }, 0);
}

export function productMargin(
  productId: string,
  precioVentaDefault: number,
  recipeItems: Parameters<typeof productCost>[1],
  productCostById: Map<string, number>
): { cost: number; margin: number; marginPct: number } {
  const cost = productCost(productId, recipeItems, productCostById);
  const margin = precioVentaDefault - cost;
  const marginPct = precioVentaDefault > 0 ? margin / precioVentaDefault : 0;
  return { cost, margin, marginPct };
}

/**
 * Helper: dado un array de productos y sus batches, devuelve un Map
 * productId -> costoPromedio (para los leaf del BOM).
 */
export function computeProductCostMap(
  products: { id: string }[],
  batches: { productoId: string; costoTotal: number; cantidadInicial: number }[]
): Map<string, number> {
  const totals = new Map<string, { costo: number; qty: number }>();
  for (const b of batches) {
    const acc = totals.get(b.productoId) ?? { costo: 0, qty: 0 };
    acc.costo += b.costoTotal;
    acc.qty += b.cantidadInicial;
    totals.set(b.productoId, acc);
  }
  const out = new Map<string, number>();
  for (const p of products) {
    const t = totals.get(p.id);
    out.set(p.id, t && t.qty > 0 ? t.costo / t.qty : 0);
  }
  return out;
}

// ---------- Sales aggregations ----------

export function totalSales(sales: Sale[]): number {
  return sales.reduce((s, sale) => s + sale.total, 0);
}

export function totalUnits(sales: Sale[]): number {
  return sales.reduce((s, sale) => s + sale.items.reduce((x, it) => x + it.unidades, 0), 0);
}

export function cogsFromAllocations(allocations: Allocation[]): number {
  return allocations.reduce((s, a) => s + a.costArs, 0);
}

// ---------- Variable cost ----------

export function totalVariableCost(sales: Sale[], variableCostos: VariableCosto[]): number {
  const totalVentas = totalSales(sales);
  const totalUnidades = totalUnits(sales);
  let acc = 0;
  for (const v of variableCostos) {
    if (v.tipo === "porcentaje") {
      const base = v.base === "venta" ? totalVentas : cogsFromAllocationsSales(sales);
      acc += base * v.valor;
    } else {
      acc += v.valor * totalUnidades;
    }
  }
  return acc;
}

function cogsFromAllocationsSales(_sales: Sale[]): number {
  return 0; // simplified: MP% is applied on ventas
}

// ---------- Fixed + personal ----------

export function totalFijos(costosFijos: CostoFijo[]): number {
  return costosFijos.reduce((s, c) => s + c.montoMensual, 0);
}

export function totalPersonal(personal: Personal[]): number {
  return personal.reduce((s, p) => s + p.costoMensual, 0);
}

// ---------- Forecast ----------

export interface ForecastResult {
  capacidad: number;
  unidadesPorProducto: { productoId: string; unidades: number; ingresos: number }[];
  ingresosTotales: number;
  unidadesTotales: number;
}

export function forecastFromPlan(plan: PlanMensual, products: Product[]): ForecastResult {
  const capacidad =
    plan.alumnosTotales * plan.maxUnidadesPorAlumno * plan.tasaConversion * plan.diasOperativos;
  const total = products.reduce((s, p) => s + (plan.mix[p.id] ?? 0), 0) || 1;
  const out = products.map((p) => {
    const share = (plan.mix[p.id] ?? 0) / total;
    const unidades = capacidad * share;
    const ingresos = unidades * p.precioVentaDefault;
    return { productoId: p.id, unidades, ingresos };
  });
  return {
    capacidad,
    unidadesPorProducto: out,
    ingresosTotales: out.reduce((s, x) => s + x.ingresos, 0),
    unidadesTotales: capacidad,
  };
}

// ---------- Variance ----------

export interface VarianceResult {
  ingresos: { plan: number; real: number; delta: number };
  unidades: { plan: number; real: number; delta: number };
  cogs: { plan: number; real: number; delta: number };
  margen: { plan: number; real: number; delta: number };
}

export function computeVariance(
  app: AppData,
  forecastIngresos: number,
  forecastUnidades: number,
  forecastCogs: number
): VarianceResult {
  const realIngresos = totalSales(app.sales);
  const realUnidades = totalUnits(app.sales);
  const realCogs = cogsFromAllocations(app.allocations);
  const planMargen = forecastIngresos - forecastCogs;
  const realMargen = realIngresos - realCogs;
  return {
    ingresos: { plan: forecastIngresos, real: realIngresos, delta: realIngresos - forecastIngresos },
    unidades: { plan: forecastUnidades, real: realUnidades, delta: realUnidades - forecastUnidades },
    cogs: { plan: forecastCogs, real: realCogs, delta: realCogs - forecastCogs },
    margen: { plan: planMargen, real: realMargen, delta: realMargen - planMargen },
  };
}

// ---------- Punto de equilibrio ----------

export function breakEvenUnits(app: AppData, forecastIngresos: number, forecastCogs: number): {
  fijos: number;
  margenContribucionPct: number;
  unidadesMes: number;
  unidadesDia: number;
  ventasMes: number;
} {
  const fijos = totalFijos(app.costosFijos) + totalPersonal(app.personal) + app.tax.cuotaMensual;
  const margenAbs = Math.max(0.0001, forecastIngresos - forecastCogs);
  const margenPct = margenAbs / Math.max(0.0001, forecastIngresos);
  const ticketPromedio = forecastIngresos / Math.max(1, totalUnits(app.sales));
  const unidadesMes = fijos / Math.max(0.0001, margenPct) / Math.max(1, ticketPromedio);
  const plan = app.plans[0];
  const dias = plan?.diasOperativos ?? 20;
  return {
    fijos,
    margenContribucionPct: margenPct,
    unidadesMes,
    unidadesDia: unidadesMes / dias,
    ventasMes: unidadesMes * ticketPromedio,
  };
}
