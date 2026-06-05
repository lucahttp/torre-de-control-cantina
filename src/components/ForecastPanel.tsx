import { useApp } from "../store/useApp";
import {
  breakEvenUnits,
  computeVariance,
  cogsFromAllocations,
  forecastFromPlan,
  fmtARS,
  fmtInt,
  fmtPct,
  totalFijos,
  totalPersonal,
  totalSales,
  totalVariableCost,
  totalUnits,
} from "../lib/calc";

export function ForecastPanel() {
  const data = useApp((s) => s.data);
  const plan = data.plans[0];
  const fc = forecastFromPlan(plan, data.products);
  const variance = computeVariance(data, fc.ingresosTotales, fc.unidadesTotales, fc.ingresosTotales * 0.35);
  const be = breakEvenUnits(data, fc.ingresosTotales, fc.ingresosTotales * 0.35);

  const realIngresos = totalSales(data.sales);
  const realUnidades = totalUnits(data.sales);
  const realCogs = cogsFromAllocations(data.allocations);
  const realVarCost = totalVariableCost(data.sales, data.variableCostos);
  const realFijos = totalFijos(data.costosFijos) + totalPersonal(data.personal) + data.tax.cuotaMensual;
  const realMargen = realIngresos - realCogs - realVarCost - realFijos;
  const realMargenPct = realIngresos > 0 ? realMargen / realIngresos : 0;

  return (
    <div style={wrap}>
      <Section title="Forecast del plan">
        <KV k="Capacidad (u/mes)" v={fmtInt(fc.capacidad)} />
        <KV k="Ingresos estimados" v={fmtARS(fc.ingresosTotales)} />
        <KV k="Unidades estimadas" v={fmtInt(fc.unidadesTotales)} />
      </Section>

      <Section title="Real del día">
        <KV k="Ingresos" v={fmtARS(realIngresos)} />
        <KV k="Unidades" v={fmtInt(realUnidades)} />
        <KV k="COGS" v={fmtARS(realCogs)} />
        <KV k="Variables" v={fmtARS(realVarCost)} />
        <KV k="Fijos+Personal+Tax" v={fmtARS(realFijos)} />
        <KV k="Margen" v={fmtARS(realMargen)} highlight={realMargen > 0 ? "pos" : "neg"} />
        <KV k="Margen %" v={fmtPct(realMargenPct)} highlight={realMargenPct > 0.1 ? "pos" : "neg"} />
      </Section>

      <Section title="Variance (Real − Plan)">
        <KV k="Δ Ingresos" v={fmtARS(variance.ingresos.delta)} highlight={variance.ingresos.delta >= 0 ? "pos" : "neg"} />
        <KV k="Δ Unidades" v={fmtInt(variance.unidades.delta)} highlight={variance.unidades.delta >= 0 ? "pos" : "neg"} />
        <KV k="Δ Margen" v={fmtARS(variance.margen.delta)} highlight={variance.margen.delta >= 0 ? "pos" : "neg"} />
      </Section>

      <Section title="Punto de equilibrio">
        <KV k="Costos cubiertos" v={fmtARS(be.fijos)} />
        <KV k="Margen contribución" v={fmtPct(be.margenContribucionPct)} />
        <KV k="Unidades/mes necesarias" v={fmtInt(be.unidadesMes)} />
        <KV k="Unidades/día" v={fmtInt(be.unidadesDia)} />
        <KV k="Ventas/mes mínimas" v={fmtARS(be.ventasMes)} />
      </Section>
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "absolute",
  top: 70,
  left: 10,
  width: 280,
  maxHeight: "calc(100vh - 90px)",
  overflowY: "auto",
  background: "rgba(15, 23, 42, 0.95)",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: 12,
  color: "#e5e7eb",
  fontSize: 12,
  zIndex: 10,
  backdropFilter: "blur(6px)",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v, highlight }: { k: string; v: string; highlight?: "pos" | "neg" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ color: "#94a3b8" }}>{k}</span>
      <b style={{ color: highlight === "pos" ? "#4ade80" : highlight === "neg" ? "#f87171" : "#e5e7eb" }}>{v}</b>
    </div>
  );
}
