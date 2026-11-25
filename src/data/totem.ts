// Sample "snapshot" of the Cantina Totem Dataverse tables.
// In production this comes from the Dataverse connector against
// orga439a969.crm.dynamics.com / TotemCantinaPub.TotemCantina solution.
// For the MVP we ship a static fixture that matches the live schema so the
// code-app can demonstrate the sync flow without needing a real connection.
//
// Category choices (tc_categoria):
//   100000000 = Bebidas
//   100000001 = Snacks
//   100000002 = Comida
//   100000003 = Postres
//   100000004 = Insumo       (v2: para que tc_producto pueda modelar envases
//                              y materia prima que el admin necesita como Product)
//
// Estado choices (tc_estado):
//   100000000 = Pendiente
//   100000001 = Pagado      <-- the code app only imports these
//   100000002 = Listo

import type { Categoria } from "../types/model";
import type { TcCategoria } from "../types/model";

export interface TotemProducto {
  tc_productoid: string; // GUID
  tc_name: string;
  tc_categoria: TcCategoria;
  tc_precio: number;
  tc_descripcion?: string;
  tc_imagenurl?: string;
  tc_disponible: boolean;
}

export interface TotemCarritoItem {
  productoId: string;
  nombre: string;
  precio: number;
  qty: number;
  subtotal: number;
}

export interface TotemPedido {
  tc_pedidoid: string; // GUID
  tc_name: string; // e.g. "PED-260605103912"
  tc_alumnonombre: string;
  tc_alumnocontacto: string;
  tc_total: number;
  tc_estado: 100000000 | 100000001 | 100000002; // 0=Pendiente, 1=Pagado, 2=Listo
  tc_qrpago?: string;
  tc_fechacreacion: string; // ISO
  tc_items: string; // JSON-stringified TotemCarritoItem[]
}

// Map tc_categoria (5 values en v2) -> code-app Categoria (8 values).
// El code app preserva el choice original como `tcCategoria` en el Product.
export const TC_CAT_TO_CATEGORIA: Record<TcCategoria, Categoria> = {
  100000000: "Bebidas",
  100000001: "Snacks_Salados",
  100000002: "Sandwiches", // default para "Comida"; admin puede refinar local
  100000003: "Alfajores_Dulces",
  100000004: "Otros", // Insumo -> "Otros" hasta que el admin lo organice
};

export const TC_CAT_LABEL: Record<TcCategoria, string> = {
  100000000: "Bebidas",
  100000001: "Snacks",
  100000002: "Comida",
  100000003: "Postres",
  100000004: "Insumo",
};

export const CATEGORIA_TO_TC_CAT: Record<Categoria, TcCategoria> = {
  Sandwiches: 100000002,
  Pizzas: 100000002,
  Tostados: 100000002,
  Desayuno: 100000002,
  Bebidas: 100000000,
  Alfajores_Dulces: 100000003,
  Snacks_Salados: 100000001,
  Otros: 100000004,
};

// ---------- 16 productos (master) ----------

export const totemProductos: TotemProducto[] = [
  // Comida (100000002) — 6 items
  { tc_productoid: "tpc-0001", tc_name: "Sándwich de miga", tc_categoria: 100000002, tc_precio: 2500, tc_descripcion: "Jamón y queso, 3 pisos", tc_disponible: true },
  { tc_productoid: "tpc-0002", tc_name: "Tostado jamón y queso", tc_categoria: 100000002, tc_precio: 2200, tc_disponible: true },
  { tc_productoid: "tpc-0003", tc_name: "Pizza muzza", tc_categoria: 100000002, tc_precio: 3200, tc_disponible: true },
  { tc_productoid: "tpc-0004", tc_name: "Pizza especial", tc_categoria: 100000002, tc_precio: 3600, tc_disponible: true },
  { tc_productoid: "tpc-0005", tc_name: "Empanada de carne", tc_categoria: 100000002, tc_precio: 1400, tc_disponible: true },
  { tc_productoid: "tpc-0006", tc_name: "Empanada de jamón y queso", tc_categoria: 100000002, tc_precio: 1400, tc_disponible: true },

  // Bebidas (100000000) — 5 items
  { tc_productoid: "tpb-0001", tc_name: "Gaseosa 500ml", tc_categoria: 100000000, tc_precio: 1500, tc_disponible: true },
  { tc_productoid: "tpb-0002", tc_name: "Agua mineral 500ml", tc_categoria: 100000000, tc_precio: 1000, tc_disponible: true },
  { tc_productoid: "tpb-0003", tc_name: "Jugo en caja", tc_categoria: 100000000, tc_precio: 1200, tc_disponible: true },
  { tc_productoid: "tpb-0004", tc_name: "Café", tc_categoria: 100000000, tc_precio: 900, tc_disponible: true },
  { tc_productoid: "tpb-0005", tc_name: "Mate cocido", tc_categoria: 100000000, tc_precio: 800, tc_disponible: true },

  // Snacks (100000001) — 3 items
  { tc_productoid: "tps-0001", tc_name: "Papas fritas", tc_categoria: 100000001, tc_precio: 1800, tc_disponible: true },
  { tc_productoid: "tps-0002", tc_name: "Chizitos", tc_categoria: 100000001, tc_precio: 1200, tc_disponible: true },
  { tc_productoid: "tps-0003", tc_name: "Maní salado", tc_categoria: 100000001, tc_precio: 800, tc_disponible: true },

  // Postres (100000003) — 2 items
  { tc_productoid: "tpp-0001", tc_name: "Alfajor triple", tc_categoria: 100000003, tc_precio: 1100, tc_disponible: true },
  { tc_productoid: "tpp-0002", tc_name: "Factura", tc_categoria: 100000003, tc_precio: 700, tc_disponible: true },
];

// ---------- Pedidos pagados (sync candidates) ----------
// Today: 3 pagados. Older: 2 pagados. This lets the admin see the FIFO
// effect of importing multiple days of sales.

const todayISO = () => new Date().toISOString();
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const buildItems = (rows: Array<[TotemProducto["tc_productoid"], string, number, number]>): string =>
  JSON.stringify(
    rows.map(([id, nombre, precio, qty]) => ({
      productoId: id,
      nombre,
      precio,
      qty,
      subtotal: precio * qty,
    }))
  );

export const totemPedidos: TotemPedido[] = [
  {
    tc_pedidoid: "ped-260605-001",
    tc_name: "PED-260605103912",
    tc_alumnonombre: "Sofía Pérez",
    tc_alumnocontacto: "11-5555-1010",
    tc_total: 7000,
    tc_estado: 100000001,
    tc_qrpago: "https://mp.example/qr/001",
    tc_fechacreacion: todayISO(),
    tc_items: buildItems([
      ["tpc-0001", "Sándwich de miga", 2500, 1],
      ["tpb-0001", "Gaseosa 500ml", 1500, 1],
      ["tpp-0001", "Alfajor triple", 1100, 2],
    ]),
  },
  {
    tc_pedidoid: "ped-260605-002",
    tc_name: "PED-260605110245",
    tc_alumnonombre: "Mateo Suárez",
    tc_alumnocontacto: "mateo.s@colegio.edu",
    tc_total: 5800,
    tc_estado: 100000001,
    tc_qrpago: "https://mp.example/qr/002",
    tc_fechacreacion: todayISO(),
    tc_items: buildItems([
      ["tpc-0003", "Pizza muzza", 3200, 1],
      ["tpb-0004", "Café", 900, 1],
      ["tps-0001", "Papas fritas", 1800, 1],
    ]),
  },
  {
    tc_pedidoid: "ped-260605-003",
    tc_name: "PED-260605111520",
    tc_alumnonombre: "Lucía Gómez",
    tc_alumnocontacto: "11-5555-2030",
    tc_total: 4400,
    tc_estado: 100000001,
    tc_qrpago: "https://mp.example/qr/003",
    tc_fechacreacion: todayISO(),
    tc_items: buildItems([
      ["tpc-0002", "Tostado jamón y queso", 2200, 1],
      ["tpb-0002", "Agua mineral 500ml", 1000, 1],
      ["tpp-0002", "Factura", 700, 1],
    ]),
  },
  {
    tc_pedidoid: "ped-260604-001",
    tc_name: "PED-260604090130",
    tc_alumnonombre: "Joaquín Méndez",
    tc_alumnocontacto: "11-5555-4010",
    tc_total: 3900,
    tc_estado: 100000001,
    tc_qrpago: "https://mp.example/qr/004",
    tc_fechacreacion: daysAgoISO(1),
    tc_items: buildItems([
      ["tpc-0005", "Empanada de carne", 1400, 2],
      ["tpb-0003", "Jugo en caja", 1200, 1],
    ]),
  },
  {
    tc_pedidoid: "ped-260603-001",
    tc_name: "PED-260603133010",
    tc_alumnonombre: "Camila Ruiz",
    tc_alumnocontacto: "cami@colegio.edu",
    tc_total: 3200,
    tc_estado: 100000001,
    tc_qrpago: "https://mp.example/qr/005",
    tc_fechacreacion: daysAgoISO(2),
    tc_items: buildItems([
      ["tpc-0003", "Pizza muzza", 3200, 1],
    ]),
  },
];
