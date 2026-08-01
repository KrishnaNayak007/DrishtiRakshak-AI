import React, { useState, useEffect } from "react";
import { ShieldAlert, Save, CheckCircle2, Sparkles, UserCheck, Terminal, AlertCircle, FileText } from "lucide-react";
import { Incident } from "../pages/EvidenceConsole";
import { api } from "../api";

interface IncidentSummaryCardProps {
  incident: Incident | null;
  onIncidentUpdated?: (incident: Incident) => void;
}

export const IncidentSummaryCard: React.FC<IncidentSummaryCardProps> = ({ incident, onIncidentUpdated }) => {
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (incident) {
      setNotes(incident.analyst_notes || "");
    }
    setSaveState("idle");
  }, [incident]);

  if (!incident) {
    return (
      <div className="bg-bg-panel border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-md backdrop-blur-md">
        <ShieldAlert className="w-8 h-8 text-text-faint mb-2" />
        <p className="text-xs text-text-dim font-mono uppercase tracking-wider">No incident yet — pipeline hasn't produced a risk assessment for this clip.</p>
      </div>
    );
  }

  // risk_score is 0.0-1.0 from the backend's transparent weighted heuristic
  // (detection/risk.py) - not a 0-100 scale, and not from an LLM.
  const riskPercent = Math.round(incident.risk_score * 100);
  const isHighRisk = riskPercent >= 66;

  const handleSaveNotes = async () => {
    setSaveState("saving");
    try {
      const updated = await api.updateIncident(incident.id, { analyst_notes: notes });
      setSaveState("saved");
      onIncidentUpdated?.(updated);
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Failed to save analyst notes:", err);
      setSaveState("error");
    }
  };

  const handleStatusChange = async (status: "open" | "reviewed" | "closed") => {
    try {
      const updated = await api.updateIncident(incident.id, { status });
      onIncidentUpdated?.(updated);
    } catch (err) {
      console.error("Failed to update incident status:", err);
    }
  };

  // Compute circular stroke offset for the risk gauge
  // Circumference of radius 18 is 2 * pi * 18 = 113.1
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskPercent / 100) * circumference;

  return (
    <div className="bg-bg-panel border border-border rounded-xl overflow-hidden relative font-sans shadow-lg transition-colors duration-150 backdrop-blur-md">
      {/* Decorative vertical alert stripe */}
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isHighRisk ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"}`} />

      <div className="p-5 pl-7">
        
        {/* Header section with status */}
        <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-text-faint uppercase tracking-wider">
              <Terminal size={11} className="text-emerald-400" />
              <span>Risk Assessment (rule-based heuristic)</span>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold text-text-faint uppercase tracking-wider">REVIEW STATUS</span>
            <select
              value={incident.status}
              onChange={(e) => handleStatusChange(e.target.value as "open" | "reviewed" | "closed")}
              className={`block text-xs font-black font-mono tracking-wider bg-transparent border-none cursor-pointer ${
                incident.status === "closed" ? "text-emerald-500" : incident.status === "reviewed" ? "text-blue-400" : "text-amber-500"
              }`}
            >
              <option value="open">OPEN</option>
              <option value="reviewed">REVIEWED</option>
              <option value="closed">CLOSED</option>
            </select>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Circular Risk Progress Dial */}
          <div className="border-r border-border pr-4 flex items-center gap-4">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-border fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className={`fill-none transition-all duration-500 ${isHighRisk ? "stroke-rose-500" : "stroke-amber-500"}`}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-xs font-black text-text-main leading-none">{riskPercent}%</span>
                <span className="text-[7px] text-text-faint uppercase">Risk</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-text-faint uppercase tracking-wider">Risk Score</span>
              <p className="text-[10px] text-text-dim leading-relaxed font-sans mt-0.5">Weighted sum of flagged events (see below), not a black-box AI score.</p>
            </div>
          </div>

          <div className="col-span-2 space-y-1">
            <span className="text-[9px] font-mono font-bold text-text-faint uppercase tracking-wider flex items-center gap-1">
              <Terminal size={10} className="text-emerald-500" />
              <span>Diagnostic Analysis Insights</span>
            </span>
            <p className="text-xs text-text-dim leading-relaxed font-mono bg-bg-panel-raised border border-border/60 p-3 rounded-lg">
              {incident.summary}
            </p>
          </div>
        </div>

        {/* Analyst notebook section */}
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold text-text-dim uppercase tracking-wider flex items-center gap-1">
              <UserCheck size={12} className="text-emerald-500" />
              <span>Active Operator Remarks Notebook</span>
            </span>
            <button
              onClick={handleSaveNotes}
              disabled={saveState === "saving"}
              className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {saveState === "saving" && (
                <>
                  <Save className="w-3.5 h-3.5 animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {saveState === "saved" && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Saved</span>
                </>
              )}
              {saveState === "error" && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Save failed - retry</span>
                </>
              )}
              {saveState === "idle" && (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record forensic remarks, manual verification flags, or legal notes here..."
              className="w-full min-h-20 bg-bg-panel-raised border border-border focus:border-emerald-500/60 rounded-xl p-3 text-xs text-text-main font-sans placeholder:text-text-faint focus:outline-none transition-all resize-y leading-relaxed"
            />
            <FileText size={12} className="absolute right-3.5 bottom-3.5 text-text-faint pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};