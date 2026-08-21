// The archive graph, read into a layout. Shared by the full board and the
// floating minimap so both place a component at exactly the same year and
// lane. Everything here is computed from graph.json: nothing is hand-listed.
export type GNode = {
  id: string;
  type: string;
  name?: string;
  lineId?: string;
  sealed?: boolean;
  status?: string;
  date?: { year: number };
};
export type GEdge = { from: string; to: string; type: string; claimId?: string };
export type Graph = { nodes: GNode[]; edges: GEdge[] };

export const SYNTH = ["enabled", "forced", "responded-to", "corrects"];
export const LANES = [
  { id: "kelly", label: "Kelly L-01" }, { id: "petroski", label: "Petroski L-02" },
  { id: "hammurabi", label: "Hammurabi L-03" }, { id: "barenyi", label: "Barenyi L-04" },
  { id: "tipper", label: "Tipper L-05" }, { id: "roebling", label: "Roebling L-06" },
  { id: "lovelace", label: "Lovelace L-07" },
  { id: "wright", label: "Wright L-08" }, { id: "sutter", label: "Sutter L-09" },
  { id: "carnot", label: "Carnot L-10" }, { id: "noyce", label: "Noyce L-11" },
  { id: "other", label: "Unassigned" }, { id: "concept", label: "Outcomes" },
];

// The axis gets real room: about 11px per year instead of squeezing two
// centuries into one screen width. The board scrolls sideways; lane labels
// live in a sticky HTML column so they never scroll away with the timeline.
export const ML = 14, MR = 30, TOP = 10, LANE_H = 58, PXY = 11;
export const laneHOf = (id: string) => (id === "concept" ? Math.round(LANE_H * 2.1) : LANE_H);

export type Placed = GNode & { year: number; lane: string };

export function buildModel(g: Graph) {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const yearOf = (id: string) => {
    const ys = g.edges
      .filter((x) => x.type === "event-of" && x.to === id)
      .map((x) => byId.get(x.from))
      .filter((n): n is GNode => !!n && !!n.date)
      .map((n) => n.date!.year);
    return ys.length ? Math.min(...ys) : null;
  };
  const arts = g.nodes
    .filter((n) => n.type === "artifact")
    .map((a) => ({ ...a, year: yearOf(a.id) }))
    .filter((a): a is GNode & { year: number } => a.year !== null);
  const syn = g.edges.filter((e) => SYNTH.includes(e.type));
  const laneOf = (a: GNode) => (LANES.some((l) => l.id === a.lineId) ? a.lineId! : "other");

  // Place concepts under the earliest artifact that produced them.
  const concepts: Placed[] = [];
  g.nodes
    .filter((n) => n.type === "concept")
    .forEach((c) => {
      const src = syn
        .filter((e) => e.to === c.id)
        .map((e) => arts.find((a) => a.id === e.from))
        .filter((a): a is GNode & { year: number } => !!a);
      if (src.length)
        concepts.push({ ...c, year: Math.min(...src.map((s) => s.year)), lane: "concept" });
    });
  const placed: Placed[] = arts.map((a) => ({ ...a, lane: laneOf(a) })).concat(concepts);

  const years = placed.map((p) => p.year);
  const Y0 = Math.floor(Math.min(...years) / 10) * 10 - 4;
  const Y1 = Math.ceil(Math.max(...years) / 10) * 10 + 4;
  const W = Math.max(940, ML + MR + (Y1 - Y0) * PXY);
  const xOf = (y: number) => ML + ((y - Y0) / (Y1 - Y0)) * (W - ML - MR);
  const xPos = new Map(placed.map((p) => [p.id, xOf(p.year)]));

  // ---- computed statistics ----
  const lags = syn
    .filter((e) => e.type === "enabled")
    .map((e) => {
      const a = arts.find((x) => x.id === e.from);
      const b = arts.find((x) => x.id === e.to);
      return a && b ? { years: b.year - a.year, from: a, to: b } : null;
    })
    .filter((l): l is NonNullable<typeof l> => !!l)
    .sort((a, b) => b.years - a.years);
  const claims = g.nodes.filter((n) => n.type === "claim");
  const corrections = syn.filter((e) => e.type === "corrects");
  const avgLag = lags.length ? Math.round(lags.reduce((s, l) => s + l.years, 0) / lags.length) : 0;
  const verified = claims.filter((c) => c.status === "verified").length;
  // Connections that run plate to plate, not plate to idea: the archive
  // wiring its own entries to each other.
  const pairEdges = syn
    .filter((e) => arts.some((a) => a.id === e.from) && arts.some((a) => a.id === e.to))
    .map((e) => [e.from, e.to] as [string, string]);
  const meanEdges = syn
    .filter((e) => e.type === "enabled" && arts.some((a) => a.id === e.from) && arts.some((a) => a.id === e.to))
    .map((e) => [e.from, e.to] as [string, string]);
  const correctEdges = corrections.map((e) => [e.from, e.to] as [string, string]);

  const conceptsOf = (line: string) =>
    new Set(
      syn
        .filter((e) => {
          const a = arts.find((x) => x.id === e.from);
          return a && laneOf(a) === line;
        })
        .map((e) => e.to),
    );

  return {
    byId, arts, syn, placed, xPos, Y0, Y1, W,
    xOf, laneOf, conceptsOf,
    lags, claims, corrections, avgLag, verified, pairEdges, meanEdges, correctEdges,
  };
}
export type Model = ReturnType<typeof buildModel>;

// Per-draw layout: which lanes are on the board (filtering to one line
// collapses the board to that line plus outcomes), and greedy row placement
// inside each lane: a pad takes the first row that is free at its x, so
// pads can never sit on top of each other no matter how dense a decade gets.
export function layoutLanes(model: Model, activeLanes: typeof LANES) {
  let yCursor = TOP;
  const laneTop = new Map<string, number>();
  activeLanes.forEach((L) => { laneTop.set(L.id, yCursor); yCursor += laneHOf(L.id); });
  const H = yCursor + 26;
  const yPos = new Map<string, number>();
  activeLanes.forEach((L) => {
    const lh = laneHOf(L.id);
    const rows = Math.max(3, Math.floor((lh - 8) / 12));
    const mid = laneTop.get(L.id)! + lh / 2;
    const rowY = (r: number) => mid + Math.ceil(r / 2) * (r % 2 ? -12 : 12);
    const lastAt = new Array(rows).fill(-1e9);
    model.placed
      .filter((p) => p.lane === L.id)
      .sort((a, b) => a.year - b.year || String(a.id).localeCompare(String(b.id)))
      .forEach((p) => {
        const x = model.xPos.get(p.id)!;
        let best = 0, bestGap = -1e9;
        for (let r = 0; r < rows; r++) {
          const gap = x - lastAt[r];
          if (gap >= 12) { best = r; break; }
          if (gap > bestGap) { bestGap = gap; best = r; }
        }
        lastAt[best] = x;
        yPos.set(p.id, rowY(best));
      });
  });
  return { laneTop, H, yPos };
}

export const plainName = (byId: Map<string, GNode>, id: string) =>
  ((byId.get(id) || {}).name || id).split("(")[0].trim();
