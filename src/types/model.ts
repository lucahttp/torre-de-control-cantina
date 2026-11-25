// Cantina Graph OS — Data Model
// All entities used across the canvas nodes and FIFO engine.

export type ID = string;
export type ISODate = string; // yyyy-mm-dd

// ---------- Users & Roles ----------

export type UserRole = "POS" | "COCINA" | "STOCK" | "ADMIN";

export interface User {
  id: ID;
  name: string;
  role: UserRole;
}

// ---------- Products & Recipes (v2: todo es un Producto, BOM multi-nivel) ----------

export type Categoria =
  | "Sandwiches"
  | "Pizzas"
  | "Tostados"
  | "Desayuno"
  | "Bebidas"
  | "Alfajores_Dulces"
  | "Snacks_Salados"
  | "Otros";

/**
 * Unidad base del producto. Define cómo se mide su stock y cómo se interpretan
 * las cantidades en recetas y ventas. La conversión entre unidades (kg↔g, l↔ml)
 * se hace al construir la receta: si el producto está en "kg", una receta que
 * pide 200g debe escribirse como 0.2 (interpretado en la unidad base).
 */
export type UnidadBase = "g" | "kg" | "ml" | "l" | "unidad" | "botella" | "vaso" | "porcion" | "paquete";

/**
 * Categoría del Totem (tc_categoria). 100000004 = "Insumo" es nueva en v2 y
 * marca productos que son materia prima / envase y no se venden al alumno.
 */
export type TcCategoria = 100000000 | 100000001 | 100000002 | 100000003 | 100000004;

export const TC_CATEGORIA_LABEL: Record<TcCategoria, string> = {
  100000000: "Bebidas",
  100000001: "Snacks",
  100000002: "Comida",
  100000003: "Postres",
  100000004: "Insumo",
};

export interface Product {
  id: ID;
  nombre: string;
  categoria: Categoria; // 8 valores del UI admin
  precioVentaDefault: number; // ARS
  activo: boolean;
  unidadBase: UnidadBase; // para stock y conversiones
  // SYNC desde el totem (opcional; un Product puede ser admin-only)
  tcProductoId?: string; // GUID de tc_producto
  tcCategoria?: TcCategoria; // categoría de tc_producto
  // UI hint
  esInsumoBase?: boolean; // si true, este producto es hoja del BOM (no se "fabrica")
}

export interface RecipeItem {
  id: ID;
  productoId: ID; // padre: el producto que se arma
  componenteId: ID; // hijo: otro Product (insumo, sub-producto o fraccionado)
  cantidad: number; // unidades de `componente` por 1 unidad de `producto`
  mermaPct: number; // 0..1, solo aplica cuando el componente se "gasta" (no en fraccionar)
  nota?: string;
}

// ---------- Batches & Inventory ----------

export type FuentePrecio = {
  url?: string;
  fecha?: ISODate;
};

export interface Batch {
  id: ID;
  productoId: ID; // FK a Product (v2: no más FK a Ingredient)
  proveedor: string;
  fechaCompraReal: ISODate;
  costoTotal: number; // ARS
  costoUnidadBase: number; // ARS per unidadBase del producto
  cantidadInicial: number; // in unidadBase
  stockRestante: number; // in unidadBase
  vencimiento?: ISODate;
  isEmergency: boolean;
  fuente?: FuentePrecio;
  promo?: string;
}

export type MovementKind = "COMPRA" | "VENTA" | "AJUSTE" | "MERMA" | "RECOSTEO";

export interface InventoryMovement {
  id: ID;
  fecha: ISODate;
  ingredienteId: ID;
  batchId?: ID;
  kind: MovementKind;
  qty: number;
  nota?: string;
}

// ---------- Sales & Allocations ----------

export type CanalPago = "Efectivo" | "MercadoPago" | "Tarjeta" | "Transferencia";
export type SaleStatus = "OK" | "NEEDS_STOCK" | "RESOLVED";

export interface Sale {
  id: ID;
  fecha: ISODate;
  alumnoPresentes?: number;
  items: SaleItem[];
  total: number;
  status: SaleStatus;
}

export interface SaleItem {
  id: ID;
  productoId: ID;
  unidades: number;
  precioUnitario: number;
  importe: number;
}

export interface Allocation {
  id: ID;
  saleId: ID;
  saleItemId: ID;
  ingredienteId: ID;
  batchId: ID;
  qtyBase: number;
  costArs: number;
}

// ---------- Forecast / Plans ----------

export type Regimen = "Monotributo" | "SAS" | "SAU";

export interface PlanMensual {
  id: ID;
  mes: string;
  alumnosTotales: number;
  maxUnidadesPorAlumno: number;
  tasaConversion: number;
  diasOperativos: number;
  ticketPromedio: number;
  mix: Record<ID, number>;
  pesos: {
    plan: number;
    ayer: number;
    mismoDiaSemanaPasada: number;
    mismoDiaMesPasado: number;
    mediaMovil7: number;
  };
}

export interface PlanItem {
  id: ID;
  planId: ID;
  productoId: ID;
  unidadesEstimadas: number;
  ingresosEstimados: number;
}

export interface ProjectionOverride {
  id: ID;
  planId: ID;
  productoId?: ID;
  unidadesOverride?: number;
  precioOverride?: number;
  nota?: string;
}

// ---------- Costs ----------

export interface VariableCosto {
  id: ID;
  nombre: string;
  tipo: "porcentaje" | "por_unidad";
  valor: number;
  base: "venta" | "mp";
}

export interface CostoFijo {
  id: ID;
  nombre: string;
  montoMensual: number;
}

export interface Personal {
  id: ID;
  nombre: string;
  tipo: "monotributista" | "relacion_dependencia";
  costoMensual: number;
}

export interface TaxConfig {
  regimen: Regimen;
  categoria?: string;
  cuotaMensual: number;
  alertaTope?: boolean;
}

// ---------- Settings ----------

export interface Settings {
  moneda: "ARS";
  ivaIncluido: boolean;
  inflacionMensual: number;
  fechaInicio: ISODate;
}

// ---------- Notifications ----------

export type NotificationLevel = "info" | "warning" | "error";

export interface AppNotification {
  id: ID;
  fecha: ISODate;
  nivel: NotificationLevel;
  titulo: string;
  mensaje: string;
  refTipo?: "sale" | "batch" | "recipe" | "forecast";
  refId?: ID;
  leida: boolean;
}

// ---------- Full snapshot ----------

export interface AppData {
  users: User[];
  products: Product[];
  recipeItems: RecipeItem[];
  batches: Batch[];
  movements: InventoryMovement[];
  sales: Sale[];
  allocations: Allocation[];
  notifications: AppNotification[];
  plans: PlanMensual[];
  planItems: PlanItem[];
  overrides: ProjectionOverride[];
  variableCostos: VariableCosto[];
  costosFijos: CostoFijo[];
  personal: Personal[];
  tax: TaxConfig;
  settings: Settings;
}
