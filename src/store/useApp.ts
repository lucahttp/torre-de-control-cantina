import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppData, ID } from "../types/model";
import { demoData } from "../data/demo";

interface AppState {
  data: AppData;
  selectedEntity: { type: string; id: ID } | null;
  viewMode: "operacion" | "trazabilidad" | "finanzas" | "forecast";
  setViewMode: (m: AppState["viewMode"]) => void;
  selectEntity: (e: AppState["selectedEntity"]) => void;
  resetDemo: () => void;
  importData: (d: AppData) => void;
  exportData: () => AppData;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      data: demoData,
      selectedEntity: null,
      viewMode: "operacion",
      setViewMode: (m) => set({ viewMode: m }),
      selectEntity: (e) => set({ selectedEntity: e }),
      resetDemo: () => set({ data: demoData, selectedEntity: null }),
      importData: (d) => set({ data: d }),
      exportData: () => get().data,
    }),
    { name: "cantina-graph-os" }
  )
);
