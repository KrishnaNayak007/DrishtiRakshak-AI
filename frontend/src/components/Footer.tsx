import React from "react";
import { Terminal, Shield, ArrowUp, ExternalLink, Activity, Cpu, Database, Check } from "lucide-react";

export const Footer: React.FC = () => {
  const handleScrollToTop = () => {
    // Find the main scrollable viewport element and scroll it up
    const mainContent = document.querySelector(".flex-1.overflow-y-auto");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-border w-full font-sans transition-colors duration-150 shrink-0 select-none">
      
      {/* Back to top banner (Amazon style) */}
      <button
        onClick={handleScrollToTop}
        className="w-full py-2 bg-slate-900/60 hover:bg-slate-900 text-text-dim hover:text-white text-xs font-semibold font-mono tracking-wider border-b border-border/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
      >
        <ArrowUp size={12} className="animate-bounce" />
        <span>BACK TO TOP FOR forensic AUDIT</span>
      </button>

      {/* Directory Columns */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px]">
        {/* Col 1 */}
        <div className="space-y-3">
          <h4 className="font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Node Clusters</span>
          </h4>
          <ul className="space-y-2 text-text-dim font-mono">
            <li><a href="#" className="hover:text-emerald-400 hover:underline flex items-center gap-1"><span>Bhubaneswar_Node_04</span></a></li>
            <li><a href="#" className="hover:text-emerald-400 hover:underline flex items-center gap-1"><span>Cuttack_Cluster_02</span></a></li>
            <li><a href="#" className="hover:text-emerald-400 hover:underline flex items-center gap-1"><span>Puri_Edge_09</span></a></li>
            <li><a href="#" className="hover:text-emerald-400 hover:underline flex items-center gap-1"><span>Registry Mirror</span> <ExternalLink size={10} className="text-text-faint" /></a></li>
          </ul>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <h4 className="font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>AI Neural Networks</span>
          </h4>
          <ul className="space-y-2 text-text-dim font-mono">
            <li><a href="#" className="hover:text-cyan-400 hover:underline">YOLOv8 Threat Ingestion</a></li>
            <li><a href="#" className="hover:text-cyan-400 hover:underline">Gemini Embedding Model</a></li>
            <li><a href="#" className="hover:text-cyan-400 hover:underline">Qdrant Vector Database</a></li>
            <li><a href="#" className="hover:text-cyan-400 hover:underline">Celery Task Queue</a></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <h4 className="font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Platform Guides</span>
          </h4>
          <ul className="space-y-2 text-text-dim font-mono">
            <li><a href="#" className="hover:text-blue-400 hover:underline">System Architecture</a></li>
            <li><a href="#" className="hover:text-blue-400 hover:underline">REST API v1 Schemas</a></li>
            <li><a href="#" className="hover:text-blue-400 hover:underline">Analyst Protocol Manual</a></li>
            <li><a href="#" className="hover:text-blue-400 hover:underline">Edge Node Deployment</a></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-3">
          <h4 className="font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Chain compliance</span>
          </h4>
          <ul className="space-y-2 text-text-dim font-mono">
            <li><a href="#" className="hover:text-rose-400 hover:underline">Immutable Hashing Proofs</a></li>
            <li><a href="#" className="hover:text-rose-400 hover:underline">SHA-256 Ledger Audit</a></li>
            <li><a href="#" className="hover:text-rose-400 hover:underline">Multi-tenant Privacy</a></li>
            <li><a href="#" className="hover:text-rose-400 hover:underline flex items-center gap-1"><span>Regulatory Officer</span> <Shield size={10} className="text-rose-400" /></a></li>
          </ul>
        </div>
      </div>

      <hr className="border-border/30 w-full" />

      {/* Bottom telemetry indicators & Brand bar */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-text-dim font-mono">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Shield className="w-4 h-4 text-emerald-500 animate-pulse fill-current" />
            <span>DRISHTIRAKSHAK AI</span>
          </span>
          <div className="hidden sm:block h-3 w-px bg-border/40" />
          
          <span className="flex items-center gap-1">
            <Terminal size={12} className="text-text-faint" />
            <span className="text-text-faint uppercase font-bold">Services:</span>
          </span>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-[9px] bg-slate-900 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold">
              <Check className="w-2.5 h-2.5" /> postgres:15
            </span>
            <span className="flex items-center gap-1 text-[9px] bg-slate-900 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold">
              <Check className="w-2.5 h-2.5" /> qdrant-vector
            </span>
            <span className="flex items-center gap-1 text-[9px] bg-slate-900 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold">
              <Check className="w-2.5 h-2.5" /> redis-cache
            </span>
            <span className="flex items-center gap-1 text-[9px] bg-slate-900 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold">
              <Check className="w-2.5 h-2.5" /> fastapi-server
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-text-faint shrink-0">
          <span>Region: <strong className="text-white">Asia-East-04</strong></span>
          <div className="h-3 w-px bg-border/40" />
          <span>v1.14.2-stable</span>
        </div>
      </div>
    </footer>
  );
};