"use client";
// Crew remarks, shared by every line so the consent model and the markup
// stay identical everywhere. Only the invitation changes per line, because
// "flew it" does not fit a paper on logic. Renders on covered plates only:
// a sealed plate has no published post, so there is nothing to remark on.
// A remark shows a name and text ONLY when cleared is true; everything else
// stays a blanked pending block. That gate is the constitution, not styling.
import type { PostRef, Remark } from "@/data";
import { useUI } from "@/lib/ui";

function redactLines(L: number): number[] {
  const n = Math.max(2, Math.min(4, Math.ceil(L / 90)));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const seed = (L * (i + 3)) % 26;
    out.push(i === n - 1 ? 40 + seed : 76 + (seed % 22));
  }
  return out;
}

const initials = (name: string) =>
  name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();

export default function Remarks({
  remarks, primary, invite,
}: { remarks?: Remark[]; primary?: PostRef; invite: string }) {
  const { openForm } = useUI();
  const list = remarks && remarks.length ? remarks : [{} as Remark];
  return (
    <div className="remarks">
      <div className="remarks-label">Crew remarks</div>
      <p className="remarks-invite">{invite}</p>
      {list.map((r, i) =>
        r.cleared ? (
          <div className="remark" key={i}>
            <div className="avatar">{initials(r.name || "")}</div>
            <div className="remark-body">
              <div className="remark-meta">
                {r.profile ? (
                  <a className="remark-name" href={r.profile} target="_blank" rel="noopener noreferrer">
                    {r.name}
                  </a>
                ) : (
                  <span className="remark-name">{r.name}</span>
                )}
                <span className="remark-title">{r.title}</span>
              </div>
              <p className="remark-text">{r.text}</p>
              {primary && (
                <a className="remark-src" href={primary.url} target="_blank" rel="noopener noreferrer">
                  From the comments &rarr;
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="remark pending" key={i}>
            <span className="pending-stamp">Awaiting consent</span>
            <div className="avatar">&#9646;&#9646;</div>
            <div className="remark-body">
              <div className="remark-meta">
                <span className="pending-name" />
                <span className="pending-title" />
              </div>
              <div className="pending-text">
                {redactLines(r.len || 120).map((w, j) => (
                  <div className="pl" style={{ width: `${w}%` }} key={j} />
                ))}
              </div>
            </div>
          </div>
        ),
      )}
      <button className="remark-submit" onClick={() => openForm("GxyoQZ", "Crew remarks")}>
        Submit a remark &rarr;
      </button>
    </div>
  );
}
