// SHANNON archive data, ported byte for byte from the deployed site's inline
// arrays. The JSON files beside this module are the single source of truth;
// scripts/check.mjs validates them against the constitution before a build
// ships. Strings here are public copy: no em-dashes, no ungated names.
import kellyJson from "./kelly.json";
import linesJson from "./lines.json";
import decadeThesisJson from "./decade-thesis.json";
import roleLabelsJson from "./role-labels.json";
import findingsJson from "./findings.json";

export type PostRef = { label: string; url: string; date?: string };

// A remark renders only when cleared is true. Everything else stays a
// blanked pending block, per the consent gate in CLAUDE.md.
export type Remark = {
  name?: string;
  title?: string;
  text?: string;
  profile?: string;
  len?: number;
  cleared?: boolean;
  note?: string;
};

export type PlateStatus = "covered" | "soon";

export type Plate = {
  id: string;
  name: string;
  year: number;
  status: PlateStatus;
  ff?: string;
  pub?: string;
  date?: string;
  verdict?: string;
  origin?: string;
  role?: string;
  field?: string;
  hook?: string;
  redactedName?: string;
  variant?: string;
  lines?: number[];
  post?: PostRef;
  posts?: PostRef[];
  remarks?: Remark[];
  art?: string;
  artCredit?: string;
  artNote?: string;
};

export type FindingNode = {
  id: string | null;
  label: string;
  year: string;
  x: number;
  y: number;
  w: number;
  terminal?: boolean;
};
export type FindingEdge = { from: number; to: number; type: string; claim: string };
export type Finding = {
  kind: string;
  title: string;
  body: string;
  vh: number;
  nodes: FindingNode[];
  edges: FindingEdge[];
  note: string;
};

export const AIRCRAFT = kellyJson as unknown as Plate[];
export const LINE_PLATES = linesJson as unknown as Record<string, Plate[]>;
export const DECADE_THESIS = decadeThesisJson as Record<string, string>;
export const ROLE_LABEL = roleLabelsJson as Record<string, string>;
export const FINDINGS = findingsJson.findings as Finding[];
export const FINDING_STATS = findingsJson.stats as {
  claims: number;
  verified: number;
  sources: number;
  edges: number;
  artifacts: number;
};

export const COMPANY_URL = "https://www.linkedin.com/company/engineeringcommunity/";
export const INVITE_FLOWN =
  "Flew it, built it, or kept it flying? Tell us what you saw. Comments appear here once their author agrees.";
export const INVITE_STUDIED =
  "Studied it, taught it, or built on it? Tell us what you saw. Comments appear here once their author agrees.";

export const kellySorted = [...AIRCRAFT].sort((a, b) => a.year - b.year);

export const kellyDecades = (() => {
  const decades = new Map<number, Plate[]>();
  for (const a of kellySorted) {
    const d = Math.floor(a.year / 10) * 10;
    if (!decades.has(d)) decades.set(d, []);
    decades.get(d)!.push(a);
  }
  return [...decades.entries()].sort((a, b) => a[0] - b[0]);
})();

// Per-line config: display order, board lanes, timeline sections, filter
// pills and the hero roster all read from this one table.
export type LineMeta = {
  id: string;
  label: string;
  tag: string;
  sub: string;
  designation: string;
  note: string;
  num: string;
  thesis: string;
  spec1: (p: Plate) => { k: string; v: string };
  domain: string;
  invite: string;
};

const covered = (p: Plate) => p.status === "covered";

export const LINES: LineMeta[] = [
  {
    id: "lovelace", label: "Lovelace", tag: "L-07", sub: "Computing foundations",
    designation: "Lovelace", note: "Named for the woman who saw, in 1843, that a computing machine was never about numbers. Ordered by publication date.",
    num: "1843 to 1937", thesis: "The computing foundations: the program, the algebra, the proof that switches can carry logic.",
    spec1: (p) => ({ k: "Published", v: p.pub || "" }),
    domain: "Computing foundations", invite: INVITE_STUDIED,
  },
  {
    id: "wright", label: "Wright", tag: "L-08", sub: "Aviation foundations",
    designation: "Wright", note: "Named for Wilbur and Orville Wright. They checked the number everyone else trusted.",
    num: "1901", thesis: "Aviation's foundations: before the aircraft, the instrument that made the numbers honest.",
    spec1: (p) => ({ k: "Verdict", v: p.verdict || "" }),
    domain: "Aviation foundations", invite: INVITE_STUDIED,
  },
  {
    id: "petroski", label: "Petroski", tag: "L-02", sub: "Engineering failures",
    designation: "Petroski", note: "Named for Henry Petroski, who taught that engineering learns most from what breaks. Ordered by year.",
    num: "1940 to 1968", thesis: "Engineering failures: a bridge that shook itself apart, a tower that fell like dominoes.",
    spec1: (p) => ({ k: "Failure", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Engineering failures", invite: INVITE_STUDIED,
  },
  {
    id: "hammurabi", label: "Hammurabi", tag: "L-03", sub: "Regulation, written in blood",
    designation: "Hammurabi", note: "Named for the king whose code held a builder answerable with his own life. The rules written after disaster. Ordered by year.",
    num: "1985", thesis: "Regulation written in blood: the rules we wrote only after we counted the dead.",
    spec1: (p) => ({ k: "Accident", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Regulation, written in blood", invite: INVITE_STUDIED,
  },
  {
    id: "barenyi", label: "Barenyi", tag: "L-04", sub: "Automotive safety",
    designation: "Barenyi", note: "Named for Bela Barenyi, who saw that a car should give itself up to spare the people inside. Ordered by year.",
    num: "1951", thesis: "Automotive safety: the idea that the car should break so the people do not.",
    spec1: (p) => ({ k: "Patent", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Automotive safety", invite: INVITE_STUDIED,
  },
  {
    id: "tipper", label: "Tipper", tag: "L-05", sub: "Materials",
    designation: "Tipper", note: "Named for Constance Tipper, who showed the wartime ships cracked because of the steel, not the welds. Ordered by year.",
    num: "1943 to 2021", thesis: "Materials: how metal and print behave at the limit, and the failures that taught us to test for it.",
    spec1: (p) => ({ k: "Failure", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Materials", invite: INVITE_STUDIED,
  },
  {
    id: "sutter", label: "Sutter", tag: "L-09", sub: "Commercial aviation",
    designation: "Sutter", note: "Named for Joe Sutter, father of the 747. The jets that opened the sky, and what the first of them cost. Ordered by year.",
    num: "1952 to 1969", thesis: "Commercial aviation: the jets that opened the sky, and what the first of them paid to learn.",
    spec1: (p) => ({ k: "Milestone", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Commercial aviation", invite: INVITE_FLOWN,
  },
  {
    id: "carnot", label: "Carnot", tag: "L-10", sub: "Prime movers",
    designation: "Carnot", note: "Named for Sadi Carnot, who found the limit on every heat engine. The machines that turn fuel into work. Ordered by year.",
    num: "1897", thesis: "Prime movers: the engines that turn fuel into work, and the people who bet their lives on them.",
    spec1: (p) => ({ k: "First run", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Prime movers", invite: INVITE_STUDIED,
  },
  {
    id: "noyce", label: "Noyce", tag: "L-11", sub: "Semiconductors",
    designation: "Noyce", note: "Named for Robert Noyce, co-inventor of the integrated circuit and co-founder of Intel. The chip, and the machines that make it. Ordered by year.",
    num: "1947 to 2012", thesis: "Semiconductors: the transistor, the foundry, the machine, the chip, and the bet that put intelligence on silicon.",
    spec1: (p) => ({ k: "Milestone", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Semiconductors", invite: INVITE_STUDIED,
  },
  {
    id: "roebling", label: "Roebling", tag: "L-06", sub: "Structures",
    designation: "Roebling", note: "Named for the Roebling family, who built the Brooklyn Bridge. Structures, and the safety margin that holds them up. Ordered by year.",
    num: "1858 to 1907", thesis: "Structures: one quantity, the safety margin, told three ways. Bought in advance at London, absorbed by a crime at Brooklyn, spent in the design office at Quebec.",
    spec1: (p) => ({ k: "Built", v: covered(p) ? p.date || "" : "Sealed" }),
    domain: "Structures", invite: INVITE_STUDIED,
  },
];

export const lineMeta = (id: string) => LINES.find((l) => l.id === id)!;

// Hero roster and filter pill order (KELLY first, then by line number).
export const LINE_ORDER = [
  { id: "kelly", label: "Kelly", tag: "L-01", sub: "Military aircraft" },
  ...["petroski", "hammurabi", "barenyi", "tipper", "roebling", "lovelace", "wright", "sutter", "carnot", "noyce"]
    .map((id) => lineMeta(id))
    .sort((a, b) => a.tag.localeCompare(b.tag))
    .map(({ id, label, tag, sub }) => ({ id, label, tag, sub })),
];

// Timeline section order matches the deployed page: KELLY, LOVELACE, WRIGHT,
// then the seven lines launched together, ROEBLING last.
export const TIMELINE_ORDER = [
  "lovelace", "wright", "petroski", "hammurabi", "barenyi",
  "tipper", "sutter", "carnot", "noyce", "roebling",
];

export const ALL_PLATES: Plate[] = [
  ...AIRCRAFT,
  ...LINE_PLATES.lovelace, ...LINE_PLATES.wright, ...LINE_PLATES.petroski,
  ...LINE_PLATES.hammurabi, ...LINE_PLATES.barenyi, ...LINE_PLATES.tipper,
  ...LINE_PLATES.roebling, ...LINE_PLATES.sutter, ...LINE_PLATES.carnot,
  ...LINE_PLATES.noyce,
];

export const litCount = ALL_PLATES.filter(covered).length;
export const totalCount = ALL_PLATES.length;
export const sealedCount = totalCount - litCount;
export const kellyCovered = AIRCRAFT.filter(covered).length;

// One gauge row per live line, all derived from the plate arrays above so
// the numbers can never drift from the plate data.
export const GAUGE_LINES = [
  { label: "Kelly", tag: "L-01", plates: kellySorted },
  { label: "Petroski", tag: "L-02", plates: LINE_PLATES.petroski },
  { label: "Hammurabi", tag: "L-03", plates: LINE_PLATES.hammurabi },
  { label: "Barenyi", tag: "L-04", plates: LINE_PLATES.barenyi },
  { label: "Tipper", tag: "L-05", plates: LINE_PLATES.tipper },
  { label: "Roebling", tag: "L-06", plates: LINE_PLATES.roebling },
  { label: "Lovelace", tag: "L-07", plates: LINE_PLATES.lovelace },
  { label: "Wright", tag: "L-08", plates: LINE_PLATES.wright },
  { label: "Sutter", tag: "L-09", plates: LINE_PLATES.sutter },
  { label: "Carnot", tag: "L-10", plates: LINE_PLATES.carnot },
  { label: "Noyce", tag: "L-11", plates: LINE_PLATES.noyce },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The most recently lit plate, judged by the newest parseable post date.
export const lastLit = (() => {
  const stamped = ALL_PLATES.filter(covered)
    .map((a) => {
      const posts = a.posts || (a.post ? [a.post] : []);
      const stamps = posts.map((p) => Date.parse(p.date || "")).filter((n) => !isNaN(n));
      return { a, t: stamps.length ? Math.max(...stamps) : -Infinity };
    })
    .sort((x, y) => y.t - x.t)[0];
  if (!stamped || !isFinite(stamped.t)) return null;
  const d = new Date(stamped.t);
  return `Last lit: ${stamped.a.name}, ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
})();
