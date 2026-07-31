import React from "react";
import { Lock, Unlock } from "lucide-react";
import { Evidence } from "../pages/EvidenceConsole";
import { StatusBadge } from "./StatusBadge";

interface EvidenceRowProps {
  item: Evidence;
  isSelected: boolean;
  onSelect: () => void;
}

export const EvidenceRow: React.FC<EvidenceRowProps> = ({ item, isSelected, onSelect }) => {
  const formattedDate = new Date(item.uploaded_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 border-b border-border/60 transition-all cursor-pointer font-mono ${
        isSelected 
          ? "bg-bg-panel-raised border-l-2 border-l-risk-high text-text-main" 
          : "bg-bg-panel text-text-dim hover:bg-bg-panel-raised/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold ${isSelected ? "text-text-main" : "text-text-dim"}`}>
          {item.vehicle}
        </span>
        <span className="text-[10px] text-text-faint">{formattedDate}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1.5">
        <StatusBadge status={item.processing_status} />
        
        <div className="flex items-center gap-1.5 text-[9px] text-text-faint">
          {item.locked ? (
            <>
              <Lock className="w-3 h-3 text-risk-high" />
              <span>SECURED</span>
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3" />
              <span>RAW</span>
            </>
          )}
        </div>
      </div>

      {item.sha256_hash && (
        <div className="text-[9px] text-text-faint mt-2 truncate max-w-full font-mono">
          SHA: {item.sha256_hash}
        </div>
      )}
    </button>
  );
};