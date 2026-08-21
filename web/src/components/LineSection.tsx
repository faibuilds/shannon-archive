"use client";
// A generic line section: LOVELACE, WRIGHT, and the lines launched after
// them all render through this one component so the markup stays identical
// to KELLY's plates. One decade block per line, plates ordered by year.
import { LINE_PLATES, lineMeta } from "@/data";
import { pad2 } from "@/lib/format";
import Plate, { type Spec } from "./Plate";

export default function LineSection({ lineId }: { lineId: string }) {
  const meta = lineMeta(lineId);
  const plates = LINE_PLATES[lineId];
  const coveredN = plates.filter((a) => a.status === "covered").length;
  const lineNo = meta.tag.replace("L-", "");

  return (
    <section className="timeline-section" id={lineId}>
      <div className="line-designation">
        <div className="line-designation-inner brushed">
          <span className="ld-name">{meta.designation} <b>/ Line {lineNo}</b></span>
          <span className="ld-note">{meta.note}</span>
        </div>
      </div>
      <div className="timeline">
        <div className="decade lit">
          <div className="decade-head brushed">
            <span className="decade-lamp" />
            <div className="decade-row">
              <span className="decade-num">{meta.num}</span>
              <span className="decade-count"><b>{coveredN}</b> of {plates.length} covered</span>
            </div>
            <p className="decade-thesis">{meta.thesis}</p>
          </div>
          {plates.map((a, i) => {
            const covered = a.status === "covered";
            const spec1 = meta.spec1(a);
            const specs: Spec[] = [
              { k: spec1.k, v: spec1.v },
              { k: "Field", v: covered ? a.field! : "Sealed" },
              { k: "Status", v: covered ? "Covered" : "Sealed", hot: covered },
            ];
            return (
              <Plate
                key={a.id}
                plate={a}
                index={i + 1}
                total={plates.length}
                primary={a.post}
                allowPreview={lineId !== "wright"}
                roleLine={covered ? `${a.field} · ${a.origin}` : meta.domain}
                specs={specs}
                invite={meta.invite}
                shareName={covered ? a.name : "Sealed plate"}
                defectLabel={covered ? a.name : `${lineId.toUpperCase()} plate ${pad2(i + 1)}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
