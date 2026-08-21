// The static lower bands: the bench, the lore, the support band, and the
// footer with the version stamp.
export function Bench() {
  return (
    <section className="bench">
      <div className="bench-head">
        <div className="bench-tag">On the bench</div>
        <div className="bench-sub">One story on the bench, sealed until publication.</div>
      </div>
      <div className="bench-grid">
        <div className="bench-card">
          <span className="bench-stamp">Publishing soon</span>
          <div className="bench-line">Line: Tipper</div>
          <div className="bench-title">
            The accident was the <b>▮▮▮▮▮▮</b>. The rest was <b>▮▮▮▮▮▮▮▮</b>.
          </div>
        </div>
      </div>
    </section>
  );
}

export function Lore() {
  return (
    <section className="lore">
      <div className="lore-inner brushed">
        <div className="lore-tag">The name</div>
        <h2>Why Shannon.</h2>
        <p>
          In 1950, Claude Shannon and his wife Betty built <b>Theseus</b>: a mechanical mouse that
          could learn its way through a maze, one of the first machines that learned anything at all.
          The trick was that the mouse was never the brain. The intelligence lived under the floor, in
          a bank of telephone relays that remembered every corridor, so the mouse never had to search
          the same path twice.
        </p>
        <p>
          That is what this archive is. The stories explore. The archive remembers. <b>SHANNON</b>{" "}
          carries the name of the engineer who measured information itself, and each line carries the
          name of an engineer who defined its field. <b>KELLY</b>, for Kelly Johnson, is the first.
        </p>
      </div>
    </section>
  );
}

export function Support() {
  return (
    <section className="support">
      <div className="support-inner">
        <div className="support-cell brushed">
          <div className="support-tag">Keep the line lit</div>
          <h2>Fuel the next story.</h2>
          <p>
            Every plate on this line takes days of research: primary sources, declassified reports,
            fact-checks that kill half our best lines. The stories stay free and the feed stays
            organic. If they have been worth your time, you can put fuel in the next one, or just
            follow along. Both count.
          </p>
        </div>
        <div className="support-cell actions">
          <a className="support-btn primary" href="https://buymeacoffee.com/engineeringcommunity" target="_blank" rel="noopener noreferrer">
            Support the research <small>one-time or monthly, via Buy Me a Coffee</small>
          </a>
          <a className="support-btn" href="https://engineers.beehiiv.com" target="_blank" rel="noopener noreferrer">
            Get the newsletter <small>free, the deeper half of every story</small>
          </a>
          <a className="support-btn" href="https://www.linkedin.com/company/engineeringcommunity/" target="_blank" rel="noopener noreferrer">
            Follow on LinkedIn <small>catch each plate the day it lights up</small>
          </a>
          <p className="support-fineprint">
            Support is optional and never unlocks anything. Every story on this line is free, and
            stays free.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <div className="footer-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ec-logo.png" alt="" width={22} height={20} />
            <span className="footer-brand">Engineering Community</span>
          </div>
          <p className="footer-shannon">
            <b>SHANNON</b> is Engineering Community&apos;s story archive, named for Claude Shannon,
            the engineer who measured information itself. Each line carries an engineer&apos;s name.{" "}
            <b>KELLY</b> (Kelly Johnson) carries the military aircraft; <b>PETROSKI</b> (Henry
            Petroski) the engineering failures; <b>HAMMURABI</b> the rules written after disaster;{" "}
            <b>BARENYI</b> (Bela Barenyi) automotive safety; <b>TIPPER</b> (Constance Tipper)
            materials; <b>LOVELACE</b> (Ada Lovelace) the computing foundations; <b>WRIGHT</b>{" "}
            (Wilbur and Orville Wright) the aviation foundations; <b>ROEBLING</b> (the Roebling
            family) structures; <b>SUTTER</b> (Joe Sutter) commercial aviation; <b>CARNOT</b> (Sadi
            Carnot) the prime movers; and <b>NOYCE</b> (Robert Noyce) the semiconductors. All eleven
            lines are live; individual plates unseal as we publish.
          </p>
        </div>
        <div className="footer-links">
          <a href="https://www.linkedin.com/company/engineeringcommunity/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/engineeringcommunity_/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.facebook.com/EngineeringUni" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://engineers.beehiiv.com" target="_blank" rel="noopener noreferrer">Newsletter</a>
          <a href="https://buymeacoffee.com/engineeringcommunity" target="_blank" rel="noopener noreferrer">Support</a>
          <a href="https://tally.so/r/9q56RV" target="_blank" rel="noopener noreferrer">Report a defect</a>
          <a href="https://tally.so/r/GxyoQZ" target="_blank" rel="noopener noreferrer">Submit a remark</a>
        </div>
      </div>
      <div className="footer-craft">
        <span>No ads. No cookies. Privacy-first analytics.</span>
        <span>Errata log: clean as of Jul 2026</span>
      </div>
      <div className="footer-bottom">
        <span>&copy; 2026 Engineering Community</span>
        <span className="footer-stamp">SHANNON v1.64 / BUILT 07.2026 / 11 LINES LIVE, L-01 THROUGH L-11</span>
      </div>
    </footer>
  );
}
