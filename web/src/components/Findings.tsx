"use client";
// The findings: editorial readings of chains the archive already holds.
// Every edge drawn names a real synthesis edge in graph.json and the
// verified claim that licenses it; scripts/check.mjs fails the build if
// any of them stops existing.
import { useState } from "react";
import clsx from "clsx";
import { useReducedMotion } from "motion/react";
import { FINDINGS, FINDING_STATS } from "@/data";
import { pad2 } from "@/lib/format";
import { jumpToPlate } from "@/lib/jump";

const NH = 52;

export default function Findings() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const f = FINDINGS[active];
  const cy = (n: { y: number }) => n.y + NH / 2;

  return (
    <>
      <div id="finding-slot">
        <article className="finding">
          <div className="finding-kind">Finding {pad2(active + 1)} &middot; {f.kind}</div>
          <h3 className="finding-title">{f.title}</h3>
          <p className="finding-body">{f.body}</p>
          <div className="finding-figure">
            <svg viewBox={`0 0 900 ${f.vh}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={f.title}>
              {f.edges.map((e, i) => {
                const a = f.nodes[e.from];
                const b = f.nodes[e.to];
                const x1 = a.x + a.w, y1 = cy(a), x2 = b.x - 8, y2 = cy(b);
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                const d = y1 === y2
                  ? `M${x1} ${y1} L${x2} ${y2}`
                  : `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
                return (
                  <g key={i}>
                    <path className="fedge" d={d} />
                    <path className="fedge" d={`M${x2} ${y2} l-6 -3.5 M${x2} ${y2} l-6 3.5`} />
                    <text className="fedge-label" x={mx} y={my - 15} textAnchor="middle">{e.type}</text>
                    <text className="fedge-label" x={mx} y={my - 6} textAnchor="middle">{e.claim}</text>
                  </g>
                );
              })}
              {f.nodes.map((n, i) => (
                <g
                  key={i}
                  className={clsx("fnode", { terminal: n.terminal })}
                  onClick={n.id ? () => jumpToPlate(n.id!, !!reduceMotion) : undefined}
                >
                  <rect x={n.x} y={n.y} width={n.w} height={NH} />
                  <text className="fyear" x={n.x + 12} y={n.y + 19}>{n.year}</text>
                  <text x={n.x + 12} y={n.y + 37}>{n.label}</text>
                </g>
              ))}
            </svg>
          </div>
          <p className="finding-body" style={{ fontSize: 12, color: "var(--steel-faint)" }}>{f.note}</p>
        </article>
      </div>
      <div className="finding-nav">
        {FINDINGS.map((fd, i) => (
          <button
            key={i}
            className={clsx("finding-dot", { on: i === active })}
            aria-label={`Finding ${i + 1}: ${fd.kind}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </>
  );
}

export function FindingMethod() {
  const s = FINDING_STATS;
  return (
    <p className="finding-method" id="finding-method">
      <b>Method.</b> The archive is a directed graph. Every artifact, person, and source is a node.
      Every connection is a typed edge that has to cite a claim we verified, and chains are found by
      depth-first traversal of those edges rather than by intuition. <b>{s.claims}</b> claims
      recorded, <b>{s.verified}</b> verified, across <b>{s.artifacts}</b> artifacts and{" "}
      <b>{s.sources}</b> sources, joined by <b>{s.edges}</b> claim-cited connections. Conflicting and
      unverifiable material is kept in the record and never rendered. Two claims are marked false in
      public, because we published them before we checked.
    </p>
  );
}
