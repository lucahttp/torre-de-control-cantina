import type {
  AppData,
  Batch,
  Ingredient,
  Product,
  RecipeItem,
  Sale,
  SaleItem,
  Allocation,
  CostoFijo,
  VariableCosto,
  Personal,
  TaxConfig,
  Settings,
  PlanMensual,
  ID,
} from "../types/model";

const today = () => new Date().toISOString().slice(0, 10);
const yyyymm = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const products: Product[] = [
  { id: "p_sandwich_miga", nombre: "Sándwich de miga", categoria: "Sandwiches", precioVentaDefault: 2500, activo: true },
  { id: "p_pizza_muzza", nombre: "Pizza muzza", categoria: "Pizzas", precioVentaDefault: 3200, activo: true },
  { id: "p_tostado_jq", nombre: "Tostado jamón y queso", categoria: "Tostados", precioVentaDefault: 2800, activo: true },
  { id: "p_desayuno", nombre: "Desayuno (café + tostado)", categoria: "Desayuno", precioVentaDefault: 2200, activo: true },
  { id: "p_gaseosa_500", nombre: "Gaseosa 500ml", categoria: "Bebidas", precioVentaDefault: 1500, activo: true },
  { id: "p_alfajor", nombre: "Alfajor", categoria: "Alfajores_Dulces", precioVentaDefault: 900, activo: true },
  { id: "p_papas", nombre: "Papas fritas", categoria: "Snacks_Salados", precioVentaDefault: 1800, activo: true },
];

const ingredients: Ingredient[] = [
  { id: "i_pan", nombre: "Pan", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_queso", nombre: "Queso", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_jamon", nombre: "Jamón", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_tomate", nombre: "Tomate", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_harina", nombre: "Harina", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_gaseosa", nombre: "Gaseosa", unidadBase: "ml", stockTotal: 0, costoPromedio: 0 },
  { id: "i_alfajor", nombre: "Alfajor (unidad)", unidadBase: "unidad", stockTotal: 0, costoPromedio: 0 },
  { id: "i_papa", nombre: "Papa", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_cafe", nombre: "Café", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_leche", nombre: "Leche", unidadBase: "ml", stockTotal: 0, costoPromedio: 0 },
  { id: "i_muzzarella", nombre: "Muzzarella", unidadBase: "g", stockTotal: 0, costoPromedio: 0 },
  { id: "i_aceite", nombre: "Aceite", unidadBase: "ml", stockTotal: 0, costoPromedio: 0 },
];

const recipeItems: RecipeItem[] = [
  { id: "r1", productoId: "p_sandwich_miga", ingredienteId: "i_pan", cantidad: 120, mermaPct: 0.05 },
  { id: "r2", productoId: "p_sandwich_miga", ingredienteId: "i_jamon", cantidad: 40, mermaPct: 0.05 },
  { id: "r3", productoId: "p_sandwich_miga", ingredienteId: "i_queso", cantidad: 30, mermaPct: 0.05 },
  { id: "r4", productoId: "p_pizza_muzza", ingredienteId: "i_harina", cantidad: 200, mermaPct: 0.08 },
  { id: "r5", productoId: "p_pizza_muzza", ingredienteId: "i_muzzarella", cantidad: 150, mermaPct: 0.05 },
  { id: "r6", productoId: "p_pizza_muzza", ingredienteId: "i_tomate", cantidad: 80, mermaPct: 0.05 },
  { id: "r7", productoId: "p_pizza_muzza", ingredienteId: "i_aceite", cantidad: 15, mermaPct: 0 },
  { id: "r8", productoId: "p_tostado_jq", ingredienteId: "i_pan", cantidad: 80, mermaPct: 0.05 },
  { id: "r9", productoId: "p_tostado_jq", ingredienteId: "i_jamon", cantidad: 50, mermaPct: 0.05 },
  { id: "r10", productoId: "p_tostado_jq", ingredienteId: "i_queso", cantidad: 40, mermaPct: 0.05 },
  { id: "r11", productoId: "p_desayuno", ingredienteId: "i_pan", cantidad: 60, mermaPct: 0.05 },
  { id: "r12", productoId: "p_desayuno", ingredienteId: "i_cafe", cantidad: 10, mermaPct: 0 },
  { id: "r13", productoId: "p_desayuno", ingredienteId: "i_leche", cantidad: 80, mermaPct: 0 },
  { id: "r14", productoId: "p_gaseosa_500", ingredienteId: "i_gaseosa", cantidad: 500, mermaPct: 0 },
  { id: "r15", productoId: "p_alfajor", ingredienteId: "i_alfajor", cantidad: 1, mermaPct: 0 },
  { id: "r16", productoId: "p_papas", ingredienteId: "i_papa", cantidad: 200, mermaPct: 0.15 },
  { id: "r17", productoId: "p_papas", ingredienteId: "i_aceite", cantidad: 20, mermaPct: 0 },
];

const batches: Batch[] = [
  { id: "b_pan_001", ingredienteId: "i_pan", proveedor: "Coto", fechaCompraReal: "2026-05-20", costoTotal: 4500, costoUnidadBase: 0.045, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, fuente: { url: "https://coto.com.ar/pan", fecha: "2026-05-20" } },
  { id: "b_pan_002", ingredienteId: "i_pan", proveedor: "Día", fechaCompraReal: "2026-05-28", costoTotal: 5200, costoUnidadBase: 0.052, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, fuente: { url: "https://dia.com.ar/pan", fecha: "2026-05-28" } },
  { id: "b_queso_001", ingredienteId: "i_queso", proveedor: "Makro", fechaCompraReal: "2026-05-22", costoTotal: 18000, costoUnidadBase: 0.18, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-15" },
  { id: "b_queso_002", ingredienteId: "i_queso", proveedor: "Carrefour", fechaCompraReal: "2026-06-01", costoTotal: 19500, costoUnidadBase: 0.195, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-20" },
  { id: "b_jamon_001", ingredienteId: "i_jamon", proveedor: "Coto", fechaCompraReal: "2026-05-25", costoTotal: 22000, costoUnidadBase: 0.22, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-10" },
  { id: "b_tomate_001", ingredienteId: "i_tomate", proveedor: "Día", fechaCompraReal: "2026-05-30", costoTotal: 8000, costoUnidadBase: 0.08, cantidadInicial: 100000, stockRestante: 100000, isEmergency: true },
  { id: "b_harina_001", ingredienteId: "i_harina", proveedor: "Makro", fechaCompraReal: "2026-05-15", costoTotal: 6000, costoUnidadBase: 0.06, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false },
  { id: "b_gaseosa_001", ingredienteId: "i_gaseosa", proveedor: "Distribuidora", fechaCompraReal: "2026-05-29", costoTotal: 900, costoUnidadBase: 1.8, cantidadInicial: 50000, stockRestante: 50000, isEmergency: false, vencimiento: "2026-09-01" },
  { id: "b_alfajor_001", ingredienteId: "i_alfajor", proveedor: "Mayorista Golosinas", fechaCompraReal: "2026-05-26", costoTotal: 24000, costoUnidadBase: 600, cantidadInicial: 40, stockRestante: 40, isEmergency: false },
  { id: "b_papa_001", ingredienteId: "i_papa", proveedor: "Día", fechaCompraReal: "2026-05-31", costoTotal: 4500, costoUnidadBase: 0.045, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false },
  { id: "b_cafe_001", ingredienteId: "i_cafe", proveedor: "Coto", fechaCompraReal: "2026-05-10", costoTotal: 12000, costoUnidadBase: 1.2, cantidadInicial: 10000, stockRestante: 10000, isEmergency: false },
  { id: "b_leche_001", ingredienteId: "i_leche", proveedor: "Día", fechaCompraReal: "2026-06-01", costoTotal: 6000, costoUnidadBase: 0.06, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-10" },
  { id: "b_muzzarella_001", ingredienteId: "i_muzzarella", proveedor: "Makro", fechaCompraReal: "2026-05-22", costoTotal: 20000, costoUnidadBase: 0.2, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-18" },
  { id: "b_aceite_001", ingredienteId: "i_aceite", proveedor: "Coto", fechaCompraReal: "2026-05-05", costoTotal: 9000, costoUnidadBase: 0.09, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false },
];

function buildSales(): { sales: Sale[]; allocations: Allocation[] } {
  const sales: Sale[] = [];
  const allocations: Allocation[] = [];
  const baseDate = today();
  const itm = (id: string, productoId: ID, unidades: number, precio: number): SaleItem => ({
    id,
    productoId,
    unidades,
    precioUnitario: precio,
    importe: unidades * precio,
  });
  const mk = (id: string, items: SaleItem[]): Sale => {
    const total = items.reduce((s, it) => s + it.importe, 0);
    return { id, fecha: baseDate, alumnoPresentes: 350, items, total, status: "OK" };
  };
  sales.push(mk("s_001", [itm("si_001", "p_sandwich_miga", 30, 2500)]));
  sales.push(mk("s_002", [itm("si_002", "p_tostado_jq", 18, 2800)]));
  sales.push(mk("s_003", [itm("si_003", "p_pizza_muzza", 12, 3200)]));
  sales.push(mk("s_004", [itm("si_004", "p_desayuno", 25, 2200)]));
  sales.push(mk("s_005", [itm("si_005", "p_gaseosa_500", 40, 1500)]));
  sales.push(mk("s_006", [itm("si_006", "p_alfajor", 50, 900)]));
  sales.push(mk("s_007", [itm("si_007", "p_papas", 15, 1800)]));

  const allocFor = (saleId: string, saleItemId: string, ingredienteId: string, batchId: string, qty: number) => {
    const batch = batches.find((b) => b.id === batchId)!;
    allocations.push({
      id: `a_${saleId}_${ingredienteId}_${batchId}`,
      saleId,
      saleItemId,
      ingredienteId,
      batchId,
      qtyBase: qty,
      costArs: qty * batch.costoUnidadBase,
    });
    batch.stockRestante -= qty;
  };

  allocFor("s_001", "si_001", "i_pan", "b_pan_001", 3600);
  allocFor("s_001", "si_001", "i_jamon", "b_jamon_001", 1200);
  allocFor("s_001", "si_001", "i_queso", "b_queso_001", 900);
  allocFor("s_002", "si_002", "i_pan", "b_pan_001", 1440);
  allocFor("s_002", "si_002", "i_jamon", "b_jamon_001", 900);
  allocFor("s_002", "si_002", "i_queso", "b_queso_001", 720);
  allocFor("s_003", "si_003", "i_harina", "b_harina_001", 2400);
  allocFor("s_003", "si_003", "i_muzzarella", "b_muzzarella_001", 1800);
  allocFor("s_003", "si_003", "i_tomate", "b_tomate_001", 960);
  allocFor("s_003", "si_003", "i_aceite", "b_aceite_001", 180);
  allocFor("s_004", "si_004", "i_pan", "b_pan_001", 1500);
  allocFor("s_004", "si_004", "i_cafe", "b_cafe_001", 250);
  allocFor("s_004", "si_004", "i_leche", "b_leche_001", 2000);
  allocFor("s_005", "si_005", "i_gaseosa", "b_gaseosa_001", 20000);
  allocFor("s_006", "si_006", "i_alfajor", "b_alfajor_001", 50);
  allocFor("s_007", "si_007", "i_papa", "b_papa_001", 3000);
  allocFor("s_007", "si_007", "i_aceite", "b_aceite_001", 300);

  return { sales, allocations };
}

const builtSales = buildSales();

const variableCostos: VariableCosto[] = [
  { id: "vc_mp", nombre: "MercadoPago %", tipo: "porcentaje", valor: 0.05, base: "venta" },
  { id: "vc_tarjeta", nombre: "Tarjeta %", tipo: "porcentaje", valor: 0.03, base: "venta" },
  { id: "vc_imp", nombre: "Impuestos %", tipo: "porcentaje", valor: 0.03, base: "venta" },
  { id: "vc_pack", nombre: "Packaging", tipo: "por_unidad", valor: 80, base: "venta" },
];

const costosFijos: CostoFijo[] = [
  { id: "cf_canon", nombre: "Canon cantina", montoMensual: 350000 },
  { id: "cf_servicios", nombre: "Servicios (luz, gas, agua)", montoMensual: 120000 },
  { id: "cf_contador", nombre: "Contador", montoMensual: 80000 },
  { id: "cf_seguro", nombre: "Seguro", montoMensual: 25000 },
  { id: "cf_otros", nombre: "Otros", montoMensual: 40000 },
];

const personal: Personal[] = [
  { id: "pe_1", nombre: "Carla (cocinera)", tipo: "monotributista", costoMensual: 420000 },
  { id: "pe_2", nombre: "Mario (cajero)", tipo: "monotributista", costoMensual: 380000 },
  { id: "pe_3", nombre: "Lucía (ayudante)", tipo: "relacion_dependencia", costoMensual: 520000 },
];

const tax: TaxConfig = {
  regimen: "Monotributo",
  categoria: "H",
  cuotaMensual: 32105,
  alertaTope: false,
};

const settings: Settings = {
  moneda: "ARS",
  ivaIncluido: true,
  inflacionMensual: 0.045,
  fechaInicio: "2026-06-01",
};

const plan: PlanMensual = {
  id: "plan_202606",
  mes: yyyymm(),
  alumnosTotales: 380,
  maxUnidadesPorAlumno: 1.2,
  tasaConversion: 0.55,
  diasOperativos: 20,
  ticketPromedio: 2100,
  mix: {
    p_sandwich_miga: 0.28,
    p_pizza_muzza: 0.12,
    p_tostado_jq: 0.16,
    p_desayuno: 0.18,
    p_gaseosa_500: 0.16,
    p_alfajor: 0.06,
    p_papas: 0.04,
  },
  pesos: { plan: 0.4, ayer: 0.15, mismoDiaSemanaPasada: 0.2, mismoDiaMesPasado: 0.1, mediaMovil7: 0.15 },
};

export const demoData: AppData = {
  users: [
    { id: "u_admin", name: "Lucas (Admin)", role: "ADMIN" },
    { id: "u_caja", name: "Caja", role: "POS" },
    { id: "u_cocina", name: "Cocina", role: "COCINA" },
    { id: "u_stock", name: "Stock", role: "STOCK" },
  ],
  products,
  ingredients,
  recipeItems,
  batches,
  movements: [],
  sales: builtSales.sales,
  allocations: builtSales.allocations,
  notifications: [
    {
      id: "n_1",
      fecha: today(),
      nivel: "info",
      titulo: "Demo cargada",
      mensaje: `${builtSales.sales.length} ventas, ${batches.length} lotes, ${builtSales.allocations.length} allocations`,
      leida: false,
    },
  ],
  plans: [plan],
  planItems: [],
  overrides: [],
  variableCostos,
  costosFijos,
  personal,
  tax,
  settings,
};
