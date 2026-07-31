"use client";
// The drifting particle field behind everything. Canvas, sized to the
// viewport, paused while the tab is hidden, absent under reduced motion.
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Pt = { x: number; y: number; vx: number; vy: number; r: number; g: boolean; p: number };

export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, raf = 0, run = true;
    let pts: Pt[] = [];

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv!.width = innerWidth * dpr;
      h = cv!.height = innerHeight * dpr;
      cv!.style.width = innerWidth + "px";
      cv!.style.height = innerHeight + "px";
    }
    function seed() {
      pts = [];
      const n = Math.min(90, Math.floor(innerWidth / 14));
      for (let i = 0; i < n; i++)
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.06 * dpr,
          vy: (Math.random() - 0.5) * 0.05 * dpr - 0.02 * dpr,
          r: (Math.random() * 1.1 + 0.4) * dpr,
          g: Math.random() < 0.16,
          p: Math.random() * Math.PI * 2,
        });
    }
    function tick() {
      if (!run) return;
      ctx!.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; p.p += 0.008;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        const tw = 0.35 + 0.3 * Math.sin(p.p);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, 6.283);
        ctx!.fillStyle = p.g
          ? "rgba(16,185,129," + tw * 0.5 + ")"
          : "rgba(180,195,210," + tw * 0.28 + ")";
        ctx!.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    const onResize = () => { size(); seed(); };
    const onVis = () => {
      run = !document.hidden;
      if (run) raf = requestAnimationFrame(tick);
    };
    size(); seed(); tick();
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      run = false;
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduceMotion]);

  return <canvas id="space" ref={ref} aria-hidden="true" />;
}
