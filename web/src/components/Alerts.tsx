"use client";
import { sealedCount } from "@/data";
import { useUI } from "@/lib/ui";

export default function Alerts() {
  const { openForm } = useUI();
  return (
    <section className="alerts" id="alerts">
      <div className="alerts-inner brushed">
        <div>
          <div className="alerts-tag">Declassification alerts</div>
          <h2>Know the moment a plate unseals.</h2>
          <p>
            <span>{sealedCount}</span> plates on the lines are still sealed. Newsletter readers hear
            first when one opens, with the research that never fit in the post. Free, no noise,
            unsubscribe anytime.
          </p>
        </div>
        <div className="alerts-actions">
          <a className="alerts-btn" href="https://engineers.beehiiv.com/subscribe" target="_blank" rel="noopener noreferrer">
            Get the alerts <small>via the EC newsletter</small>
          </a>
          <button className="alerts-btn ghost" onClick={() => openForm("2E5bOD", "Suggest an aircraft")}>
            Suggest an aircraft <small>tell us what belongs on the line</small>
          </button>
        </div>
      </div>
    </section>
  );
}
