# Cantina Graph OS — Memory Bank

## Project

- Path: `~/cantinacuba/torre-de-control/cantina-graph-os/`
- Type: Power Apps Code App (Vite + React 19 + TypeScript + @xyflow/react v12 + Zustand)
- Status: **Local build green + CLI auth verified. Push BLOCKED at tenant level (Code Apps not allowed).**
- Data persistence: localStorage (key `cantina-graph-os`) via `zustand/middleware` `persist`.

## Environment

- Environment ID: `95b4f72c-7cb4-e370-a816-62d067e2de10`
- Tenant: `ecccbc9d-89ff-424b-9f3e-4a6516fb60eb`
- Code App ID created by CLI: `3f6130de-f1b0-4664-8a85-d16d4d383092`
- Note: The make.powerapps.com URL the user shared is for a Canvas App (`83b8bcaf-...`), NOT the Code App. The Code App lives at `apps.powerapps.com/play/e/{env}/app/{codeAppId}` once it's pushed.

## Completed Steps

- [x] Step 1: Prerequisites (Node v24.15.0, Git)
- [x] Step 4: Scaffold (`degit microsoft/PowerAppsCodeApps/templates/vite`, `npm install --ignore-scripts`)
- [x] Step 5: Initialize (deferred — needs environment ID)
- [x] Step 6: Baseline build (local only; `npx tsc -b` ✓, `npx vite build` ✓ — 421 KB JS / 18 KB CSS)
- [x] Step 8: Implement app
- [ ] Step 9: Deploy to Power Platform (waiting on env-id + `npx power-apps init`)

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

1. **BLOCKER — env-level feature is still off.** A tenant OR env admin must open Power Platform admin center → **Manage** → **Environments** → click env `95b4f72c-7cb4-e370-a816-62d067e2de10` → **Settings** (top bar) → expand **Product** → **Features** → toggle **"Power Apps code apps"** → **Save**. This is a DIFFERENT toggle than the tenant-level "Allow users to bring apps…" setting, and it lives in a DIFFERENT place. The user may have only enabled the tenant toggle. Wait ~5 min after saving, then re-run `npx power-apps push` from `cantina-graph-os/`.
2. **Side discovery**: if user does want to overwrite the existing "Cantina Escolar" code app (`8301863c-...`), it returns `400 AppSubtypeImmutable` because that app was created with a different template/subtype than our Vite build. Re-using that ID won't work without re-creating the env's code app shell of the right subtype.
3. **(Optional) Dataverse persistence**: invoke `/add-dataverse` to mirror the local model to Dataverse tables and switch the store to use the generated services.
4. **Polish**: replace straight React Flow edges with custom Sankey edge component for `finanzas`; add ELK/dagre auto-layout for `operacion` so 20+ batches don't stack manually.

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
