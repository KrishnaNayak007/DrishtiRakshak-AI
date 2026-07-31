import React from "react";
import { Terminal } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="h-8 bg-bg-panel border-t border-border px-5 flex items-center justify-between shrink-0 font-mono text-[10px] text-text-dim shadow-xs">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-text-faint" />
          <span className="text-text-faint uppercase font-bold">Service Cluster:</span>
          <span className="text-emerald-500 font-bold">CONNECTED</span>
        </span>

        <div className="h-3.5 w-px bg-border" />

        <span className="flex items-center gap-4 text-text-faint">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>postgres:11 (5432)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>qdrant-vector (6333)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>redis-cache (6379)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>fastapi-server (8000)</span>
          </span>
        </span>
      </div>

      <div className="flex items-center gap-4 text-text-faint">
        <span>Region: <span className="text-text-dim font-bold">Asia-East-04</span></span>
        <div className="h-3.5 w-px bg-border" />
        <span>v1.14.2-stable</span>
      </div>
    </footer>
  );
};