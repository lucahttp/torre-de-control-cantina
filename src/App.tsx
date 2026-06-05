import { useState } from "react";
import "./styles.css";
import { Canvas } from "./components/Canvas";
import { DetailPanel } from "./components/DetailPanel";
import { QuickActions } from "./components/QuickActions";
import { IOPanel } from "./components/IOPanel";
import { ForecastPanel } from "./components/ForecastPanel";
import { useApp } from "./store/useApp";

const MODES: { id: "operacion" | "trazabilidad" | "finanzas" | "forecast"; label: string }[] = [
  { id: "operacion", label: "Operación" },
  { id: "trazabilidad", label: "Trazabilidad" },
  { id: "finanzas", label: "Finanzas" },
  { id: "forecast", label: "Forecast / Outlook" },
];

function App() {
  const viewMode = useApp((s) => s.viewMode);
  const setViewMode = useApp((s) => s.setViewMode);
  const notifications = useApp((s) => s.data.notifications);
  const unread = notifications.filter((n) => !n.leida).length;
  const [showNotif, setShowNotif] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="dot" />
          <span>Cantina Graph OS</span>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400, marginLeft: 8 }}>
            trazabilidad lote → receta → venta
          </span>
        </div>
        <div className="app-tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`app-tab ${viewMode === m.id ? "active" : ""}`}
              onClick={() => setViewMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="app-actions">
          <QuickActions />
          <IOPanel />
          <button className="bell" onClick={() => setShowNotif((v) => !v)} title="Notificaciones">
            🔔
            {unread > 0 && <span className="badge">{unread}</span>}
          </button>
        </div>
      </header>

      <div className="canvas-area">
        <Canvas />
        {viewMode === "forecast" && <ForecastPanel />}
        <DetailPanel />

        {showNotif && (
          <div className="notif-list">
            {notifications.length === 0 && <div style={{ padding: 12, color: "#94a3b8" }}>Sin notificaciones</div>}
            {notifications.map((n) => (
              <div key={n.id} className="notif-item">
                <span className={`lvl ${n.nivel}`}>{n.nivel}</span>
                <b>{n.titulo}</b>
                <div style={{ color: "#cbd5e1", marginTop: 4 }}>{n.mensaje}</div>
                <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{n.fecha}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

