import React, { useState, useEffect } from "react";
import { ShieldAlert, Save, CheckCircle } from "lucide-react";
import { Incident } from "../pages/EvidenceConsole";

interface IncidentSummaryCardProps {
  incident: Incident | null;
}

export const IncidentSummaryCard: React.FC<IncidentSummaryCardProps> = ({ incident }) => {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (incident) {
      setNotes(incident.analyst_notes || "");
    }
  }, [incident]);

  if (!incident) {
    return (
      <div className="bg-bg-panel border border-border rounded-[var(--radius-custom)] p-5 flex flex-col items-center justify-center text-center shadow-xs">
        <ShieldAlert className="w-6 h-6 text-text-faint mb-2" />
        <p className="text-xs text-text-dim font-sans">No threat telemetry anomalies classified.</p>
      </div>
    );
  }

  const isHighRisk = incident.severity === "HIGH";

  const handleSaveNotes = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-bg-panel border border-border rounded-[var(--radius-custom)] overflow-hidden relative font-sans shadow-xs transition-colors duration-150">
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isHighRisk ? "bg-red-500" : "bg-amber-500"}`} />

      <div className="p-5 pl-7">
        <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-text-faint uppercase tracking-wider">
              AI Forensic Diagnostics Profile
            </h3>
            <p className="text-sm font-bold text-text-main mt-1">
              {incident.threat_category}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold text-text-faint">SEVERITY</span>
            <div className={`text-xs font-extrabold font-mono tracking-wider ${isHighRisk ? "text-red-500" : "text-amber-500"}`}>
              {incident.severity}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-r border-border pr-4">
            <span className="text-[9px] font-mono font-bold text-text-faint">RISK COEFFICIENT</span>
            <p className="text-4xl font-extrabold font-sans mt-1 text-text-main tracking-tight">
              {incident.risk_score}<span className="text-sm font-medium text-text-faint">/100</span>
            </p>
          </div>

          <div className="col-span-2">
            <span className="text-[9px] font-mono font-bold text-text-faint">DIAGNOSTIC ANALYSIS</span>
            <p className="text-xs text-text-dim leading-relaxed mt-1.5">
              {incident.summary}
            </p>
          </div>
        </div>

        {/* Handcrafted editable analyst notebook pane */}
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-text-dim">ACTIVE ANALYST REMARKS</span>
            <button
              onClick={handleSaveNotes}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 rounded-sm hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Remarks Verified</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Notes</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type context-aware telemetry flags, audit logs, or analyst verifications here..."
            className="w-full min-h-20 bg-bg-panel-raised border border-border rounded-[var(--radius-custom)] p-3 text-xs text-text-main font-sans placeholder:text-text-faint focus:outline-none focus:border-text-dim transition-colors resize-y leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};