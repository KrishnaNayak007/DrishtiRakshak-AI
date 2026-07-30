import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Cpu } from 'lucide-react';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xl font-bold tracking-wider text-white">DRISHTI RAKSHAK</span>
        </div>
        <button 
          onClick={() => navigate('/auth')}
          className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-800 transition"
        >
          Access Platform
        </button>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 flex-1 grid lg:grid-cols-2 gap-12 items-center py-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">Active Status</span> 
            <span>• Edge System telemetry online</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white">
            DrishtiRakshak AI: <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Connected Vehicle Safety
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl">
            Computer vision incident capturing, automated heuristic extraction, and edge pipeline validation.
          </p>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
            >
              Access Console <ArrowUpRight size={18} />
            </button>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <h2 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
            <Cpu size={16} /> Edge Telemetry Monitor (Simulated)
          </h2>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-mono">NODE_DRISHTI_209A</p>
              <p className="text-sm font-semibold text-slate-200">G-Force Spike Detected</p>
            </div>
            <span className="px-2 py-1 rounded bg-rose-950/40 text-rose-400 text-xs border border-rose-900/30">High Risk Alert</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <p>© 2026 DrishtiRakshak AI.</p>
        </div>
      </footer>
    </div>
  );
};