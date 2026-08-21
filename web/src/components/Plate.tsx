"use client";
// One data plate. KELLY and the other ten lines share this card so the
// markup, the consent gate, and the sealed handling stay identical
// everywhere; the parent timeline decides labels, specs, and masking.
import { useRef } from "react";
import clsx from "clsx";
import { useReducedMotion } from "motion/react";
import type { Plate as PlateData, PostRef } from "@/data";
import { pad2 } from "@/lib/format";
import { useReveal } from "@/lib/jump";
import { useUI } from "@/lib/ui";
import Remarks from "./Remarks";

export function embedUrl(url: string): string | null {
  const m = url.match(/activity[-:](\d+)/);
  return m ? "https://www.linkedin.com/embed/feed/update/urn:li:activity:" + m[1] : null;
}

export type Spec = { k: string; v: string; hot?: boolean };

type Props = {
  plate: PlateData;
  index: number;
  total: number;
  roleLine: string;
  specs: Spec[];
  invite: string;
  shareName: string;
  defectLabel: string;
  // Each line's renderer on the original page decides these, and the port
  // mirrors them exactly: KELLY reads posts[], the other lines read post,
  // and WRIGHT never shows a preview button.
  primary?: PostRef;
  extras?: PostRef[];
  allowPreview?: boolean;
  monthFlag?: boolean;
  hidden?: boolean;
  moreLabel?: string;
};

function MaskedName({ plate }: { plate: PlateData }) {
  const covered = plate.status === "covered";
  if (covered || !plate.redactedName) {
    return (
      <>
        {plate.name}
        {plate.variant && covered ? <span className="variant">{plate.variant}</span> : null}
      </>
    );
  }
  return (
    <>
      {[...plate.redactedName].map((ch, i) =>
        ch === "▎" || ch === "▮" ? <span className="redacted-ch" key={i}>{ch}</span> : ch,
      )}
    </>
  );
}

export default function Plate({
  plate, index, total, roleLine, specs, invite, shareName, defectLabel,
  primary, extras = [], allowPreview = true,
  monthFlag = false, hidden = false, moreLabel,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useReveal(ref, { amount: 0.05, margin: "0px 0px 12% 0px", topFactor: 1.02 });
  const { share, openForm, openEmbed } = useUI();

  const covered = plate.status === "covered";
  const emb = covered && primary && allowPreview ? embedUrl(primary.url) : null;
  const hasArt = covered && !!plate.art;

  return (
    <article
      ref={ref}
      id={plate.id}
      className={clsx("plate", covered ? "covered" : "soon", {
        "has-art": hasArt,
        visible: inView || reduceMotion,
        "hidden-card": hidden,
      })}
    >
      <div className="rivets" />
      <span className="plate-lamp" />
      <div className="plate-head brushed">
        <span className="stamp">{covered ? "Story published" : "Sealed"}</span>
        <span className="plate-no">Plate {pad2(index)} / {pad2(total)}</span>
        {monthFlag && <span className="month-flag">First flight this month</span>}
        <span className="plate-year">{plate.year}</span>
      </div>
      <div className="plate-body">
        <div className="plate-cols">
          <div className="plate-main">
            <h3><MaskedName plate={plate} /></h3>
            <div className="plate-role">{roleLine}</div>
            {covered ? (
              <p className="plate-hook">{plate.hook}</p>
            ) : (
              <div className="redaction" aria-label="Story details sealed until publication">
                {(plate.lines || [85, 70, 55]).map((w, i) => (
                  <div className="redact-line" style={{ width: `${w}%` }} key={i} />
                ))}
                <div className="redact-note">Sealed until publication.</div>
              </div>
            )}
            <div className="spec-strip">
              {specs.map((s) => (
                <div className="spec" key={s.k}>
                  <div className="spec-k">{s.k}</div>
                  <div className={clsx("spec-v", { hot: s.hot })}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="plate-actions">
              {covered && primary ? (
                <>
                  <a className="btn-read" href={primary.url} target="_blank" rel="noopener noreferrer">
                    Read the story &rarr;
                  </a>
                  {emb && (
                    <button className="btn-preview" onClick={() => openEmbed(plate.name, emb, primary.url)}>
                      Preview post
                    </button>
                  )}
                </>
              ) : (
                <a className="btn-soon" href="#alerts">Get the alert when it unseals &rarr;</a>
              )}
              <button className="btn-share" onClick={() => share(plate.id, shareName)}>Share</button>
              <button className="defect" onClick={() => openForm("9q56RV", "Defect report", defectLabel)}>
                Report a defect
              </button>
            </div>
            {extras.length > 0 && (
              <div className="more-posts">
                <div className="more-posts-label">{moreLabel || `More on the ${plate.name.split(" ")[0]}`}</div>
                {extras.map((p: PostRef) => (
                  <a className="post-chip" href={p.url} target="_blank" rel="noopener noreferrer" key={p.url}>
                    {p.label} <span className="chip-date">{p.date}</span>
                  </a>
                ))}
              </div>
            )}
            {covered && <Remarks remarks={plate.remarks} primary={primary} invite={invite} />}
          </div>
          {hasArt && (
            <div className="plate-art">
              <div dangerouslySetInnerHTML={{ __html: plate.art! }} />
              <div className="art-credit">
                {plate.artCredit}
                <br />
                {plate.artNote || "Illustration. Proportions match published dimensions; panel detail simplified."}
                <br />
                Reference art, not engineering data. Errors possible; corrections welcome.
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
