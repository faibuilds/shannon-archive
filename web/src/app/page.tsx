import Nav from "@/components/Nav";
import Bulletin from "@/components/Bulletin";
import Hero from "@/components/Hero";
import FiltersBar from "@/components/FiltersBar";
import Findings, { FindingMethod } from "@/components/Findings";
import Board from "@/components/Board";
import KellyTimeline from "@/components/KellyTimeline";
import LineSection from "@/components/LineSection";
import Alerts from "@/components/Alerts";
import HashJump from "@/components/HashJump";
import Minimap from "@/components/Minimap";
import { Bench, Lore, Support, Footer } from "@/components/Lower";
import { BoardDataProvider } from "@/lib/board-data";
import { KellyFiltersProvider } from "@/lib/kelly-filters";
import { TIMELINE_ORDER } from "@/data";

export default function Page() {
  return (
    <BoardDataProvider>
    <KellyFiltersProvider>
      <Nav />
      <Bulletin />
      <Hero />
      <FiltersBar />

      <a className="to-findings" href="#findings">Jump to the findings and board &darr;</a>

      <section className="findings" id="findings">
        <div className="findings-head">
          <div className="findings-tag">Findings</div>
          <h2 className="findings-lead">
            The archive is a graph, not a list. These are the connections it holds.
          </h2>
          <div className="findings-sub">
            Found by walking it, and drawn only where a verified claim supports the link. Explore the
            whole machine on the board below.
          </div>
        </div>
        <noscript>
          <p>
            SHANNON is Engineering Community&apos;s public archive of engineering history, read as a
            connected graph. The findings below and the interactive board are generated from that
            graph. Every connection shown cites a verified claim and a named source.
          </p>
          <p>
            <b>Convergence.</b> Ada Lovelace wrote in 1843 that Babbage&apos;s Analytical Engine
            might act on things besides number, if their relations could be expressed symbolically.
            George Boole gave logic an algebra in 1854. In 1937 Claude Shannon, then 21, proved that
            Boolean algebra describes electrical switching circuits, and that correspondence
            underlies every digital device since. Two papers written eleven years and no contact
            apart meet in one thesis and end up in every processor.
          </p>
          <p>
            <b>Constraint genealogy.</b> NACA proposed an adjustable stabilizer during the P-38
            Lightning compressibility investigation. It did not save the P-38. The idea waited until
            the Bell X-1, where a movable tail gave Chuck Yeager pitch authority past Mach 1. Every
            supersonic fighter that followed carries it, the F-15 Eagle among them.
          </p>
          <p>
            The board plots every artifact in the archive by year and by line, and draws a trace for
            each connection that cites a verified claim. Ten lines are live, from Kelly&apos;s
            military aircraft and Noyce&apos;s semiconductors to the failures, materials, and rules
            written after things went wrong, with one more in fabrication.
          </p>
        </noscript>
        <Findings />
        <Board />
        <FindingMethod />
      </section>

      <KellyTimeline />
      {TIMELINE_ORDER.map((id) => (
        <LineSection key={id} lineId={id} />
      ))}

      <Alerts />
      <Bench />
      <Lore />
      <Support />
      <Footer />
      <HashJump />
      <Minimap />
    </KellyFiltersProvider>
    </BoardDataProvider>
  );
}
