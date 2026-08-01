import React from "react";
import { Lock, Unlock, Film, Calendar, ChevronRight } from "lucide-react";
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
      className={`w-full text-left p-4 border-b border-border/50 transition-all cursor-pointer font-sans relative group ${
        isSelected 
          ? "bg-slate-900/50 text-text-main shadow-inner" 
          : "bg-bg-panel text-text-dim hover:bg-slate-900/10 dark:hover:bg-slate-900/25"
      }`}
    >
      {/* Dynamic left active bar */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
          isSelected 
            ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]" 
            : "bg-transparent group-hover:bg-border/60"
        }`} 
      />

      <div className="flex items-center justify-between gap-3 mb-2 pl-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Film size={12} className={isSelected ? "text-emerald-400" : "text-text-faint"} />
          <span 
            className={`text-xs font-bold truncate font-mono tracking-tight ${
              isSelected ? "text-text-main" : "text-text-dim"
            }`}
            title={item.vehicle}
          >
            {item.vehicle}
          </span>
        </div>
        <span className="text-[9px] text-text-faint font-mono shrink-0 flex items-center gap-1">
          <Calendar size={9} />
          {formattedDate}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 pl-1">
        <StatusTag status={item.processing_status} />
        
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-faint">
          {item.locked ? (
            <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
              <Lock className="w-2.5 h-2.5" />
              <span className="font-extrabold tracking-wider text-[8px]">SECURED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-text-faint bg-bg-panel-raised border border-border px-1.5 py-0.5 rounded">
              <Unlock className="w-2.5 h-2.5" />
              <span className="tracking-wider text-[8px]">RAW</span>
            </div>
          )}
          
          <ChevronRight size={12} className="text-text-faint opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
      </div>
    </button>
  );
};