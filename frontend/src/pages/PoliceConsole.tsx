import React, { useState, useEffect } from "react";
import { 
  Siren, 
  CheckCircle2, 
  MapPin, 
  Car, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  Search, 
  ChevronRight,
  AlertTriangle,
  UserCheck,
  Radio,
  FileCheck
} from "lucide-react";
import { api, PoliceDispatch } from "../api";

export const PoliceConsole: React.FC = () => {
  const [dispatches, setDispatches] = useState<PoliceDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [solvingId, setSolvingId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [sosBanner, setSosBanner] = useState<string | null>(null);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const data = await api.listPoliceDispatches();
      setDispatches(data);
    } catch (err) {
      console.error("Failed to load police dispatches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  const handleMarkSolved = async (dispatchId: string) => {
    try {
      setSolvingId(dispatchId);
      await api.markCaseSolved(dispatchId);
      await fetchDispatches();
    } catch (err) {
      console.error("Error solving case:", err);
    } finally {
      setSolvingId(null);
    }
  };

  const handleSimulateSOS = async () => {
    try {
      setSimulating(true);
      const newSOS = await api.simulateEmergencySOS();
      setSosBanner(`🚨 REAL-TIME SOS DISPATCHED: ${newSOS.vehicle_plate} at ${newSOS.location.address}`);
      await fetchDispatches();
      setTimeout(() => setSosBanner(null), 6000);
    } catch (err) {
      console.error("Error simulating SOS:", err);
    } finally {
      setSimulating(false);
    }
  };

  const filteredDispatches = dispatches.filter((item) => {
    const matchesSearch = `${item.vehicle_plate} ${item.driver_name} ${item.location.address} ${item.dispatch_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const criticalCount = dispatches.filter((d) => d.status === "CRITICAL_SOS").length;
  const dispatchedCount = dispatches.filter((d) => d.status === "DISPATCHED").length;
  const solvedCount = dispatches.filter((d) => d.status === "CASE_SOLVED").length;

  return (
    <div className="w-full space-y-6 transition-colors duration-150">
      
      {/* Real-time SOS Toast Banner */}
      {sosBanner && (
        <div className="bg-rose-600 text-white font-mono text-xs py-2.5 px-4 flex items-center justify-between shadow-2xl animate-bounce rounded-xl">
          <div className="flex items-center gap-2 font-bold">
            <Siren className="w-4 h-4 animate-spin" />
            <span>{sosBanner}</span>
          </div>
          <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded font-mono">LIVE DISPATCH AUTO-PUSH</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Header Title & Police Control Room Bar (Theme Adaptive) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-panel border border-border p-6 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden transition-colors">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center">
                <Siren size={18} className="animate-pulse" />
              </div>
              <h1 className="text-xl font-extrabold text-text-main flex items-center gap-2 font-mono">
                <span>POLICE EMERGENCY CONTROL ROOM</span>
                <span className="text-[10px] bg-rose-500/15 text-rose-500 border border-rose-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  24/7 Dispatch Hub
                </span>
              </h1>
            </div>
            <p className="text-xs text-text-dim max-w-2xl leading-relaxed">
              Receiving continuous driver dashcam feeds clipped by AI during roadside threats (staged insurance fraud collisions & roadway robbery attempts).
            </p>
          </div>

          {/* Simulate SOS Trigger Button for Demo */}
          <div className="shrink-0 relative z-10">
            <button
              onClick={handleSimulateSOS}
              disabled={simulating}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-600/25 border border-rose-400/30"
            >
              {simulating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Transmitting SOS Payload...</span>
                </>
              ) : (
                <>
                  <Zap size={15} className="animate-bounce" />
                  <span>⚡ Simulate Emergency SOS Dispatch</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Counter Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between hover-glow-card-rose">
            <div>
              <span className="text-[10px] text-rose-500 font-bold block uppercase tracking-wider">Active Critical SOS</span>
              <span className="text-2xl font-black text-text-main">{criticalCount}</span>
            </div>
            <Siren className="w-8 h-8 text-rose-500/40 animate-pulse" />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between hover-glow-card-amber">
            <div>
              <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider">Patrol Units En-Route</span>
              <span className="text-2xl font-black text-text-main">{dispatchedCount}</span>
            </div>
            <Radio className="w-8 h-8 text-amber-500/40" />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between hover-glow-card">
            <div>
              <span className="text-[10px] text-emerald-500 font-bold block uppercase tracking-wider">Cases Solved (Verified)</span>
              <span className="text-2xl font-black text-text-main">{solvedCount}</span>
            </div>
            <FileCheck className="w-8 h-8 text-emerald-500/40" />
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-panel border border-border p-4 rounded-xl">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-text-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by plate number, driver, location address, or PCR ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-panel-raised border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main font-mono placeholder:text-text-faint focus:outline-none focus:border-rose-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-mono text-text-faint font-bold uppercase">Filter State:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-bg-panel-raised border border-border rounded-xl text-xs py-2 px-3 text-text-main font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL EMERGENCY STATES</option>
              <option value="CRITICAL_SOS">CRITICAL SOS ONLY</option>
              <option value="DISPATCHED">DISPATCHED EN ROUTE</option>
              <option value="CASE_SOLVED">CASE SOLVED</option>
            </select>
          </div>
        </div>

        {/* Main Dispatches Grid List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-44 bg-bg-panel border border-border rounded-xl" />
            <div className="h-44 bg-bg-panel border border-border rounded-xl" />
          </div>
        ) : filteredDispatches.length > 0 ? (
          <div className="space-y-4">
            {filteredDispatches.map((item) => (
              <div 
                key={item.id}
                className={`bg-bg-panel border rounded-2xl p-6 relative overflow-hidden transition-all duration-200 shadow-lg ${
                  item.status === "CRITICAL_SOS" 
                    ? "border-rose-500/40 bg-rose-500/5 hover-glow-card-rose" 
                    : item.status === "CASE_SOLVED"
                    ? "border-emerald-500/30 bg-emerald-500/5 opacity-90 hover-glow-card"
                    : "border-amber-500/30 bg-amber-500/5 hover-glow-card-amber"
                }`}
              >
                {/* Left accent stripe */}
                <div 
                  className={`absolute top-0 bottom-0 left-0 w-2 ${
                    item.status === "CRITICAL_SOS" 
                      ? "bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.8)]" 
                      : item.status === "CASE_SOLVED"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`} 
                />

                <div className="pl-3 space-y-4">
                  {/* Top Bar: Plate Number, Status Badge, PCR ID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center flex-wrap gap-2.5">
                      {/* Vehicle Plate Badge */}
                      <div className="flex items-center gap-1.5 bg-bg-panel-raised border border-border px-3 py-1 rounded-lg text-text-main font-mono text-sm font-black shadow-xs">
                        <Car size={16} className="text-emerald-500" />
                        <span>{item.vehicle_plate}</span>
                      </div>

                      <span className="text-text-faint hidden sm:inline">|</span>
                      <span className="text-xs text-text-dim font-mono font-semibold">{item.driver_name}</span>
                      <span className="text-text-faint hidden sm:inline">|</span>
                      <span className="text-[10px] text-text-faint font-mono">PCR Ref: {item.dispatch_number}</span>
                    </div>

                    {/* Status Badge & Solved Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      {item.status === "CRITICAL_SOS" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-500 border border-rose-500/40 rounded-full text-[10px] font-mono font-extrabold animate-pulse">
                          <Siren size={12} /> CRITICAL SOS DISPATCH
                        </span>
                      )}
                      {item.status === "DISPATCHED" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/40 rounded-full text-[10px] font-mono font-bold">
                          <Radio size={12} /> PATROL EN ROUTE
                        </span>
                      )}
                      {item.status === "CASE_SOLVED" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 rounded-full text-[10px] font-mono font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <CheckCircle2 size={12} /> CASE SOLVED & VERIFIED
                        </span>
                      )}

                      {/* MARK CASE SOLVED BUTTON */}
                      {item.status !== "CASE_SOLVED" ? (
                        <button
                          onClick={() => handleMarkSolved(item.id)}
                          disabled={solvingId === item.id}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          {solvingId === item.id ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Resolving Case...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Mark Case Solved</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold">
                          <UserCheck size={12} />
                          <span>{item.resolved_by || "Verified by Police Patrol"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Incident Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                    
                    {/* Location & Time info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 bg-bg-panel-raised border border-border/70 p-3.5 rounded-xl font-mono text-xs shadow-xs">
                        <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-text-faint font-bold block uppercase">Live GPS Coordinates</span>
                          <span className="text-emerald-500 font-bold block">{item.location.lat.toFixed(4)}° N, {item.location.lng.toFixed(4)}° E</span>
                          <span className="text-text-main text-[11px] mt-1 block font-sans leading-normal">{item.location.address}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-text-dim px-1">
                        <Clock size={12} className="text-text-faint" />
                        <span>Dispatched: {new Date(item.timestamp).toLocaleTimeString()} ({new Date(item.timestamp).toLocaleDateString()})</span>
                      </div>
                    </div>

                    {/* Threat Classification & AI Video Analysis Proof */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-md uppercase">
                          AI Threat Classification: {item.threat_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          Risk Score: {item.risk_score}/100
                        </span>
                      </div>

                      <div className="bg-bg-panel-raised border border-border p-3.5 rounded-xl text-xs text-text-main leading-relaxed font-sans shadow-xs">
                        <span className="text-[10px] font-mono text-text-faint block uppercase mb-1 font-bold">Auto-Clipped Video Proof Summary:</span>
                        {item.ai_summary}
                      </div>

                      {/* SHA-256 Tamper-Proof Chain Bar */}
                      <div className="flex items-center gap-2 font-mono text-[9px] text-text-faint bg-bg-panel-raised p-2 rounded-lg border border-border">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span>SHA-256 Cryptographic Chain Proof:</span>
                        <span className="text-text-dim truncate select-text max-w-md font-bold">{item.sha256_hash}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-text-faint font-mono space-y-3 bg-bg-panel border border-border border-dashed rounded-2xl">
            <ShieldCheck size={32} className="mx-auto text-emerald-500 animate-pulse" />
            <p className="text-sm font-bold text-text-main uppercase">No Active Police Dispatches Found</p>
            <p className="text-xs text-text-dim max-w-sm mx-auto font-sans">
              All roadside incidents have been resolved, or no emergency SOS alerts match your search filters.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PoliceConsole;
