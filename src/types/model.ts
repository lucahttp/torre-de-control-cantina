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

// ---------- Products & Recipes ----------

export type Categoria =
  | "Sandwiches"
  | "Pizzas"
  | "Tostados"
  | "Desayuno"
  | "Bebidas"
  | "Alfajores_Dulces"
  | "Snacks_Salados"
  | "Otros";

export interface Product {
  id: ID;
  nombre: string;
  categoria: Categoria;
  precioVentaDefault: number; // ARS
  activo: boolean;
}

export interface Ingredient {
  id: ID;
  nombre: string;
  unidadBase: "g" | "ml" | "unidad";
  stockTotal: number; // computed
  costoPromedio: number; // computed
}

export interface RecipeItem {
  id: ID;
  productoId: ID;
  ingredienteId: ID;
  cantidad: number; // per 1 unit of product, in unidadBase
  mermaPct: number; // 0..1
}

// ---------- Batches & Inventory ----------

export type FuentePrecio = {
  url?: string;
  fecha?: ISODate;
};

export interface Batch {
  id: ID;
  ingredienteId: ID;
  proveedor: string;
  fechaCompraReal: ISODate;
  costoTotal: number; // ARS
  costoUnidadBase: number; // ARS per unidadBase
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
  ingredients: Ingredient[];
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
