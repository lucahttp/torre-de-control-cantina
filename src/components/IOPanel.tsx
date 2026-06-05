import { useState } from "react";
import { useApp } from "../store/useApp";

export function IOPanel() {
  const [open, setOpen] = useState(false);
  const exportData = useApp((s) => s.exportData);
  const importData = useApp((s) => s.importData);
  const resetDemo = useApp((s) => s.resetDemo);
  const [json, setJson] = useState("");

  const doExport = () => {
    const data = exportData();
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cantina-graph-os-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = () => {
    try {
      const data = JSON.parse(json);
      importData(data);
      setJson("");
      setOpen(false);
    } catch (e) {
      alert("JSON inválido: " + (e as Error).message);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={btn}>IO ▾</button>
      {open && (
        <div style={menu}>
          <div style={row}>
            <button onClick={doExport} style={{ ...btn, flex: 1 }}>Exportar JSON</button>
            <button onClick={resetDemo} style={{ ...btn, background: "#7f1d1d" }}>Reset demo</button>
          </div>
          <label style={lbl}>Pegar JSON para importar</label>
          <textarea
            style={{ ...input, height: 80, fontFamily: "monospace", fontSize: 10 }}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{ "products": [], ... }'
          />
          <button onClick={doImport} style={{ ...btn, background: "#16a34a" }}>Importar</button>
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #475569",
  color: "#e5e7eb",
  padding: "6px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
};
const menu: React.CSSProperties = {
  position: "absolute",
  top: "110%",
  right: 0,
  background: "rgba(15, 23, 42, 0.98)",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: 12,
  minWidth: 360,
  zIndex: 20,
  color: "#e5e7eb",
  fontSize: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const row: React.CSSProperties = { display: "flex", gap: 6 };
const lbl: React.CSSProperties = { fontSize: 11, color: "#94a3b8" };
const input: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  color: "#e5e7eb",
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 12,
  width: "100%",
  boxSizing: "border-box",
};
