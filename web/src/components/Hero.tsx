"use client";
// The hero: milestone counter, headline, the live-line roster, KELLY-scoped
// stats, and the archive coverage gauge. Numbers render fully formed for
// no-JS readers and count up from zero once scrolled into view, matching
// the original page's reveal choreography.
import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import {
  AIRCRAFT, GAUGE_LINES, LINE_ORDER, kellyCovered, lastLit, litCount, totalCount,
} from "@/data";
import { fmt } from "@/lib/format";
import { jumpToPlate, jumpToSection, useReveal } from "@/lib/jump";

// Original easing: cubic ease-out, 1 - (1 - p)^3, over 1.4s.
const EASE = (p: number) => 1 - Math.pow(1 - p, 3);

// initial mirrors the original page's static HTML exactly: the milestone
// ships as "350,000" and is only overwritten once its counter starts; the
// hero stats ship as "0" and count up on reveal.
function CountUp({ target, go, initial }: { target: number; go: boolean; initial: string }) {
  const reduceMotion = useReducedMotion();
  const [text, setText] = useState(initial);
  const started = useRef(false);

  useEffect(() => {
    if (!go || started.current) return;
    started.current = true;
    if (reduceMotion) { setText(fmt(target)); return; }
    let settled = false;
    const ctrl = animate(0, target, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setText(fmt(v)),
      onComplete: () => { settled = true; },
    });
    // requestAnimationFrame pauses in a backgrounded tab. Never leave the
    // number stranded short of its real value.
    const snap = window.setTimeout(() => {
      if (!settled) { ctrl.stop(); setText(fmt(target)); }
    }, 2000);
    return () => { ctrl.stop(); window.clearTimeout(snap); };
  }, [go, target, reduceMotion]);

  return <>{text}</>;
}

function GaugeCell({
  lit, delay, revealed, title, onJump,
}: { lit: boolean; delay: number; revealed: boolean; title: string; onJump: () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!revealed || !lit) return;
    const t = window.setTimeout(() => setOn(true), delay);
    return () => window.clearTimeout(t);
  }, [revealed, lit, delay]);
  return (
    <button
      className={"cell" + (on ? " lit" : "")}
      data-lit={lit ? 1 : 0}
      title={title}
      aria-label={title}
      onClick={onJump}
    />
  );
}

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const gaugeRef = useRef<HTMLDivElement>(null);
  const msRef = useRef<HTMLSpanElement>(null);
  // The -18% bottom margin means the gauge must be genuinely up into the
  // viewport before it counts; the sweep in useReveal covers a stalled
  // observer, same as the original page.
  const gaugeInView = useReveal(gaugeRef, { amount: 0.3, margin: "0px 0px -18% 0px", topFactor: 0.82 });
  const msInView = useInView(msRef, { once: true, amount: 0.4 });
  const revealed = gaugeInView || !!reduceMotion;

  // Global cell index across every row drives the lighting stagger.
  let cellIndex = -1;

  const snapJump = (e: React.MouseEvent<HTMLDivElement>) => {
    // Cells are a few px wide on a phone, so a near miss lands in a gap.
    // Snap any tap inside a line's cell bar to the nearest cell by x.
    if ((e.target as HTMLElement).closest(".cell")) return;
    const bar = e.currentTarget;
    let best: HTMLElement | undefined;
    let bestD = Infinity;
    bar.querySelectorAll<HTMLElement>(".cell").forEach((cell) => {
      const r = cell.getBoundingClientRect();
      const d = Math.abs((r.left + r.right) / 2 - e.clientX);
      if (d < bestD) { bestD = d; best = cell; }
    });
    if (best) best.click();
  };

  return (
    <header className="hero">
      <div className="milestone">
        <span className="milestone-num" ref={msRef}>
          <CountUp target={350000} go={msInView || !!reduceMotion} initial={fmt(350000)} />
        </span>
        <span className="milestone-text">
          And growing, across Instagram, Facebook, LinkedIn and the newsletter.
          <br />
          SHANNON is our thank you.
        </span>
      </div>
      <h1>
        Why they look
        <br />
        the way <em>they do.</em>
      </h1>
      <p className="hero-sub">
        SHANNON is Engineering Community&apos;s story archive: the engineering behind aircraft and
        cars, ships and engines, computing and the chips it runs on, the failures that taught us, and
        the rules written after things went wrong. Each story is recorded as verified claims in{" "}
        <strong>one connected graph</strong>, so plates wire to the plates they enabled, answered, or
        corrected. The more it holds, the more it finds: an idea that waited 95 years for its use, a
        fix that crossed three decades, connections nobody went looking for. Lit plates link to the
        full story. Sealed plates open as we publish.
      </p>

      <div className="lines">
        {LINE_ORDER.map((l) => (
          <button
            key={l.id}
            className="line-tag active"
            onClick={() => jumpToSection(l.id, !!reduceMotion)}
          >
            <span className="lt-name">{l.label}</span>
            <span className="lt-sub">{l.tag} &middot; {l.sub} &middot; Live</span>
          </button>
        ))}
      </div>

      <div className="hero-stats">
        <div className="hero-stat">
          <div className="hero-stat-num">
            <CountUp target={AIRCRAFT.length} go={revealed} initial="0" />
          </div>
          <div className="hero-stat-label">Plates on Kelly L-01</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-num">
            <span><CountUp target={kellyCovered} go={revealed} initial="0" /></span>
            <span className="accent">&nbsp;lit</span>
          </div>
          <div className="hero-stat-label">Kelly stories published</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-num">
            <span><CountUp target={10} go={revealed} initial="0" /></span>M+
          </div>
          <div className="hero-stat-label">Views across platforms</div>
        </div>
      </div>

      <div className="gauge-wrap brushed" ref={gaugeRef}>
        <div className="gauge-label">
          <span>Archive coverage</span>
          <b>{litCount} / {totalCount} lit</b>
        </div>
        <div className="gauge-lines">
          {GAUGE_LINES.map((L) => {
            const covered = L.plates.filter((a) => a.status === "covered").length;
            return (
              <div className="gline" key={L.tag}>
                <span className="gline-label">
                  {L.label} <em>{L.tag}</em>
                </span>
                <div className="gline-cells" onClick={snapJump}>
                  {L.plates.map((a) => {
                    cellIndex++;
                    const lit = a.status === "covered";
                    const sealedHidden = !lit && a.redactedName;
                    const title =
                      a.year + " · " + (sealedHidden ? "Sealed" : a.name) + (lit ? "" : " (sealed)");
                    return (
                      <GaugeCell
                        key={a.id}
                        lit={lit}
                        delay={reduceMotion ? 0 : 250 + cellIndex * 70}
                        revealed={revealed}
                        title={title}
                        onJump={() => jumpToPlate(a.id, !!reduceMotion)}
                      />
                    );
                  })}
                </div>
                <span className="gline-count">{covered}/{L.plates.length}</span>
              </div>
            );
          })}
        </div>
        <div className="gauge-note">
          <span>
            One cell per plate, by line. <b>Click a cell to jump to its plate.</b>
          </span>
          <span className="gauge-last">{lastLit}</span>
        </div>
        <div className="gauge-sub">Kelly L-01 is our first line, and still carries most of the archive.</div>
      </div>

      <div className="hero-scroll">Scroll</div>
    </header>
  );
}
