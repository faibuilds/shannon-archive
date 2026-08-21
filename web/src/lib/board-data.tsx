"use client";
// One fetch of graph.json for the whole page. The board and the floating
// minimap read the same model, so a component sits at the same year and
// lane in both, and the archive is only downloaded once.
import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { buildModel, type Graph, type Model } from "./board-model";

type Ctx = { model: Model | null; failed: boolean };

const BoardCtx = createContext<Ctx>({ model: null, failed: false });
export const useBoardData = () => useContext(BoardCtx);

export function BoardDataProvider({ children }: { children: ReactNode }) {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/graph.json", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((g) => { if (live) setGraph(g); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, []);

  const model = useMemo(() => (graph ? buildModel(graph) : null), [graph]);
  const value = useMemo(() => ({ model, failed }), [model, failed]);

  return <BoardCtx.Provider value={value}>{children}</BoardCtx.Provider>;
}
