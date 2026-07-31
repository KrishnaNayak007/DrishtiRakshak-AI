import React from "react";
import { Lock, Unlock, Film } from "lucide-react";
import { Evidence } from "../pages/EvidenceConsole";
import { StatusTag } from "./Tag";

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
      className={`w-full text-left p-4 border-b border-border transition-all cursor-pointer font-sans ${
        isSelected 
          ? "bg-slate-50 dark:bg-slate-900/50 border-l-2 border-l-blue-500 text-text-main shadow-inner" 
          : "bg-bg-panel text-text-dim hover:bg-slate-50/50 dark:hover:bg-slate-900/25"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Crisp typography with ellipsis wrapping for UUIDs */}
        <span 
          className={`text-xs font-bold truncate max-w-[190px] font-mono tracking-tight ${
            isSelected ? "text-text-main" : "text-text-dim"
          }`}
          title={item.vehicle}
        >
          {item.vehicle}
        </span>
        <span className="text-[10px] text-text-faint font-mono shrink-0">{formattedDate}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <StatusTag status={item.processing_status} />
        
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-faint">
          {item.locked ? (
            <>
              <Lock className="w-3 h-3 text-red-500" />
              <span className="text-red-500 font-bold">SECURED</span>
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3 text-text-faint" />
              <span>RAW</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};