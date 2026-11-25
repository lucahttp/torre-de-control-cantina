# Cantina Graph OS — Memory Bank

## Project

- Path: `~/cantinacuba/torre-de-control/cantina-graph-os/`
- Type: Power Apps Code App (Vite + React 19 + TypeScript + @xyflow/react v12 + Zustand)
- Status: **🟢 LIVE in Power Apps. All 4 modes render. 70 React Flow nodes + headers + panels working.**
- Data persistence: localStorage (key `cantina-graph-os`) via `zustand/middleware` `persist`.
- Live URL: `https://apps.powerapps.com/play/e/95b4f72c-7cb4-e370-a816-62d067e2de10/app/2d54b7ab-bf46-4ab3-bf32-7f37495f4df0?tenantId=ecccbc9d-89ff-424b-9f3e-4a6516fb60eb`

## Environment

- Environment ID: `95b4f72c-7cb4-e370-a816-62d067e2de10`
- Tenant: `ecccbc9d-89ff-424b-9f3e-4a6516fb60eb`
- Code App ID (created by CLI on second push): `2d54b7ab-bf46-4ab3-bf32-7f37495f4df0`
- Iframe runtime URL: `https://95b4f72c7cb4e370a81662d067e2de.10.environment.api.powerplatformusercontent.com/powerapps/appruntime/{appId}/.../index.html`

## Completed Steps

- [x] Step 1: Prerequisites (Node v24.15.0, Git)
- [x] Step 4: Scaffold (`degit microsoft/PowerAppsCodeApps/templates/vite`, `npm install --ignore-scripts`)
- [x] Step 5: Initialize (`npx power-apps init -e 95b4f72c-...` ✓)
- [x] Step 6: Baseline build (local; `npx tsc -b` ✓, `npx vite build` ✓ — 421 KB JS / 18 KB CSS)
- [x] Step 8: Implement app
- [x] Step 9: Deploy to Power Platform (push succeeded → appId `2d54b7ab-...`; live at `apps.powerapps.com/play/.../2d54b7ab`)

## Implementation Map

| File | Role |
| --- | --- |
| `src/types/model.ts` | All entity types (Users, Products, Ingredients, RecipeItems, Batches, InventoryMovements, Sales, SaleItems, Allocations, PlanMensual, PlanItem, ProjectionOverride, VariableCosto, CostoFijo, Personal, TaxConfig, Settings, AppNotification, AppData). |
| `src/data/demo.ts` | Realistic seed: 7 products, 12 ingredients, 17 recipe items, 14 batches (Coto/Día/Makro/Carrefour, 1 emergency), 7 sales with pre-computed allocations, monotributo H tax config, plan for current month. |
| `src/lib/fifo.ts` | `allocateFIFO`, `requiredQtyForSaleItem`, `saleCOGS`, `rollbackAllocations`. FIFO = `fechaCompraReal.localeCompare` + `id.localeCompare` tiebreak. |
| `src/lib/calc.ts` | `fmtARS`, `fmtPct`, `fmtInt`, `totalSales`, `totalUnits`, `cogsFromAllocations`, `totalVariableCost`, `totalFijos`, `totalPersonal`, `forecastFromPlan`, `computeVariance`, `breakEvenUnits`. |
| `src/store/useApp.ts` | Zustand `persist` store. Actions: `importData`, `exportData`, `selectEntity`, `markAllRead`. |
| `src/components/EntityNode.tsx` | Single flexible node component for all 19 entity types. `COLORS` map + `Body` switch. |
| `src/components/Canvas.tsx` | ReactFlow wrapper. `buildLayout()` builds nodes/edges for 4 modes; `collectRelated()` walks the model for trazabilidad highlighting. |
| `src/components/DetailPanel.tsx` | Slide-in detail panel for selected entity. |
| `src/components/QuickActions.tsx` | NewSale (FIFO), NewBatch (emergency flag), ResolveNeedsStock forms. |
| `src/components/IOPanel.tsx` | JSON export/import/reset-demo. |
| `src/components/ForecastPanel.tsx` | Left side: Forecast, Real, Variance, Break-even. |
| `src/App.tsx` | Header + mode tabs + canvas + panels + notification popover. |
| `src/styles.css` | Dark theme tokens. |

## Modes (UI tabs)

1. **Operación** — full graph (Proveedores → Insumos → Recetas → Productos → Ventas).
2. **Trazabilidad** — same nodes; non-lineage nodes are dimmed when an entity is selected.
3. **Finanzas** — Sankey-ish: revenue → MP / var / fix / staff / tax → result.
4. **Forecast / Outlook** — plan vs real vs variance with driver breakdown.

## Next Steps

1. **(Optional) Dataverse persistence**: invoke `/add-dataverse` to mirror the local model to Dataverse tables and switch the store to use the generated services.
2. **(Optional) SharePoint** for collaborative persistence (multiple users editing the same cantina).
3. **Polish**: replace straight React Flow edges with custom Sankey edge component for `finanzas`; add ELK/dagre auto-layout for `operacion` so 20+ batches don't stack manually.
4. **Redeploy loop**: `cd cantina-graph-os && npm run build && npx power-apps push`.

## Verified in Production (Playwright DOM inspection of the iframe)

- React Flow viewport rendered (104 CSS rules loaded, scale + translate transform applied)
- 70 `.react-flow__node` elements in the DOM
- Header present: "Cantina Graph OS · trazabilidad lote → receta → venta"
- 4 mode tabs: Operación (active) · Trazabilidad · Finanzas · Forecast / Outlook
- Quick Actions ▾, IO ▾, 🔔 1 (notification badge)
- Sample node (prov_Coto_0) HTML has inline styles: `background: rgb(31, 41, 55); border: 2px solid rgb(245, 158, 11); border-radius: 10px;` — Coto PROVEEDOR highlighted with the orange accent
- LocalStorage key `cantina-graph-os` persists between sessions

## Console Output (Power Apps iframe)

- 1 React 19 informational warning about `createElement: type is invalid` from the host page (apps.powerapps.com) — does not block our app inside the iframe. The iframe itself reports 0 errors, 0 warnings.

## Known Build Quirks (Windows PowerShell)

- Use `npx degit` directly (after `npm i -g degit`) — `npx degit` hangs in PowerShell.
- Use `npm install --ignore-scripts` for the initial install — `keytar` and other native deps use POSIX `||` in prebuild scripts.
- **To get `keytar` working afterward** (it's required by `power-apps` CLI for credential storage): `cd node_modules/keytar; npx prebuild-install` — that pulls the precompiled Windows binary into `build/Release/keytar.node` without triggering the broken `||` postinstall.
- `&&` is not a valid separator inside `powershell -Command`; run `tsc` and `vite build` as separate commands.

## Env Inventory (from `npx power-apps list-codeapps`)

Three code apps already exist in this env:
- `432fdd94-4691-4af9-93b2-52c5f9b89e77` — Governance Registration Center
- `5631886d-768f-4677-a80d-4ba0f2472e7d` — Request and Consultancy Hub
- `8301863c-73a4-4b9a-a88f-e2bffb76c18d` — Cantina Escolar (different subtype than our Vite build; `push` returns 400 `AppSubtypeImmutable` if targeted)
