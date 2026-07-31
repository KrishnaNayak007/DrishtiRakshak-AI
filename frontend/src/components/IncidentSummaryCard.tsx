import React from "react";
import { ShieldAlert } from "lucide-react";
import { Incident } from "../pages/EvidenceConsole";

interface IncidentSummaryCardProps {
  incident: Incident | null;
}

export const IncidentSummaryCard: React.FC<IncidentSummaryCardProps> = ({ incident }) => {
  if (!incident) {
    return (
      <div className="bg-bg-panel border border-border rounded-[var(--radius-custom)] p-5 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-6 h-6 text-text-faint mb-2" />
        <p className="text-xs text-text-dim font-mono">No threat telemetry anomalies classified.</p>
      </div>
    );
  }

  const isHighRisk = incident.severity === "HIGH";

  return (
    <div className="bg-bg-panel-raised border border-border rounded-[var(--radius-custom)] overflow-hidden relative font-sans">
      {/* Structural Color Coded Threat Indicator Panel Rail */}
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isHighRisk ? "bg-risk-high" : "bg-risk-mid"}`} />

      <div className="p-5 pl-7">
        <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-text-faint uppercase tracking-wider">
              AI Forensic Diagnostics Profile
            </h3>
            <p className="text-sm font-semibold text-text-main mt-1">
              {incident.threat_category}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono text-text-faint">AI CLASSIFICATION STATUS</span>
            <div className={`text-xs font-bold font-mono tracking-wider ${isHighRisk ? "text-risk-high" : "text-risk-mid"}`}>
              {incident.severity} SEVERITY
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="border-r border-border/40">
            <span className="text-[9px] font-mono text-text-faint">TELEMETRY RISK LEVEL</span>
            <p className="text-2xl font-bold font-mono mt-1 text-text-main">
              {incident.risk_score}<span className="text-xs text-text-dim">/100</span>
            </p>
          </div>

          <div className="col-span-2">
            <span className="text-[9px] font-mono text-text-faint">AI DIAGNOSTIC NOTES</span>
            <p className="text-xs text-text-dim leading-relaxed mt-1.5 font-mono">
              {incident.summary}
            </p>
          </div>
        </div>

        {incident.analyst_notes && (
          <div className="mt-4 bg-bg-panel border border-border/60 p-3 rounded-[var(--radius-custom)] text-[11px] font-mono text-text-dim">
            <span className="text-text-faint font-bold">ANALYST REMARKS:</span> {incident.analyst_notes}
          </div>
        )}
      </div>
    </div>
  );
};