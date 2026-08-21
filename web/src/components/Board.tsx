"use client";
// THE BOARD. Everything here is computed from graph.json at load. Nothing
// is hand-listed: add a story, run the merge, and the board, the stats, and
// the ledger all change by themselves. Artifacts are laid out by date (x)
// and line (y), so a connection that crosses centuries or fields is visibly
// a long trace. Concepts have no date, so they sit in an outcomes lane
// under the artifact that produced them.
import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import clsx from "clsx";
import { useReducedMotion } from "motion/react";
import { useBoardData } from "@/lib/board-data";
import {
  LANES, TOP, laneHOf, layoutLanes, plainName, type GEdge, type Placed,
} from "@/lib/board-model";
import { jumpToPlate } from "@/lib/jump";

const FILTERS: [string, string, string][] = [
  ["line", "all", "All lines"], ["line", "kelly", "Kelly"], ["line", "petroski", "Petroski"],
  ["line", "hammurabi", "Hammurabi"], ["line", "barenyi", "Barenyi"], ["line", "tipper", "Tipper"],
  ["line", "roebling", "Roebling"], ["line", "lovelace", "Lovelace"], ["line", "wright", "Wright"],
  ["line", "sutter", "Sutter"], ["line", "carnot", "Carnot"], ["line", "noyce", "Noyce"],
  ["type", "all", "All links"], ["type", "enabled", "Enabled"], ["type", "corrects", "Corrects"],
  ["type", "responded-to", "Responded to"],
  ["mode", "board", "Board"], ["mode", "ledger", "Ledger"],
];

type BoardState = { line: string; type: string; mode: string; focus: string };

export default function Board() {
  const reduceMotion = useReducedMotion();
  const { model, failed } = useBoardData();
  const [state, setState] = useState<BoardState>({ line: "all", type: "all", mode: "board", focus: "gap" });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [inspected, setInspected] = useState<string | null>(null);
  const [noHover, setNoHover] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const hintShown = useRef(false);

  useEffect(() => {
    setNoHover(window.matchMedia("(hover: none)").matches);
  }, []);

  const activeLanes = useMemo(
    () => (state.line === "all" ? LANES : LANES.filter((L) => L.id === state.line || L.id === "concept")),
    [state.line],
  );
  const layout = useMemo(
    () => (model ? layoutLanes(model, activeLanes) : null),
    [model, activeLanes],
  );

  // When one line is in focus, outcomes shrink to the concepts that line
  // actually produced; the rest would sit as unconnected squares.
  const conceptSet = useMemo(
    () => (model && state.line !== "all" ? model.conceptsOf(state.line) : null),
    [model, state.line],
  );
  const isVisible = useCallback(
    (p: Placed) =>
      p.lane === "concept"
        ? state.line === "all" || !!conceptSet?.has(p.id)
        : state.line === "all" || p.lane === state.line,
    [state.line, conceptSet],
  );
  const edgeOk = useCallback(
    (e: GEdge) => {
      if (!model) return false;
      if (state.type !== "all" && e.type !== state.type) return false;
      const a = model.placed.find((p) => p.id === e.from);
      const b = model.placed.find((p) => p.id === e.to);
      return !!a && !!b && isVisible(a) && isVisible(b);
    },
    [model, state.type, isVisible],
  );

  // Each stat tile is a lens onto the board: clicking it lights the
  // evidence for that number and captions what you are looking at.
  const foci = useMemo(() => {
    if (!model) return null;
    const mx = model.lags[0];
    const short = (id: string) => plainName(model.byId, id);
    const F: Record<string, { edges: [string, string][]; kicker: string; html: ReactNode }> = {
      gap: {
        edges: mx ? [[mx.from.id, mx.to.id]] : [],
        kicker: "Longest wait between an idea and its use",
        html: mx ? (
          <>
            <b>{mx.years} years</b> separate {short(mx.from.id)} ({mx.from.year}) from the work that
            finally used it, {short(mx.to.id)} ({mx.to.year}). On the board it is the trace reaching
            furthest across time.
          </>
        ) : ("No dated chains yet."),
      },
      mean: {
        edges: model.meanEdges,
        kicker: "Mean idea-to-use gap",
        html: (
          <>
            On average <b>{model.avgLag} years</b> pass between an idea being recorded and the work
            that puts it to use. Every lit trace here is one of those waits.
          </>
        ),
      },
      pairs: {
        edges: model.pairEdges,
        kicker: "Plate wired to plate",
        html: (
          <>
            <b>{model.pairEdges.length} of the connections</b> run plate to plate, not plate to idea.
            That is the difference between a list and an archive that knows how its own entries
            relate. The A-12 to the SR-71 that inherited its shape is one; the P-38 to the X-1 that
            finally used its fix is another.
          </>
        ),
      },
      corrections: {
        edges: model.correctEdges,
        kicker: "Corrections to the record",
        html: (
          <>
            <b>{model.corrections.length} times</b> the famous explanation was the wrong one, and the
            record shows what actually settled it. These are the traces marked <b>corrects</b>.
          </>
        ),
      },
      verify: {
        edges: [],
        kicker: "Verified, of recorded",
        html: (
          <>
            <b>{model.verified} of {model.claims.length}</b> claims are verified. Conflicting and
            unverifiable material stays in the record, marked, and never rendered as fact. Two claims
            are marked false in public, because we published them before we checked.
          </>
        ),
      },
    };
    return F;
  }, [model]);

  const statTiles = useMemo(() => {
    if (!model) return [];
    const mx = model.lags[0];
    return [
      ["gap", mx ? mx.years + " yrs" : "n/a", "Longest idea-to-use wait"],
      ["mean", model.avgLag + " yrs", "Mean idea-to-use gap"],
      ["pairs", String(model.pairEdges.length), "Plate-to-plate links"],
      ["corrections", String(model.corrections.length), "Corrections to the record"],
      ["verify", model.verified + " / " + model.claims.length, "Claims verified, of recorded"],
    ] as [string, string, string][];
  }, [model]);

  const visiblePads = useMemo(
    () => (model ? model.placed.filter(isVisible) : []),
    [model, isVisible],
  );
  const visibleEdges = useMemo(
    () => (model ? model.syn.filter(edgeOk) : []),
    [model, edgeOk],
  );

  // Highlight resolution. A hovered or tap-inspected pad lights its own
  // links; otherwise the selected stat tile lights its evidence.
  const light = useMemo(() => {
    const activeId = hoverId || inspected;
    if (activeId && model) {
      const eset = new Set<string>();
      const linked = new Set<string>([activeId]);
      visibleEdges.forEach((e) => {
        if (e.from === activeId || e.to === activeId) {
          eset.add(e.from + "|" + e.to);
          linked.add(e.from);
          linked.add(e.to);
        }
      });
      return { eset, nset: linked, any: true, dimAllOthers: true };
    }
    const f = foci?.[state.focus];
    const eset = new Set((f?.edges || []).map(([a, b]) => a + "|" + b));
    const nset = new Set((f?.edges || []).flat());
    return { eset, nset, any: eset.size > 0, dimAllOthers: false };
  }, [hoverId, inspected, model, visibleEdges, foci, state.focus]);

  // Start the viewport where most of the archive lives, not at 1843.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !model || state.mode !== "board") return;
    const xs = visiblePads.map((p) => model.xPos.get(p.id)!).sort((a, b) => a - b);
    const medX = xs.length ? xs[Math.floor(xs.length / 2)] : 0;
    scroller.scrollLeft = Math.max(0, medX - scroller.clientWidth / 2);
  }, [model, state.mode, state.line, visiblePads]);

  // Mouse users can drag the timeline sideways; pad clicks still work
  // because a real drag suppresses the click that ends it.
  const dragS = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragS.current = { x: e.clientX, left: scrollerRef.current!.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragS.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) { d.moved = true; setDragging(true); }
    if (d.moved) scrollerRef.current!.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    if (dragS.current?.moved) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    dragS.current = null;
    setDragging(false);
  };

  // Mobile swipe hint: the board is wider than a phone and nothing said so.
  // Shows once the board is on screen, touch devices only, and retires for
  // good the first time the visitor actually swipes the board sideways.
  useEffect(() => {
    if (!noHover || !model || state.mode !== "board") return;
    let done = false;
    try { done = localStorage.getItem("sh-swipe-learned") === "1"; } catch {}
    if (done || hintShown.current) return;
    const maybeShow = () => {
      if (hintShown.current) return;
      const scroller = scrollerRef.current;
      const view = viewRef.current;
      if (!scroller || !view || scroller.scrollWidth <= scroller.clientWidth + 24) return;
      const r = view.getBoundingClientRect();
      if (!(r.top < window.innerHeight * 0.85 && r.bottom > window.innerHeight * 0.2)) return;
      hintShown.current = true;
      setHintOn(true);
      scroller.addEventListener(
        "scroll",
        () => {
          try { localStorage.setItem("sh-swipe-learned", "1"); } catch {}
          setHintOn(false);
        },
        { once: true, passive: true },
      );
      window.setTimeout(() => setHintOn(false), 7500);
    };
    window.addEventListener("scroll", maybeShow, { passive: true });
    maybeShow();
    return () => window.removeEventListener("scroll", maybeShow);
  }, [noHover, model, state.mode]);

  const openPad = (id: string) => {
    if (suppressClick.current) return;
    if (noHover && inspected !== id) {
      setInspected(id);
      return;
    }
    setInspected(null);
    jumpToPlate(id, !!reduceMotion);
  };

  // ---- caption ----
  const caption: ReactNode = useMemo(() => {
    if (!model) return null;
    if (inspected) {
      const links = visibleEdges
        .filter((e) => e.from === inspected || e.to === inspected)
        .map((e, i) => (
          <span key={i}>
            {i > 0 && <> &nbsp;&middot;&nbsp; </>}
            <b>{e.type}</b> {e.from === inspected ? <>&rarr;</> : <>&larr;</>}{" "}
            {plainName(model.byId, e.from === inspected ? e.to : e.from)}
          </span>
        ));
      return (
        <>
          <span className="bc-kicker">{plainName(model.byId, inspected)}</span>
          {links.length ? links : "No claim-cited connection recorded for this one yet."}
          . <b>Tap again to open its plate.</b>
        </>
      );
    }
    const f = foci?.[state.focus];
    if (!f) return null;
    return (
      <>
        <span className="bc-kicker">{f.kicker}</span>
        {f.html}
      </>
    );
  }, [model, inspected, visibleEdges, foci, state.focus]);

  if (failed)
    return (
      <div className="board-wrap">
        <p className="finding-body" style={{ padding: 20 }}>
          The board could not load the archive graph. The findings above stand on their own.
        </p>
      </div>
    );

  if (!model || !layout)
    return (
      <div className="board-wrap">
        <div className="board-bar">
          <div className="board-title">The board <b>/ every artifact, every wired connection</b></div>
        </div>
        <div className="board-caption">Loading the archive graph&hellip;</div>
      </div>
    );

  const { laneTop, H, yPos } = layout;
  const W = model.W;
  const axisTop = TOP, axisBot = H - 26;
  const ticks: number[] = [];
  for (let y = Math.ceil(model.Y0 / 10) * 10; y <= model.Y1; y += 10) ticks.push(y);

  // Painted last = painted on top, so the hovered label is readable.
  const padsInOrder = hoverId
    ? [...visiblePads.filter((p) => p.id !== hoverId), ...visiblePads.filter((p) => p.id === hoverId)]
    : visiblePads;

  return (
    <div className="board-wrap">
      <div className="finding-hint">Best explored on a larger screen.</div>
      <div className="board-bar">
        <div className="board-title">The board <b>/ every artifact, every wired connection</b></div>
        <div className="board-filters">
          {FILTERS.map(([k, v, label], i) => (
            <button
              key={k + v}
              className={clsx("bfilter", { on: state[k as keyof BoardState] === v })}
              style={i > 0 && FILTERS[i - 1][0] !== k ? { marginLeft: 12 } : undefined}
              onClick={() => {
                setInspected(null);
                setState((s) => ({ ...s, [k]: v }));
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="board-stats">
        {statTiles.map(([key, v, k]) => (
          <div
            key={key}
            className={clsx("bstat", { on: state.focus === key })}
            onClick={() => {
              setInspected(null);
              setState((s) => ({ ...s, focus: key }));
            }}
          >
            <div className="bstat-v">{v}</div>
            <div className="bstat-k">{k}</div>
          </div>
        ))}
      </div>
      <div className="board-caption">{caption}</div>
      <div id="board-view" ref={viewRef}>
        {state.mode === "board" ? (
          <div className="board-flex">
            <div className="board-lanecol" style={{ paddingTop: TOP }}>
              {activeLanes.map((L) => (
                <div className="blane-lbl" style={{ height: laneHOf(L.id) }} key={L.id}>
                  <span>{L.label}</span>
                </div>
              ))}
            </div>
            <div
              className={clsx("board-scroll", { dragging })}
              ref={scrollerRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: W, height: H }}
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Archive board: artifacts by date and line, with claim-cited connections"
              >
                {activeLanes.map((L) => (
                  <rect
                    key={L.id}
                    className="blane-band"
                    x={0}
                    y={laneTop.get(L.id)}
                    width={W}
                    height={laneHOf(L.id)}
                  />
                ))}
                {ticks.map((y) => (
                  <g key={y}>
                    <line className="btick" x1={model.xOf(y)} y1={axisTop} x2={model.xOf(y)} y2={axisBot} />
                    <text className="btick-label" x={model.xOf(y)} y={axisBot + 15} textAnchor="middle">
                      {y}
                    </text>
                  </g>
                ))}
                {visibleEdges.map((e, i) => {
                  const ax = model.xPos.get(e.from)!, ay = yPos.get(e.from)!;
                  const bx = model.xPos.get(e.to)!, by = yPos.get(e.to)!;
                  const mx = ax + (bx - ax) * 0.58;
                  const on = light.eset.has(e.from + "|" + e.to);
                  return (
                    <path
                      key={i}
                      className={clsx("btrace", { hot: on, dim: light.any && !on })}
                      d={`M${ax} ${ay} H${mx} V${by} H${bx}`}
                    />
                  );
                })}
                {padsInOrder.map((p) => {
                  const x = model.xPos.get(p.id)!;
                  const y = yPos.get(p.id)!;
                  const cls = p.lane === "concept" ? "sealed" : p.sealed ? "sealed" : "lit";
                  const s = p.lane === "concept" ? 7 : 9;
                  const on = light.nset.has(p.id);
                  return (
                    <g
                      key={p.id}
                      className={clsx("bpad", cls, {
                        named: on,
                        dim: light.any && !on,
                        sel: inspected === p.id,
                      })}
                      onMouseEnter={noHover ? undefined : () => setHoverId(p.id)}
                      onMouseLeave={noHover ? undefined : () => setHoverId(null)}
                      onClick={() => openPad(p.id)}
                    >
                      <rect x={x - s / 2} y={y - s / 2} width={s} height={s} />
                      <text className="bpad-name" x={x} y={y - 9} textAnchor="middle">
                        {(p.name || p.id).split("(")[0].trim().slice(0, 26)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>From</th><th>Link</th><th>To</th><th>Cited claim</th>
                <th style={{ textAlign: "right" }}>Gap</th>
              </tr>
            </thead>
            <tbody>
              {visibleEdges.map((e, i) => {
                const ya = model.arts.find((x) => x.id === e.from);
                const yb = model.arts.find((x) => x.id === e.to);
                const lag = ya && yb ? yb.year - ya.year + " yrs" : "";
                return (
                  <tr key={i}>
                    <td>{plainName(model.byId, e.from)}</td>
                    <td className="lg-type">{e.type}</td>
                    <td>{plainName(model.byId, e.to)}</td>
                    <td className="lg-claim">{e.claimId || ""}</td>
                    <td className="lg-lag">{lag}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {hintOn && (
          <div className="swipe-hint show">
            <div className="swipe-hint-pill">
              <div className="swipe-hint-row">
                <svg className="swipe-chev c1" viewBox="0 0 8 14" width="8" height="14">
                  <path d="M7 1 1 7l6 6" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg className="swipe-chev c2" viewBox="0 0 8 14" width="8" height="14">
                  <path d="M7 1 1 7l6 6" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg viewBox="0 0 26 30" width="28" height="32" aria-hidden="true">
                  <path d="M5 5.8a6.2 6.2 0 0 1 10.4 0" stroke="#10b981" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".9" />
                  <g fill="#b9c0c7">
                    <rect x="8" y="2.6" width="4.4" height="14" rx="2.2" />
                    <path d="M8 14h11.2c2.5 0 4.4 2 4.4 4.5 0 4.4-3.4 8-7.8 8h-2.6c-2.9 0-5.4-2-6-4.8l-.9-4c-.4-1.8.9-3.5 2.7-3.7z" />
                  </g>
                </svg>
              </div>
              <div className="swipe-hint-label">Swipe &middot; more of the board</div>
            </div>
          </div>
        )}
      </div>
      <div className="board-foot">
        <span>Lit <b>&#9632;</b> published</span>
        <span>Dashed <b>&#9633;</b> sealed</span>
        <span>
          Trace{" "}
          <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true" style={{ verticalAlign: "middle" }}>
            <line x1="1" y1="4" x2="15" y2="4" stroke="var(--green)" strokeWidth="1.2" />
          </svg>{" "}
          a connection citing a verified claim
        </span>
        <span><b>{model.placed.length}</b> components</span>
        <span><b>{model.syn.length}</b> traces</span>
        {noHover ? (
          <span>Tap a number above to light its evidence. Tap a component to see what it connects to, tap it again to open its plate.</span>
        ) : (
          <span>Click a number above to light its evidence. Hover a component for its own links. Click one to open its plate.</span>
        )}
      </div>
    </div>
  );
}
