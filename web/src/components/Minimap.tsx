"use client";
// The floating mini board. Once you scroll past the full board and into the
// lines, this keeps the graph in the corner and marks where you are reading:
// a playhead on the time axis, the lane of the line you are in, and the
// component itself lit with whatever it connects to. It is a position
// indicator, so it never carries a story: a sealed plate reads "Sealed"
// here exactly as it does on the gauge.
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useReducedMotion } from "motion/react";
import { AIRCRAFT, LINE_ORDER, LINE_PLATES, type Plate } from "@/data";
import { useBoardData } from "@/lib/board-data";
import { LANES } from "@/lib/board-model";
import { jumpToPlate, jumpToSection } from "@/lib/jump";

const W = 264, ML = 9, MR = 9, TOP = 7, LANE_H = 7, AXIS_Y = 107, H = 113;
const LANE_IDS = LANES.map((l) => l.id);
const laneTop = (id: string) => TOP + Math.max(0, LANE_IDS.indexOf(id)) * LANE_H;
const laneMid = (id: string) => laneTop(id) + LANE_H / 2;
const LANES_BOTTOM = TOP + LANE_IDS.length * LANE_H;

type Entry = { year: number; lane: string; label: string; line: string; sealed: boolean };

// Every plate on the page, by id: the year and lane put it on the axis, and
// the label follows the gauge's rule, so a masked plate is only ever
// "Sealed" and never leaks a name the site has not published.
const PLATE_INDEX: Map<string, Entry> = (() => {
  const m = new Map<string, Entry>();
  const lineName = (id: string) => {
    const l = LINE_ORDER.find((x) => x.id === id);
    return l ? `${l.label} ${l.tag}` : id;
  };
  const label = (p: Plate) => (p.status !== "covered" && p.redactedName ? "Sealed" : p.name);
  const add = (p: Plate, lane: string) =>
    m.set(p.id, {
      year: p.year, lane, label: label(p), line: lineName(lane),
      sealed: p.status !== "covered",
    });
  for (const p of AIRCRAFT) add(p, "kelly");
  for (const [lineId, arr] of Object.entries(LINE_PLATES)) for (const p of arr) add(p, lineId);
  return m;
})();

export default function Minimap() {
  const { model } = useBoardData();
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const raf = useRef(0);

  // One rAF-throttled pass answers both questions: are we past the board and
  // still inside the lines, and which plate is the reader looking at.
  useEffect(() => {
    const measure = () => {
      raf.current = 0;
      const findings = document.getElementById("findings");
      const lastLine = document.getElementById("roebling");
      const past = !!findings && findings.getBoundingClientRect().bottom < 80;
      const within = !!lastLine && lastLine.getBoundingClientRect().bottom > 220;
      setShown(past && within);
      if (!past || !within) return;
      const probe = window.innerHeight * 0.42;
      let bestId = "";
      let bestD = Infinity;
      document.querySelectorAll<HTMLElement>(".plate").forEach((el) => {
        if (el.classList.contains("hidden-card")) return;
        const r = el.getBoundingClientRect();
        const d = r.top <= probe && r.bottom >= probe
          ? 0
          : Math.min(Math.abs(r.top - probe), Math.abs(r.bottom - probe));
        if (d < bestD) { bestD = d; bestId = el.id; }
      });
      if (bestId) setCurrentId(bestId);
    };
    const onScroll = () => { if (!raf.current) raf.current = requestAnimationFrame(measure); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const placedById = useMemo(
    () => (model ? new Map(model.placed.map((p) => [p.id, p])) : null),
    [model],
  );

  const entry = currentId ? PLATE_INDEX.get(currentId) : undefined;

  const geom = useMemo(() => {
    if (!model) return null;
    const xOf = (year: number) =>
      ML + ((year - model.Y0) / (model.Y1 - model.Y0)) * (W - ML - MR);
    const ticks: number[] = [];
    for (let y = Math.ceil(model.Y0 / 50) * 50; y <= model.Y1; y += 50) ticks.push(y);
    return { xOf, ticks };
  }, [model]);

  // The traces the current component is part of, in minimap coordinates.
  const links = useMemo(() => {
    if (!model || !geom || !placedById || !currentId || !placedById.has(currentId)) return [];
    return model.syn
      .filter((e) => e.from === currentId || e.to === currentId)
      .map((e) => {
        const a = placedById.get(e.from);
        const b = placedById.get(e.to);
        if (!a || !b) return null;
        return {
          x1: geom.xOf(a.year), y1: laneMid(a.lane),
          x2: geom.xOf(b.year), y2: laneMid(b.lane),
        };
      })
      .filter((l): l is NonNullable<typeof l> => !!l);
  }, [model, geom, placedById, currentId]);

  if (!model || !geom || dismissed) return null;

  const linked = new Set<string>(currentId ? [currentId] : []);
  if (currentId)
    model.syn.forEach((e) => {
      if (e.from === currentId) linked.add(e.to);
      if (e.to === currentId) linked.add(e.from);
    });

  const headX = entry ? geom.xOf(entry.year) : null;
  const onPad = !!(currentId && placedById?.has(currentId));
  const move = reduceMotion ? undefined : "transform .4s cubic-bezier(.16,1,.3,1)";

  return (
    <aside
      className={clsx("minimap", { show: shown })}
      aria-hidden={!shown}
      aria-label="Your position on the archive board"
    >
      <div className="minimap-head">
        <button
          className="minimap-tag"
          onClick={() => jumpToSection("findings", !!reduceMotion)}
          title="Back to the full board"
        >
          On the board <b>/ where you are</b>
        </button>
        <button className="minimap-x" aria-label="Hide the mini board" onClick={() => setDismissed(true)}>
          &times;
        </button>
      </div>

      <svg
        className="minimap-svg"
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={entry ? `${entry.line}, ${entry.year}, ${entry.label}` : "Archive board overview"}
      >
        {/* the lane you are reading */}
        {entry && (
          <rect
            className="mm-lane-on"
            x={0}
            y={laneTop(entry.lane)}
            width={W}
            height={LANE_H}
            style={{ transition: reduceMotion ? undefined : "y .4s cubic-bezier(.16,1,.3,1)" }}
          />
        )}

        {/* every component in the archive, by year and line */}
        {model.placed.map((p) => {
          const s = p.lane === "concept" ? 2 : 3;
          const on = linked.has(p.id);
          return (
            <rect
              key={p.id}
              className={clsx("mm-pad", p.lane === "concept" || p.sealed ? "sealed" : "lit", { on })}
              x={geom.xOf(p.year) - s / 2}
              y={laneMid(p.lane) - s / 2}
              width={s}
              height={s}
              onClick={() => jumpToPlate(p.id, !!reduceMotion)}
            >
              <title>{p.name || p.id}</title>
            </rect>
          );
        })}

        {/* what the current component connects to */}
        {links.map((l, i) => (
          <path key={i} className="mm-trace" d={`M${l.x1} ${l.y1} L${l.x2} ${l.y2}`} />
        ))}

        {/* the playhead: where the page you are reading sits in time */}
        {headX !== null && (
          <g style={{ transform: `translateX(${headX}px)`, transition: move }}>
            <line className="mm-head" x1={0} y1={TOP - 3} x2={0} y2={LANES_BOTTOM + 1} />
            <path className="mm-head-cap" d="M-3 1 L3 1 L0 5 Z" transform={`translate(0 ${TOP - 5})`} />
          </g>
        )}

        {/* the component itself, when the plate is on the board */}
        {onPad && entry && (
          <g
            style={{
              transform: `translate(${geom.xOf(placedById!.get(currentId!)!.year)}px, ${laneMid(placedById!.get(currentId!)!.lane)}px)`,
              transition: move,
            }}
          >
            <rect className="mm-here-ring" x={-4.5} y={-4.5} width={9} height={9} />
            <rect className="mm-here" x={-2.5} y={-2.5} width={5} height={5} />
          </g>
        )}

        {geom.ticks.map((y) => (
          <text key={y} className="mm-tick" x={geom.xOf(y)} y={AXIS_Y} textAnchor="middle">
            {y}
          </text>
        ))}
      </svg>

      <div className="minimap-foot">
        <span className="mm-line">
          {entry ? entry.line : "The archive"}
          {entry?.sealed && <em>Sealed</em>}
        </span>
        <span className="mm-now">
          {entry ? `${entry.year} · ${entry.label}` : "Scroll the lines"}
        </span>
      </div>
    </aside>
  );
}
