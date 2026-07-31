"use client";
// The sticky filter strip. The line jump pills track which section you are
// in; Status and Role only apply to KELLY, so they hide on other lines.
// On a phone the strip collapses to one row with a toggle, and slides away
// entirely once you scroll past the last line section.
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useReducedMotion } from "motion/react";
import { AIRCRAFT, LINE_ORDER } from "@/data";
import { useKellyFilters } from "@/lib/kelly-filters";
import { jumpToSection } from "@/lib/jump";

const LINE_IDS = LINE_ORDER.map((l) => l.id);
const STATUS_PILLS = [
  ["all", "All"], ["covered", "Covered"], ["soon", "Sealed"],
] as const;
const ROLE_PILLS = [
  ["all", "All"], ["fighter", "Fighters"], ["bomber", "Bombers"], ["attack", "Attack"],
  ["recon", "Recon"], ["experimental", "Experimental"], ["transport", "Transport"],
] as const;

export default function FiltersBar() {
  const reduceMotion = useReducedMotion();
  const { filters, setFilter } = useKellyFilters();
  const [current, setCurrent] = useState("kelly");
  const [open, setOpen] = useState(false);
  const [pastLines, setPastLines] = useState(false);

  useEffect(() => {
    const syncLine = () => {
      const probe = window.innerHeight * 0.35;
      let cur: string | null = null;
      for (const id of LINE_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) cur = id;
      }
      setCurrent(cur || "kelly");
      // Past the last line section the jump bar has nothing to point at, so
      // it slides away instead of riding over the board and footer.
      const lastSec = document.getElementById("roebling");
      setPastLines(!!lastSec && lastSec.getBoundingClientRect().bottom < 60);
    };
    window.addEventListener("scroll", syncLine, { passive: true });
    window.addEventListener("resize", syncLine, { passive: true });
    syncLine();
    return () => {
      window.removeEventListener("scroll", syncLine);
      window.removeEventListener("resize", syncLine);
    };
  }, []);

  const visibleCount = AIRCRAFT.filter(
    (a) =>
      (filters.status === "all" || a.status === filters.status) &&
      (filters.role === "all" || a.role === filters.role),
  ).length;

  const currentLabel = LINE_ORDER.find((l) => l.id === current)?.label || "Kelly";

  return (
    <div
      className={clsx("filters", {
        "on-kelly": current === "kelly",
        open,
        "past-lines": pastLines,
      })}
      id="filters"
    >
      <button
        className="filters-toggle"
        aria-expanded={open}
        aria-controls="filters"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ftg-label">Line</span>
        <span className="ftg-current">{currentLabel}</span>
        <span className="ftg-x" aria-hidden="true" />
      </button>
      <div className="filter-group">
        <span className="filter-group-label">Line</span>
        {LINE_ORDER.map((l) => (
          <button
            key={l.id}
            className={clsx("pill line-jump", { active: current === l.id })}
            onClick={() => {
              jumpToSection(l.id, !!reduceMotion);
              setOpen(false); /* picked a line, put the strip away */
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="filter-group kelly-only">
        <span className="filter-group-label">Status</span>
        {STATUS_PILLS.map(([v, label]) => (
          <button
            key={v}
            className={clsx("pill", { active: filters.status === v, "pill-soon": v === "soon" })}
            onClick={() => setFilter("status", v)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-group kelly-only">
        <span className="filter-group-label">Role</span>
        {ROLE_PILLS.map(([v, label]) => (
          <button
            key={v}
            className={clsx("pill", { active: filters.role === v })}
            onClick={() => setFilter("role", v)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-count kelly-only">
        <b>{visibleCount}</b> airframes shown
      </div>
    </div>
  );
}
