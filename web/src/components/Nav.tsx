export default function Nav() {
  return (
    <nav>
      <a className="nav-logo" href="https://engineeringcommunity.net/" aria-label="Engineering Community home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ec-logo.png" alt="" width={28} height={25} />
        <div className="nav-wordmark">
          Shannon<span>.</span>
        </div>
      </a>
      <div className="nav-right">
        <a className="nav-findings" href="#findings">Findings</a>
        <div className="nav-tag">EC Archive / Ten lines live</div>
        <a className="nav-cta nav-support" href="https://buymeacoffee.com/engineeringcommunity" target="_blank" rel="noopener noreferrer">
          Support
        </a>
        <a className="nav-cta nav-linkedin" href="https://www.linkedin.com/company/engineeringcommunity/" target="_blank" rel="noopener noreferrer">
          Follow on LinkedIn
        </a>
      </div>
    </nav>
  );
}
