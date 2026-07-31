"use client";
// Status and Role are KELLY's filters. The sticky bar sets them, the KELLY
// timeline applies them; both read this one piece of state.
import { createContext, useContext, useState, type ReactNode } from "react";

export type KellyFilters = { status: string; role: string };
type Ctx = {
  filters: KellyFilters;
  setFilter: (key: keyof KellyFilters, value: string) => void;
};

const FiltersCtx = createContext<Ctx | null>(null);
export const useKellyFilters = () => {
  const ctx = useContext(FiltersCtx);
  if (!ctx) throw new Error("useKellyFilters outside provider");
  return ctx;
};

export function KellyFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<KellyFilters>({ status: "all", role: "all" });
  const setFilter = (key: keyof KellyFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  return <FiltersCtx.Provider value={{ filters, setFilter }}>{children}</FiltersCtx.Provider>;
}
