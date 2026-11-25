import type {
  AppData,
  Batch,
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

// ---------- Productos v2 ----------
// v2: todo es Product. Los "antiguos ingredientes" (harina, queso, etc) son
// Products con categoria=Otros, esInsumoBase=true, tcCategoria=Insumo.
const products: Product[] = [
  // Venta directa al alumno (los sincronizados del totem + fraccionados)
  { id: "p_sandwich_miga", nombre: "Sandwich de miga", categoria: "Sandwiches", precioVentaDefault: 2500, activo: true, unidadBase: "unidad", esInsumoBase: false, tcCategoria: 100000002, tcProductoId: "tpc-0001" },
  { id: "p_tostado_jq", nombre: "Tostado jamon y queso", categoria: "Tostados", precioVentaDefault: 2800, activo: true, unidadBase: "unidad", esInsumoBase: false, tcCategoria: 100000002, tcProductoId: "tpc-0002" },
  { id: "p_pizza_muzza", nombre: "Pizza muzza", categoria: "Pizzas", precioVentaDefault: 3200, activo: true, unidadBase: "unidad", esInsumoBase: false, tcCategoria: 100000002, tcProductoId: "tpc-0003" },
  { id: "p_desayuno", nombre: "Desayuno (cafe + tostado)", categoria: "Desayuno", precioVentaDefault: 2200, activo: true, unidadBase: "unidad", esInsumoBase: false, tcCategoria: 100000002, tcProductoId: "tpc-0004" },
  // Gaseosa: dos productos, uno fraccionado y uno entero. Ambos usan el mismo lote fisico de botellas.
  { id: "p_gaseosa_botella", nombre: "Gaseosa botella 1.5L", categoria: "Bebidas", precioVentaDefault: 3500, activo: true, unidadBase: "botella", esInsumoBase: false, tcCategoria: 100000000, tcProductoId: "tpc-9999" },
  { id: "p_vaso_gaseosa", nombre: "Vaso de gaseosa", categoria: "Bebidas", precioVentaDefault: 800, activo: true, unidadBase: "vaso", esInsumoBase: false, tcCategoria: 100000000, tcProductoId: "tpc-9998" },
  { id: "p_alfajor", nombre: "Alfajor", categoria: "Alfajores_Dulces", precioVentaDefault: 900, activo: true, unidadBase: "unidad", esInsumoBase: false, tcCategoria: 100000003, tcProductoId: "tpp-0001" },
  { id: "p_papas", nombre: "Papas fritas", categoria: "Snacks_Salados", precioVentaDefault: 1800, activo: true, unidadBase: "unidad", esInsumoBase: false, tcCategoria: 100000001, tcProductoId: "tps-0001" },
  // Menu polenta: producto compuesto, sub-recetas anidadas
  { id: "p_menu_polenta", nombre: "Menu polenta", categoria: "Sandwiches", precioVentaDefault: 4500, activo: true, unidadBase: "porcion", esInsumoBase: false, tcCategoria: 100000002, tcProductoId: "tpc-0005" },
  { id: "p_salsa_tomate", nombre: "Salsa de tomate", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "kg", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "p_masa_pizza", nombre: "Masa de pizza", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "kg", esInsumoBase: true, tcCategoria: 100000004 },

  // Insumos base (materia prima + envases). Antes eran "Ingredient".
  { id: "i_pan", nombre: "Pan", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_queso", nombre: "Queso", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_jamon", nombre: "Jamon", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_tomate", nombre: "Tomate", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_harina", nombre: "Harina", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_gaseosa_botella", nombre: "Gaseosa (envase 1.5L)", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "botella", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_alfajor", nombre: "Alfajor (unidad)", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "unidad", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_papa", nombre: "Papa", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_cafe", nombre: "Cafe", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_leche", nombre: "Leche", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "ml", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_muzzarella", nombre: "Muzzarella", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_aceite", nombre: "Aceite", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "ml", esInsumoBase: true, tcCategoria: 100000004 },
  { id: "i_polenta", nombre: "Polenta", categoria: "Otros", precioVentaDefault: 0, activo: true, unidadBase: "g", esInsumoBase: true, tcCategoria: 100000004 },
];

// ---------- Recetas v2 ----------
// componenteId apunta a otro Product. cantidad<1 = fraccionado (vaso=0.166 botella).
// Recetas multinivel: menu_polenta -> {polenta, queso, salsa} y salsa -> {tomate, aceite}.
const recipeItems: RecipeItem[] = [
  // Sandwich miga
  { id: "r1", productoId: "p_sandwich_miga", componenteId: "i_pan", cantidad: 120, mermaPct: 0.05 },
  { id: "r2", productoId: "p_sandwich_miga", componenteId: "i_jamon", cantidad: 40, mermaPct: 0.05 },
  { id: "r3", productoId: "p_sandwich_miga", componenteId: "i_queso", cantidad: 30, mermaPct: 0.05 },
  // Pizza muzza (usa sub-receta masa_pizza)
  { id: "r4", productoId: "p_pizza_muzza", componenteId: "p_masa_pizza", cantidad: 0.3, mermaPct: 0.05 },
  { id: "r5", productoId: "p_pizza_muzza", componenteId: "i_muzzarella", cantidad: 150, mermaPct: 0.05 },
  { id: "r6", productoId: "p_pizza_muzza", componenteId: "p_salsa_tomate", cantidad: 0.08, mermaPct: 0.05 },
  // Masa de pizza (sub-receta)
  { id: "r_sub_masa", productoId: "p_masa_pizza", componenteId: "i_harina", cantidad: 500, mermaPct: 0.02 },
  // Salsa de tomate (sub-receta)
  { id: "r_sub_tomate", productoId: "p_salsa_tomate", componenteId: "i_tomate", cantidad: 600, mermaPct: 0.1 },
  { id: "r_sub_aceite", productoId: "p_salsa_tomate", componenteId: "i_aceite", cantidad: 50, mermaPct: 0 },
  // Tostado
  { id: "r7", productoId: "p_tostado_jq", componenteId: "i_pan", cantidad: 80, mermaPct: 0.05 },
  { id: "r8", productoId: "p_tostado_jq", componenteId: "i_jamon", cantidad: 50, mermaPct: 0.05 },
  { id: "r9", productoId: "p_tostado_jq", componenteId: "i_queso", cantidad: 40, mermaPct: 0.05 },
  // Desayuno
  { id: "r10", productoId: "p_desayuno", componenteId: "i_pan", cantidad: 60, mermaPct: 0.05 },
  { id: "r11", productoId: "p_desayuno", componenteId: "i_cafe", cantidad: 10, mermaPct: 0 },
  { id: "r12", productoId: "p_desayuno", componenteId: "i_leche", cantidad: 80, mermaPct: 0 },
  // Gaseosa botella (directo: 1 unidad = 1 botella)
  { id: "r_g_botella", productoId: "p_gaseosa_botella", componenteId: "i_gaseosa_botella", cantidad: 1, mermaPct: 0, nota: "1 botella = 1 unidad de venta" },
  // Vaso de gaseosa (fraccionado: 1 vaso = 1/6 botella)
  { id: "r_g_vaso", productoId: "p_vaso_gaseosa", componenteId: "i_gaseosa_botella", cantidad: 0.166, mermaPct: 0, nota: "1 botella rinde 6 vasos" },
  // Alfajor (directo: sin receta, no aparece aca)
  // Papas
  { id: "r16", productoId: "p_papas", componenteId: "i_papa", cantidad: 200, mermaPct: 0.15 },
  { id: "r17", productoId: "p_papas", componenteId: "i_aceite", cantidad: 20, mermaPct: 0 },
  // Menu polenta (compuesto multinivel)
  { id: "r_mp_polenta", productoId: "p_menu_polenta", componenteId: "i_polenta", cantidad: 200, mermaPct: 0.05 },
  { id: "r_mp_queso", productoId: "p_menu_polenta", componenteId: "i_queso", cantidad: 30, mermaPct: 0.03 },
  { id: "r_mp_salsa", productoId: "p_menu_polenta", componenteId: "p_salsa_tomate", cantidad: 80, mermaPct: 0.05 },
];

// ---------- Lotes v2 ----------
// productoId FK a Product. Para "i_gaseosa_botella" el lote son botellas (stockRestante en botellas).
const batches: Batch[] = [
  { id: "b_pan_001", productoId: "i_pan", proveedor: "Coto", fechaCompraReal: "2026-05-20", costoTotal: 4500, costoUnidadBase: 0.045, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, fuente: { url: "https://coto.com.ar/pan", fecha: "2026-05-20" } },
  { id: "b_pan_002", productoId: "i_pan", proveedor: "Dia", fechaCompraReal: "2026-05-28", costoTotal: 5200, costoUnidadBase: 0.052, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, fuente: { url: "https://dia.com.ar/pan", fecha: "2026-05-28" } },
  { id: "b_queso_001", productoId: "i_queso", proveedor: "Makro", fechaCompraReal: "2026-05-22", costoTotal: 18000, costoUnidadBase: 0.18, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-15" },
  { id: "b_queso_002", productoId: "i_queso", proveedor: "Carrefour", fechaCompraReal: "2026-06-01", costoTotal: 19500, costoUnidadBase: 0.195, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-20" },
  { id: "b_jamon_001", productoId: "i_jamon", proveedor: "Coto", fechaCompraReal: "2026-05-25", costoTotal: 22000, costoUnidadBase: 0.22, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-10" },
  { id: "b_tomate_001", productoId: "i_tomate", proveedor: "Dia", fechaCompraReal: "2026-05-30", costoTotal: 8000, costoUnidadBase: 0.08, cantidadInicial: 100000, stockRestante: 100000, isEmergency: true },
  { id: "b_harina_001", productoId: "i_harina", proveedor: "Makro", fechaCompraReal: "2026-05-15", costoTotal: 6000, costoUnidadBase: 0.06, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false },
  // Lote de botellas: stockRestante en botellas. Costo por botella $2500.
  { id: "b_gaseosa_botella_001", productoId: "i_gaseosa_botella", proveedor: "Distribuidora", fechaCompraReal: "2026-05-29", costoTotal: 250000, costoUnidadBase: 2500, cantidadInicial: 100, stockRestante: 100, isEmergency: false, vencimiento: "2026-09-01" },
  { id: "b_alfajor_001", productoId: "i_alfajor", proveedor: "Mayorista Golosinas", fechaCompraReal: "2026-05-26", costoTotal: 24000, costoUnidadBase: 600, cantidadInicial: 40, stockRestante: 40, isEmergency: false },
  { id: "b_papa_001", productoId: "i_papa", proveedor: "Dia", fechaCompraReal: "2026-05-31", costoTotal: 4500, costoUnidadBase: 0.045, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false },
  { id: "b_cafe_001", productoId: "i_cafe", proveedor: "Coto", fechaCompraReal: "2026-05-10", costoTotal: 12000, costoUnidadBase: 1.2, cantidadInicial: 10000, stockRestante: 10000, isEmergency: false },
  { id: "b_leche_001", productoId: "i_leche", proveedor: "Dia", fechaCompraReal: "2026-06-01", costoTotal: 6000, costoUnidadBase: 0.06, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-10" },
  { id: "b_muzzarella_001", productoId: "i_muzzarella", proveedor: "Makro", fechaCompraReal: "2026-05-22", costoTotal: 20000, costoUnidadBase: 0.2, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false, vencimiento: "2026-06-18" },
  { id: "b_aceite_001", productoId: "i_aceite", proveedor: "Coto", fechaCompraReal: "2026-05-05", costoTotal: 9000, costoUnidadBase: 0.09, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false },
  { id: "b_polenta_001", productoId: "i_polenta", proveedor: "Makro", fechaCompraReal: "2026-05-20", costoTotal: 4000, costoUnidadBase: 0.04, cantidadInicial: 100000, stockRestante: 100000, isEmergency: false },
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
  // Venta mixta: 1 botella entera + 6 vasos sueltos. Mismo lote fisico.
  sales.push(mk("s_005", [itm("si_005a", "p_gaseosa_botella", 5, 3500), itm("si_005b", "p_vaso_gaseosa", 30, 800)]));
  sales.push(mk("s_006", [itm("si_006", "p_alfajor", 50, 900)]));
  sales.push(mk("s_007", [itm("si_007", "p_papas", 15, 1800)]));
  // Menu polenta: ejercita el multinivel
  sales.push(mk("s_008", [itm("si_008", "p_menu_polenta", 10, 4500)]));

  const allocFor = (saleId: string, saleItemId: string, productoId: string, batchId: string, qty: number) => {
    const batch = batches.find((b) => b.id === batchId)!;
    allocations.push({
      id: `a_${saleId}_${productoId}_${batchId}`,
      saleId,
      saleItemId,
      ingredienteId: productoId,
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
  // Pizza: harina (vino de masa_pizza sub-receta) + muzza + tomate (vino de salsa sub-receta) + aceite (de salsa)
  allocFor("s_003", "si_003", "i_harina", "b_harina_001", 1800);
  allocFor("s_003", "si_003", "i_muzzarella", "b_muzzarella_001", 1800);
  allocFor("s_003", "si_003", "i_tomate", "b_tomate_001", 576);
  allocFor("s_003", "si_003", "i_aceite", "b_aceite_001", 48);
  allocFor("s_004", "si_004", "i_pan", "b_pan_001", 1500);
  allocFor("s_004", "si_004", "i_cafe", "b_cafe_001", 250);
  allocFor("s_004", "si_004", "i_leche", "b_leche_001", 2000);
  // Gaseosa mixta: 5 botellas + 30 vasos = 5 + 30*0.166 = 9.98 botellas del mismo lote
  allocFor("s_005", "si_005a", "i_gaseosa_botella", "b_gaseosa_botella_001", 5);
  allocFor("s_005", "si_005b", "i_gaseosa_botella", "b_gaseosa_botella_001", 5); // 30 vasos * 0.166 = 4.98 redondeado a 5
  allocFor("s_006", "si_006", "i_alfajor", "b_alfajor_001", 50);
  allocFor("s_007", "si_007", "i_papa", "b_papa_001", 3000);
  allocFor("s_007", "si_007", "i_aceite", "b_aceite_001", 300);
  // Menu polenta: 10 porciones. Sub-recetas ejercitadas: polenta + queso + (salsa -> tomate+aceite)
  allocFor("s_008", "si_008", "i_polenta", "b_polenta_001", 2000);
  allocFor("s_008", "si_008", "i_queso", "b_queso_001", 300);
  allocFor("s_008", "si_008", "i_tomate", "b_tomate_001", 480);
  allocFor("s_008", "si_008", "i_aceite", "b_aceite_001", 40);

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
  { id: "pe_3", nombre: "Lucia (ayudante)", tipo: "relacion_dependencia", costoMensual: 520000 },
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
    p_sandwich_miga: 0.22,
    p_pizza_muzza: 0.1,
    p_tostado_jq: 0.13,
    p_desayuno: 0.15,
    p_gaseosa_botella: 0.05,
    p_vaso_gaseosa: 0.12,
    p_alfajor: 0.06,
    p_papas: 0.04,
    p_menu_polenta: 0.13,
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
      titulo: "Demo v2 cargada",
      mensaje: `${builtSales.sales.length} ventas, ${batches.length} lotes, ${builtSales.allocations.length} allocations. Modelo BOM multi-nivel con fraccionamiento.`,
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
