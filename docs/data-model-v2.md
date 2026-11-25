# Modelo de Datos v2 — Cantina (Totem + Graph OS) · Todo en Dataverse

## Principio unificador
**Todo es un Producto.** No existe tabla `Ingredient` separada. Lo que antes llamábamos "ingrediente" (harina, queso, una botella de gaseosa) es simplemente un Producto con `categoria = Insumo` y sin líneas de receta que lo usen como padre. La receta (`tc_receta`) es un BOM polimórfico donde cada línea apunta a otro Producto.

Esto resuelve los 3 casos reales de cantina con la misma estructura:
- **Directo** (alfajor, botella entera de gaseosa) → producto sin receta, se compra y se vende tal cual.
- **Compuesto** (menú polenta) → producto con receta que apunta a sub-productos (polenta, salsa, queso).
- **Fraccionado** (vaso de gaseosa) → producto con receta cuya línea apunta a una botella con `cantidad < 1` (1 botella = 6 vasos, así que la línea es `cantidad = 0.166`).

## Entorno
- **Totem** (Canvas, alumnos): `orga439a969.crm.dynamics.com` · Publisher `TotemCantinaPub` · Solución `TotemCantina`
- **Admin** (Code App, Graph OS): mismo entorno o uno vinculado. Comparten las tablas `tc_producto` + `tc_pedido` (master del totem). Las tablas `tc_receta`, `tc_lote`, `tc_venta`, `tc_ventaitem`, `tc_alloc` son del admin y viven en su propia solución.
- **Code app** deployado: `https://apps.powerapps.com/play/e/95b4f72c-7cb4-e370-a816-62d067e2de10/app/2d54b7ab-bf46-4ab3-bf32-7f37495f4df0`

## Modelo de datos (todo en Dataverse)

### `tc_producto` — Master de productos (totem-owned, 16 registros)
| Campo | Tipo | Notas |
|---|---|---|
| tc_productoid | GUID PK | autogenerado |
| tc_name | Text(100) | nombre visible |
| tc_categoria | Choice | 100000000=Bebidas, 001=Snacks, 002=Comida, 003=Postres, **004=Insumo** (nuevo) |
| tc_unidadbase | Choice | kg, g, l, ml, unidad, botella, vaso, porción, paquete — define la unidad de compra/venta |
| tc_precio | Decimal | ARS (precio de venta al alumno) |
| tc_descripcion | Text(200) | opcional |
| tc_imagenurl | Text(500) | URL imagen |
| tc_disponible | Yes/No | default true |

> La categoría `Insumo` (004) es nueva y marca "este producto es materia prima o envase, no se vende directo al alumno". El admin la usa para agrupar en la UI de stock. Los alumnos siguen viendo Bebidas/Snacks/Comida/Postres en el totem.

### `tc_pedido` — Pedidos del alumno (totem-owned, escrita en runtime)
| Campo | Tipo | Notas |
|---|---|---|
| tc_pedidoid | GUID PK | autogenerado |
| tc_name | Text(100) | `PED-` + Text(Now,YYMMDDHHMMSS) |
| tc_alumnonombre | Text(100) | desde DatosAlumno |
| tc_alumnocontacto | Text(100) | tel/email |
| tc_total | Decimal | Σ carrito |
| tc_estado | Choice | 000=Pendiente, 001=Pagado, 002=Listo |
| tc_qrpago | Text(500) | URL/QR MercadoPago |
| tc_fechacreacion | DateTime | Now() |
| tc_items | Text(2000) | JSON del carrito (sin cambios) |

### `tc_receta` — BOM (admin-owned) **NUEVA**
Línea de receta polimórfica. Apunta siempre a otro `tc_producto`, sea materia prima o sub-producto.
| Campo | Tipo | Notas |
|---|---|---|
| tc_recetaid | GUID PK | autogenerado |
| tc_productoid | FK → tc_producto | el producto que se ARMA (padre) |
| tc_componenteid | FK → tc_producto | lo que se USA para armarlo (hijo) — puede ser insumo o sub-producto |
| tc_cantidad | Decimal | unidades de `componente` por 1 unidad de `producto` |
| tc_mermapct | Decimal | 0..1, merma/desperdicio sobre este componente (típico en materia prima, 0 en fraccionamiento) |
| tc_nota | Text(200) | opcional ("botella rinde 6 vasos", "polenta suelta") |

**Restricciones:**
- No se permite que `tc_productoid == tc_componenteid` (receta recursiva directa).
- No se permite ciclo en la cadena de recursión (validar al guardar, walk).
- Si `tc_mermapct > 0` y `tc_cantidad < 1`, probablemente es fraccionado (validación suave, no bloqueante).

**Ejemplos reales:**
| producto (padre) | componente (hijo) | cantidad | merma | interpretación |
|---|---|---|---|---|
| Vaso de gaseosa | Gaseosa botella 1.5L | 0.166 | 0 | 1 vaso = 1/6 botella, sin merma |
| Menú polenta | Polenta (kg) | 0.2 | 0.05 | 200g de polenta con 5% de merma |
| Menú polenta | Queso (kg) | 0.03 | 0.03 | 30g de queso con 3% de merma |
| Menú polenta | Salsa de tomate | 0.08 | 0.05 | 80g de salsa, 5% merma |
| Salsa de tomate | Tomate (kg) | 0.6 | 0.1 | sub-receta: 600g de tomate por kg de salsa |
| Salsa de tomate | Aceite (l) | 0.05 | 0 | 50ml de aceite |
| Pizza muzza | Masa de pizza | 0.3 | 0.05 | 300g de masa con 5% merma |
| Masa de pizza | Harina (kg) | 0.5 | 0.02 | sub-receta |
| Alfajor triple | Alfajor (unidad) | 1 | 0 | directo: 1 unidad = 1 alfajor (o sin receta si se vende tal cual) |

### `tc_lote` — Lote de compra (admin-owned) **REEMPLAZA tc_batch**
Cada lote es de UN producto. El producto puede ser insumo (harina), envase (botella), o producto terminado que se compra para reventa (alfajor).
| Campo | Tipo | Notas |
|---|---|---|
| tc_loteid | GUID PK | autogenerado |
| tc_productoid | FK → tc_producto | qué compré (insumo o producto reventa) |
| tc_proveedor | Text(100) | Coto, Día, Makro, Carrefour, etc. |
| tc_fechacompra | DateTime | fecha real de compra |
| tc_costototal | Decimal | ARS total del lote |
| tc_cantidadinicial | Decimal | en la `unidadbase` del producto |
| tc_stockrestante | Decimal | en la `unidadbase` (decrece con ventas/ajustes) |
| tc_vencimiento | DateTime | opcional |
| tc_esemergencia | Yes/No | true = comprado con sobreprecio por urgencia |
| tc_fuenteurl | Text(500) | link al precio online |
| tc_promo | Text(100) | nota ("2x1 Día", "oferta Makro") |

### `tc_venta` — Venta (admin-owned) **NUEVA**
Cabezal de venta. Se crea importando `tc_pedido WHERE tc_estado=001 (Pagado)` o manualmente desde el admin.
| Campo | Tipo | Notas |
|---|---|---|
| tc_ventaid | GUID PK | autogenerado |
| tc_fecha | DateTime | cuándo se vendió |
| tc_origen | Choice | 1=Totem, 2=Manual |
| tc_pedidoid | Text(100) | GUID del `tc_pedido` original si origen=Totem (cross-env ref) |
| tc_alumnonombre | Text(100) | denormalizado del pedido (trazabilidad) |
| tc_alumnocontacto | Text(100) | denormalizado |
| tc_total | Decimal | Σ items |
| tc_estado | Choice | 1=OK, 2=NEEDS_STOCK, 3=RESOLVED |

### `tc_ventaitem` — Línea de venta (admin-owned) **NUEVA**
| Campo | Tipo | Notas |
|---|---|---|
| tc_ventaitemid | GUID PK | autogenerado |
| tc_ventaid | FK → tc_venta | |
| tc_productoid | FK → tc_producto | el producto vendido (puede ser top-level o sub-producto si fue fraccionado y vendido suelto) |
| tc_unidades | Decimal | cuántas unidades |
| tc_preciounitario | Decimal | ARS por unidad |
| tc_importe | Decimal | unidades × preciounitario |

### `tc_alloc` — Asignación FIFO (admin-owned) **NUEVA**
Generada por el algoritmo de explosión de BOM. Una línea por (lote consumido, ítem de venta).
| Campo | Tipo | Notas |
|---|---|---|
| tc_allocid | GUID PK | autogenerado |
| tc_ventaitemid | FK → tc_ventaitem | |
| tc_loteid | FK → tc_lote | qué lote se consumió |
| tc_productoid | FK → tc_producto | denormalizado: qué producto se extrajo del lote |
| tc_cantidadbase | Decimal | en `unidadbase` del producto (puede ser kg, ml, unidad) |
| tc_costoars | Decimal | tc_cantidadbase × tc_lote.costounidadbase |

## Algoritmo: Multi-level FIFO Explosion

```
explodeAndAllocate(productoId, unidades, ctx) -> [alloc...]
  recipe = tc_receta WHERE tc_productoid = productoId
  if recipe is empty:
    # Caso 1: producto leaf (insumo o reventa directa como alfajor)
    #         o sub-producto "vaso" cuyo componente es directo
    return allocateFromBatches(productoId, unidades, ctx)
  for each line in recipe:
    needed = unidades * line.cantidad * (1 + line.mermapct)
    recurse(explodeAndAllocate, line.componenteid, needed, ctx)
```

**Importante:** el algoritmo NO distingue entre "este componente es insumo" o "es sub-producto". Trata a todos igual. Si el componente tiene receta, recursa. Si no, consume su propio lote. Esto es lo que hace que la botella→vaso funcione naturalmente.

### Ejemplo paso a paso: vender 1 Menú Polenta

```
explode(MenuPolenta, 1):
  line1: Polenta × 0.2 × 1.05 = 0.21 kg
    → no recipe → allocate from Polenta batches FIFO
  line2: Queso × 0.03 × 1.03 = 0.0309 kg
    → no recipe → allocate from Queso batches FIFO
  line3: Salsa × 0.08 × 1.05 = 0.084 kg
    → recipe exists → recurse:
      line3a: Tomate × 0.6 × 1.1 = 0.66 kg de Tomate
        → allocate from Tomate batches
      line3b: Aceite × 0.05 × 1.0 = 0.05 l de Aceite
        → allocate from Aceite batches
```

Resultado: 5 alocaciones, una por cada leaf (insumo) tocado.

### Ejemplo: vender 6 Vasos de Gaseosa

```
explode(VasoGaseosa, 6):
  line1: GaseosaBotella1.5L × 0.166 × 1.0 = 0.996 botellas
    → no recipe → allocate 0.996 botellas from GaseosaBotella1.5L batches
```

(Probablemente toma 1 botella completa del lote FIFO, dejando stockRestante -= 1, y reporta merma 0.004 por el redondeo — o cobra al alumno el sobrante como inventario perdido).

## Receta vs venta: cómo conectan
- `tc_pedido` (totem) → al hacer `Patch tc_estado=001 Pagado` → trigger en code-app o polling manual: importa como `tc_venta` (origen=Totem) con sus `tc_ventaitem` parseando el JSON de `tc_items`.
- `tc_ventaitem` referencia el `tc_producto` de la línea del carrito (un top-level del totem: Vaso, Menú, Alfajor, etc).
- Al confirmar la venta, el algoritmo `explodeAndAllocate` corre sobre cada `tc_ventaitem` y genera las `tc_alloc` recorriendo el BOM hasta los leafs.
- Si alguna hoja queda sin stock (`remaining > 0` en `allocateFromBatches`), la venta queda con `tc_estado=NEEDS_STOCK` y se muestra en la lista de pendientes del admin.

## Stock computado
- Stock de un producto = Σ(`tc_lote.stockrestante`) WHERE `tc_productoid = P`
- Sirve para todos: "stock de harina" (kg), "stock de botellas de gaseosa" (botellas), "stock de alfajores" (unidades). Una sola fórmula.

## Costo promedio computado
- `costoPromedio(P) = Σ(lote.costototal) / Σ(lote.cantidadinicial)` para todos los lotes activos de P.
- Se usa para mostrar el "costo actual" en UI y como referencia en el forecast, pero el COGS real de una venta viene de los `tc_alloc.costoars` (FIFO real, no promedio).

## COGS y margen
- COGS de una venta = Σ(`tc_alloc.costoars`) WHERE `tc_ventaid = V`
- Margen bruto = `tc_venta.total - COGS`
- En el modo **Trazabilidad** del code app, click sobre una venta muestra todos los `tc_alloc` y de ahí se navega al lote y al proveedor.

## Modelo en el code app (TypeScript)

Refleja 1:1 lo de arriba. La nueva estructura del `src/types/model.ts`:

```typescript
interface Product {
  id: ID;
  nombre: string;
  categoria: Categoria;          // 8 valores UI del admin
  precioVentaDefault: number;
  activo: boolean;
  // SYNC desde totem:
  tcCategoria?: 100000000|100000001|100000002|100000003|100000004; // 004 = Insumo
  // Local:
  unidadBase: UnidadBase;         // para calcular conversiones
  tcProductoId?: string;          // GUID de tc_producto si fue sincronizado
}

type UnidadBase = "g"|"kg"|"ml"|"l"|"unidad"|"botella"|"vaso"|"porcion"|"paquete";

interface RecipeItem {
  id: ID;
  productoId: ID;          // padre
  componenteId: ID;        // hijo (otro Product)
  cantidad: number;        // unidades de componente por 1 de producto
  mermaPct: number;        // 0..1
  nota?: string;
}

interface Batch {
  id: ID;
  productoId: ID;          // FK a Product (no más FK a Ingredient)
  proveedor: string;
  fechaCompraReal: ISODate;
  costoTotal: number;
  cantidadInicial: number;
  stockRestante: number;
  // ... resto igual
}

// Ingredient INTERFACE ELIMINADA — todo es Product ahora.
```

## Cambios necesarios en el código actual (resumen)

1. **`src/types/model.ts`** — eliminar `Ingredient`, agregar `unidadBase` y `tcProductoId`/`tcCategoria` a `Product`, cambiar `Batch.ingredienteId` → `Batch.productoId`. RecipeItem no cambia de campos, solo cambia el universo de `componenteId` (ahora es un Product, no un Ingredient).
2. **`src/lib/fifo.ts`** — `allocateFIFO` ahora opera sobre un productoId y consume sus batches. Nueva función `explodeAndAllocate(productoId, unidades, ctx)` que recursa por la receta.
3. **`src/lib/calc.ts`** — `productCost` ahora también es multi-nivel. Si el producto tiene receta, suma recursivamente los costos de los componentes. Si no, no se puede calcular (no tiene costo propio — depende de los batches).
4. **`src/store/useApp.ts`** — eliminar `addIngredient` (ya no aplica). Mantener CRUD de `Product` pero el `addProduct` queda como "agregar producto admin-only" (típicamente un insumo o un producto que el admin vende distinto al totem). El totem sigue siendo master para los productos del alumno.
5. **`src/data/demo.ts`** — refactor: todos los antiguos "ingredients" se convierten en `Product` con `categoria="Otros"`, `tcCategoria=100000004` (Insumo), `unidadBase` adecuada. Las `RecipeItem`s se mantienen. Los `Batch.ingredienteId` se renombran a `Batch.productoId`.
6. **`src/components/CatalogPanel.tsx`** — al armar receta, el dropdown de "componente" ahora muestra **todos los productos** (no solo ingredientes). Si el componente es de tipo Insumo, pedir cantidad + merma. Si es de tipo Compuesto/Venta directa, asumir merma 0 y mostrar nota "1 unidad = X del padre" cuando `cantidad < 1`.
7. **`src/components/Canvas.tsx`** — el grafo ahora puede mostrar la jerarquía: al expandir un producto, ver sus componentes y los componentes de esos. Modo "receta" como vista alternativa.
8. **`src/components/EntityNode.tsx`** — soportar el nuevo tipo visual "componente de receta" (un product usado por otro product).

## Decisiones a tomar
1. **¿Mismo entorno o entornos vinculados?** `tc_producto` vive en `orga439a969.crm.dynamics.com`. El code app está en `95b4f72c-...`. O se migra todo a un entorno único, o se usa una connection reference cross-env. **Recomendado:** unificar en un solo entorno.
2. **¿Eliminar tabla `Ingredient` de la solución o dejarla deprecada?** Recomendado: eliminarla. Migrar datos primero (los 12 ingredientes del demo → 12 productos con `categoria=Otros, tcCategoria=Insumo`).
3. **¿`tc_receta` con FK polimórfica o dos campos (componenteid_ingrediente, componenteid_producto)?** Recomendado: **un solo `tc_componenteid` FK a `tc_producto`** + validación de aplicación. Más simple y extensible.
4. **¿Detección de ciclos en la receta?** Sí, validar al guardar (walk + visited set).
5. **¿`tc_unidadbase` en tc_producto?** Recomendado: sí, para que las conversiones sean explícitas y el algoritmo pueda validar (no se puede asignar 200g de un producto que está en ml).
6. **¿Soportar recetas con `cantidad` negativa (devoluciones)?** Por ahora no, suma simple. Si más adelante se quiere devolución, se modela como un nuevo `tc_venta` con `origen=Devolucion`.
