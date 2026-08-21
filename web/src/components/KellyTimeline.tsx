"use client";
// KELLY L-01: the military aircraft line, grouped by decade with a thesis
// per decade, a lit runway rail that follows your scroll, and the Status /
// Role filters from the sticky bar.
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, useScroll, useTransform } from "motion/react";
import {
  AIRCRAFT, DECADE_THESIS, INVITE_FLOWN, ROLE_LABEL, kellyDecades, type Plate as PlateData,
} from "@/data";
import { useKellyFilters } from "@/lib/kelly-filters";
import { pad2 } from "@/lib/format";
import Plate, { type Spec } from "./Plate";

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const matches = (a: PlateData, f: { status: string; role: string }) =>
  (f.status === "all" || a.status === f.status) && (f.role === "all" || a.role === f.role);

export default function KellyTimeline() {
  const { filters } = useKellyFilters();
  const timelineRef = useRef<HTMLDivElement>(null);

  // "First flight this month" compares against the visitor's clock, so it
  // resolves on the client; the static build carries no frozen month.
  const [thisMonth, setThisMonth] = useState<number | null>(null);
  useEffect(() => setThisMonth(new Date().getMonth()), []);

  // The rail lights down the runway as the line scrolls past 75% viewport.
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 0.75", "end 0.75"],
  });
  const litHeight = useTransform(scrollYProgress, (p) => `${p * 100}%`);

  let plateIndex = 0;

  return (
    <section className="timeline-section" id="kelly">
      <div className="line-designation">
        <div className="line-designation-inner brushed">
          <span className="ld-name">Kelly <b>/ Line 01</b></span>
          <span className="ld-note">Named for Kelly Johnson. His P-38 and U-2 both sit on this line.</span>
        </div>
      </div>
      <div className="timeline" ref={timelineRef}>
        <div className="runway">
          <motion.div className="runway-lit" style={{ height: litHeight }} />
        </div>
        {kellyDecades.map(([dec, list]) => {
          const coveredCount = list.filter((a) => a.status === "covered").length;
          const anyVisible = list.some((a) => matches(a, filters));
          return (
            <div
              className={clsx("decade", { lit: coveredCount > 0 })}
              style={anyVisible ? undefined : { display: "none" }}
              key={dec}
            >
              <div className="decade-head brushed">
                <span className="decade-lamp" />
                <div className="decade-row">
                  <span className="decade-num">{dec}s</span>
                  <span className="decade-count"><b>{coveredCount}</b> of {list.length} covered</span>
                </div>
                <p className="decade-thesis">{DECADE_THESIS[dec] || ""}</p>
              </div>
              {list.map((a) => {
                plateIndex++;
                const covered = a.status === "covered";
                const specs: Spec[] = [
                  { k: "First flight", v: covered || !a.redactedName ? a.ff! : String(a.year) },
                  { k: "Role", v: ROLE_LABEL[a.role!] },
                  { k: "Status", v: covered ? "Covered" : "Sealed", hot: covered },
                ];
                const posts = a.posts || [];
                return (
                  <Plate
                    key={a.id}
                    plate={a}
                    index={plateIndex}
                    total={AIRCRAFT.length}
                    primary={posts[0]}
                    extras={posts.slice(1)}
                    roleLine={`${ROLE_LABEL[a.role!]} · ${a.origin}`}
                    specs={specs}
                    invite={INVITE_FLOWN}
                    shareName={covered || !a.redactedName ? a.name : "Sealed plate"}
                    defectLabel={covered || !a.redactedName ? a.name : "Plate " + pad2(plateIndex)}
                    monthFlag={thisMonth !== null && MONTHS[a.ff!.slice(0, 3)] === thisMonth}
                    hidden={!matches(a, filters)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
