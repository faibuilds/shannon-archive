import { useEffect, useState, type RefObject } from "react";
import { useInView } from "motion/react";

// Reveal-on-view with the original page's safety net for a stalled
// IntersectionObserver: a passive scroll/resize sweep that bails at
// scrollY 0, so a mobile URL bar inflating innerHeight at load (or a
// background tab whose rendering steps are skipped) cannot strand content
// unrevealed or reveal it early.
export function useReveal(
  ref: RefObject<HTMLElement | null>,
  opts: { amount: number; margin?: string; topFactor: number },
): boolean {
  const inView = useInView(ref, {
    once: true,
    amount: opts.amount,
    margin: (opts.margin || "0px") as never,
  });
  const [swept, setSwept] = useState(false);

  useEffect(() => {
    if (inView || swept) return;
    const sweep = () => {
      if ((window.scrollY || document.documentElement.scrollTop || 0) < 1) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * opts.topFactor && r.bottom > 0) setSwept(true);
    };
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });
    sweep();
    return () => {
      window.removeEventListener("scroll", sweep);
      window.removeEventListener("resize", sweep);
    };
  }, [inView, swept, ref, opts.topFactor]);

  return inView || swept;
}

// Jump-to-plate: gauge cells, finding nodes, board pads and #hash links all
// land on a plate the same way: scroll it to center and flash its border.
export function jumpToPlate(id: string, reduceMotion: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  el.classList.add("flash");
  window.setTimeout(() => el.classList.remove("flash"), 2600);
}

export function jumpToSection(id: string, reduceMotion: boolean) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}
