import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  Play, 
  Pause, 
  RefreshCw, 
  Cpu, 
  Trash2, 
  ShieldCheck,
  Search,
  Compass,
  ChevronRight,
  Sparkles,
  Info,
  Tv,
  Layers,
  Clock,
  Calendar,
  AlertCircle,
  Database,
  Activity,
  Siren,
  Zap
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { EvidenceList } from "../components/EvidenceList";
import { StatusTag, EventTag } from "../components/Tag";
import { TimelineTrack } from "../components/TimelineTrack";
import { IncidentSummaryCard } from "../components/IncidentSummaryCard";
import PoliceConsole from "./PoliceConsole";
import { api, tokenStorage } from "../api";

export interface TimelineEvent {
  id: string;
  timestamp_offset_seconds: number;
  event_type: "vehicle_detected" | "person_detected" | "sustained_proximity" | "sudden_deceleration" | "other";
  confidence: number;
  description: string;
  bounding_boxes: unknown[];
}

export interface Incident {
  id: string;
  evidence: string;
  risk_score: number; // 0.0-1.0, from detection/risk.py's transparent weighted heuristic
  status: "open" | "reviewed" | "closed";
  summary: string;
  analyst_notes: string;
  created_at: string;
}

export interface Evidence {
  id: string;
  vehicle: string; // UUID FK - not display-friendly, use vehicle_registration
  vehicle_registration: string;
  video_file: string;
  uploaded_at: string;
  sha256_hash: string;
  locked: boolean;
  locked_at: string | null;
  processed: boolean;
  processing_status: "NEW" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  task_id: string | null;
  error_message: string | null;
  timeline_events: TimelineEvent[];
  incident: Incident | null;
}

export const EvidenceConsole: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedItem, setSelectedItem] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Layout UI states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState<"live" | "search" | "police">("live");
  const [sosSending, setSosSending] = useState(false);
  const [sosAlertMessage, setSosAlertMessage] = useState<string | null>(null);

  // Hashing verification states
  const [checksumStatus, setChecksumStatus] = useState<"idle" | "verifying" | "valid" | "mismatch" | "error">("idle");

  // Semantic search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedId = id || null;

  // Video playback
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fetchRegistry = async () => {
    if (!tokenStorage.getAccess()) {
      setListLoading(false);
      return;
    }
    try {
      setListLoading(true);
      setError(null);
      const data = await api.listEvidence();
      setEvidenceList(data);
    } catch (err: any) {
      setError(err.message || "Unable to retrieve edge evidence records.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }

    const fetchDetailSpecimen = async () => {
      try {
        setLoading(true);
        setError(null);
        setVideoDuration(0);
        setVideoCurrentTime(0);
        setIsPlaying(false);
        setChecksumStatus("idle");

        const data = await api.getEvidence(selectedId);
        setSelectedItem(data);
      } catch (err: any) {
        console.warn("Direct detail fetch failed, falling back to cached state:", err);
        const localFallback = evidenceList.find((item) => item.id === selectedId);
        setSelectedItem(localFallback || null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailSpecimen();
  }, [selectedId, evidenceList]);

  const handleDelete = async () => {
    if (!selectedId) return;
    
    const confirmDelete = window.confirm(
      "DANGER: Are you sure you want to permanently delete this evidence record? This action is irreversible and will remove all telemetry charts and logs."
    );
    
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await (api as any).deleteEvidence(selectedId);
      navigate("/dashboard");
      await fetchRegistry();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete evidence record.");
    } finally {
      setDeleting(false);
    }
  };

  const handleVerifyChecksum = async () => {
    if (!selectedItem?.video_file || !selectedItem.sha256_hash) return;
    setChecksumStatus("verifying");
    try {
      const res = await fetch(selectedItem.video_file);
      if (!res.ok) throw new Error("Could not fetch clip for verification");
      const buffer = await res.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const computedHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setChecksumStatus(computedHash === selectedItem.sha256_hash ? "valid" : "mismatch");
    } catch (err) {
      console.error("Checksum verification failed:", err);
      setChecksumStatus("error");
    }
  };

  const handleTriggerProcessing = async () => {
    if (!selectedId) return;
    try {
      setProcessingAction(true);
      setError(null);
      await api.processEvidence(selectedId);
      await fetchRegistry();
    } catch (err: any) {
      console.error("Pipeline trigger error:", err);
      setError(err.message || "Failed to start pipeline analysis.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setVideoCurrentTime(seconds);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Vector similarity search query handler
  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const data = await api.searchEvidence(searchQuery);
      setSearchResults(data);
    } catch (err: any) {
      // No fake matches. An analyst relying on this to find real evidence
      // needs to know the search failed, not see confident invented results.
      setSearchResults([]);
      setError(err.message || "Search failed - could not reach the vector search service.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendDriverSOS = async () => {
    try {
      setSosSending(true);
      const res = await api.simulateEmergencySOS(selectedItem?.vehicle);
      setSosAlertMessage(`🚨 EMERGENCY SOS DISPATCHED TO POLICE! Ref: ${res.dispatch_number} for Vehicle ${res.vehicle_plate}`);
      setTimeout(() => setSosAlertMessage(null), 7000);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch emergency SOS.");
    } finally {
      setSosSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main font-sans antialiased overflow-hidden select-none transition-colors duration-150 relative cyber-grid">
      
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full glow-orb-indigo pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full glow-orb-emerald pointer-events-none z-0" />

      {/* Navbar wrapper */}
      <Navbar 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* Collapsible Sidebar Wrapper */}
        <div 
          className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-border bg-bg-panel flex flex-col h-full ${
            sidebarOpen ? "w-[340px]" : "w-0 border-r-0"
          }`}
        >
          {listLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-text-faint p-4 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" /> 
              <span>Syncing Edge Registry...</span>
            </div>
          ) : (
            <EvidenceList
              evidence={evidenceList}
              selectedId={selectedId}
              onSelect={(nextId) => navigate(`/dashboard/evidence/${nextId}`)}
              onUploadSuccess={fetchRegistry}
            />
          )}
        </div>

        {/* Central main view */}
        <div className="flex-1 overflow-y-auto bg-bg p-6 flex flex-col justify-start">
          
          {sosAlertMessage && (
            <div className="mb-6 bg-rose-600 text-white font-mono text-xs p-3.5 rounded-xl flex items-center justify-between shadow-2xl animate-bounce">
              <div className="flex items-center gap-2 font-bold">
                <Siren className="w-4 h-4 animate-spin" />
                <span>{sosAlertMessage}</span>
              </div>
              <button onClick={() => setCurrentTab("police")} className="bg-black/30 hover:bg-black/50 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-white/20">
                View in Police Portal →
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-xs font-mono text-rose-400 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>[API CLIENT LOG]: {error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-[10px] uppercase font-bold tracking-wider hover:text-white cursor-pointer px-2 py-0.5 rounded border border-rose-400/20 bg-rose-400/5">DISMISS</button>
            </div>
          )}

          {currentTab === "live" ? (
            // LIVE HUD CONSOLE TAB
            loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-16 bg-bg-panel border border-border rounded-xl" />
                <div className="h-[320px] bg-bg-panel border border-border rounded-xl flex items-center justify-center" />
                <div className="h-20 bg-bg-panel border border-border rounded-xl" />
                <div className="h-36 bg-bg-panel border border-border rounded-xl" />
              </div>
            ) : selectedItem ? (
              <div className="space-y-6">
                
                {/* Record Title Header with SHA Block & Delete Action */}
                <div className="bg-bg-panel border border-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm backdrop-blur-md">
                  <div>
                    <div className="flex items-center flex-wrap gap-2.5">
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Cpu size={10} className="animate-spin" />
                        <span>Edge Node Active</span>
                      </div>
                      <h2 className="text-sm font-bold text-text-main font-mono">
                        RECORD: {selectedItem.vehicle_registration || selectedItem.vehicle}
                      </h2>
                      <span className="text-text-faint">|</span>
                      <span className="text-[10px] text-text-dim font-mono">UUID: {selectedItem.id}</span>
                    </div>
                    
                    {/* Real SHA-256 verification: re-fetches the clip client-side, re-hashes it
                        with SubtleCrypto, and compares against the hash stored at lock time.
                        This can genuinely fail if the file was altered or fails to load -
                        it is not guaranteed to say "valid". */}
                    {selectedItem.sha256_hash && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[9px]">
                        <span className="text-text-faint font-bold">SHA-256 HASH (at lock time):</span>
                        <span className="text-text-dim select-text truncate max-w-xs md:max-w-md bg-bg-panel-raised border border-border px-2 py-0.5 rounded-md">
                          {selectedItem.sha256_hash}
                        </span>
                        {checksumStatus === "idle" && (
                          <button
                            onClick={handleVerifyChecksum}
                            className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/35 rounded-md cursor-pointer transition-all flex items-center gap-1 font-bold"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Re-verify Integrity</span>
                          </button>
                        )}
                        {checksumStatus === "verifying" && (
                          <span className="flex items-center gap-1 text-amber-400 bg-amber-500/5 px-2.5 py-0.5 rounded-md border border-amber-500/10">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Fetching clip and re-hashing...
                          </span>
                        )}
                        {checksumStatus === "valid" && (
                          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Hash matches — file unchanged since lock
                          </span>
                        )}
                        {checksumStatus === "mismatch" && (
                          <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-md font-bold">
                            <AlertTriangle className="w-3 h-3" /> Hash mismatch — file differs from lock-time hash
                          </span>
                        )}
                        {checksumStatus === "error" && (
                          <span className="flex items-center gap-1.5 text-text-faint bg-bg-panel-raised border border-border px-2.5 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3" /> Could not verify (fetch or hashing failed)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                    {/* Status Badges, Emergency SOS & Delete Button */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <StatusTag status={selectedItem.processing_status} />
                      
                      {selectedItem.locked && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-extrabold text-rose-400 tracking-wider">
                          <Lock className="w-3 h-3" /> SECURED
                        </span>
                      )}

                      <button
                        onClick={handleSendDriverSOS}
                        disabled={sosSending}
                        className="flex items-center gap-1.5 px-3 py-1 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
                        title="Auto-clip live stream proof & dispatch to Police Control Room with GPS coordinates"
                      >
                        <Siren className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        <span>{sosSending ? "Dispatching..." : "SOS Dispatch to Police"}</span>
                      </button>

                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Permanently remove evidence record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deleting ? "Deleting..." : "Delete Record"}</span>
                      </button>
                    </div>
                </div>

                {selectedItem.processing_status === "FAILED" && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="font-mono">
                      <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                        Analysis Pipeline Terminated
                      </h3>
                      <p className="text-xs text-text-dim leading-relaxed mt-2">
                        {selectedItem.error_message || "Fatal error encountered during core parsing sequence."}
                      </p>
                    </div>
                  </div>
                )}

                {(selectedItem.processing_status === "NEW" || selectedItem.processing_status === "PENDING") && (
                  <div className="bg-bg-panel border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-lg backdrop-blur-md">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mb-4 animate-pulse">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-mono font-bold text-text-main uppercase tracking-wider">
                      Run AI Ingestion Pipeline
                    </h3>
                    <p className="text-xs text-text-dim font-sans max-w-sm mt-2 mb-6 leading-relaxed">
                      This incident payload is securely queued, but the computer vision model has not yet run heuristic frame analysis on it.
                    </p>
                    <button
                      onClick={handleTriggerProcessing}
                      disabled={processingAction}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-98 text-slate-950 text-xs font-bold uppercase rounded-lg tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      {processingAction ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Initializing Neural Net...</span>
                        </>
                      ) : (
                        <>
                          <Cpu className="w-4 h-4" />
                          <span>Trigger Analysis Pipeline</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {(selectedItem.processing_status === "COMPLETED" || selectedItem.processing_status === "PROCESSING") && (
                  <div>
                    {selectedItem.video_file ? (
                      <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-border shadow-2xl group">
                        
                        {/* Video Element */}
                        <video
                          ref={videoRef}
                          src={selectedItem.video_file}
                          onLoadedMetadata={handleLoadedMetadata}
                          onTimeUpdate={handleTimeUpdate}
                          className="w-full h-[320px] object-cover"
                          onClick={togglePlayback}
                        />

                        {/* Minimal real-status overlay only - no fabricated telemetry.
                            There is no GPS/speed/IMU data anywhere in the pipeline;
                            the only thing we can honestly claim here is which model ran. */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded border border-emerald-500/20 text-emerald-400 font-mono text-[9px] flex items-center gap-1.5">
                            <Cpu size={10} />
                            <span>YOLOv8 detection · {selectedItem.timeline_events.length} event{selectedItem.timeline_events.length === 1 ? "" : "s"} flagged</span>
                          </div>
                        </div>

                        {/* Custom Control Bar */}
                        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between font-mono text-[11px] text-white">
                          <button
                            type="button"
                            onClick={togglePlayback}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                            <span className="font-bold">{isPlaying ? "PAUSE FEED" : "PLAY BACKFEED"}</span>
                          </button>

                          <div className="text-slate-300 flex items-center gap-1">
                            <Clock size={11} className="text-text-faint" />
                            <span>
                              {Math.floor(videoCurrentTime / 60)}:
                              {String(Math.floor(videoCurrentTime % 60)).padStart(2, "0")}
                            </span>
                            <span className="text-slate-500">/</span>
                            <span className="text-slate-500">
                              {Math.floor(videoDuration / 60)}:
                              {String(Math.floor(videoDuration % 60)).padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[280px] bg-bg-panel border border-border rounded-xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
                        <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                        <p className="text-xs text-text-dim font-sans">
                          Pipeline is actively rendering dashcam feed segments. No fallback stream online.
                        </p>
                      </div>
                    )}

                    {selectedItem.timeline_events && selectedItem.timeline_events.length > 0 && (
                      <TimelineTrack
                        events={selectedItem.timeline_events}
                        videoDuration={videoDuration}
                        videoCurrentTime={videoCurrentTime}
                        onMarkerClick={handleSeek}
                      />
                    )}
                  </div>
                )}

                {selectedItem.timeline_events && selectedItem.timeline_events.length > 0 && (
                  <div className="border border-border rounded-xl bg-bg-panel overflow-hidden text-[11px] shadow-sm">
                    <div className="bg-slate-900/40 px-4 py-2 border-b border-border text-[9px] font-bold text-text-dim tracking-wider uppercase font-mono flex items-center gap-1.5">
                      <Layers size={12} className="text-emerald-500" />
                      <span>AI Model Telemetry Detections Trace</span>
                    </div>
                    <div className="divide-y divide-border/60">
                      {selectedItem.timeline_events.map((evt) => (
                        <div key={evt.id} className="p-3.5 flex items-start gap-4 hover:bg-slate-50/5 dark:hover:bg-slate-900/10 transition-colors">
                          <button
                            type="button"
                            onClick={() => handleSeek(evt.timestamp_offset_seconds)}
                            className="px-2 py-0.5 bg-bg-panel-raised border border-border hover:border-emerald-500/40 hover:text-emerald-400 rounded font-mono text-[10px] text-text-dim cursor-pointer transition-all"
                          >
                            {evt.timestamp_offset_seconds.toFixed(1)}s
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                              <EventTag type={evt.event_type} confidence={evt.confidence} />
                            </div>
                            <p className="text-text-dim text-xs leading-relaxed font-sans">
                              {evt.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.processing_status === "COMPLETED" && (
                  <IncidentSummaryCard
                    incident={selectedItem.incident}
                    onIncidentUpdated={(updated) =>
                      setSelectedItem((prev) => (prev ? { ...prev, incident: updated } : prev))
                    }
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-bg-panel border border-border border-dashed rounded-2xl max-w-xl mx-auto my-auto min-h-[300px]">
                <div className="w-16 h-16 bg-slate-900 border border-border rounded-full flex items-center justify-center mb-4 text-emerald-500">
                  <Shield className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-sm font-mono font-bold text-text-main uppercase tracking-wider">
                  NO EVIDENCE PAYLOAD LOADED
                </h3>
                <p className="text-xs text-text-dim max-w-xs mt-2 leading-relaxed font-sans">
                  Select an active incident telemetry node from the Edge Registry list on the left to populate the diagnostic HUD panel and view AI predictions.
                </p>
              </div>
            )
          ) : currentTab === "search" ? (
            // VECTOR SIMILARITY SEARCH LEDGER TAB
            <div className="space-y-6 max-w-4xl mx-auto py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                  <Search size={20} className="animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <span>Vector Similarity Search Ledger</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">Gemini Embedding Index</span>
                  </h1>
                  <p className="text-xs text-text-dim">Query natural language context directly to AI vector indices stored in Qdrant.</p>
                </div>
              </div>

              {/* Vector Query Form (Humanized) */}
              <div className="bg-bg-panel border border-border p-6 rounded-xl shadow-lg backdrop-blur-md space-y-4">
                <p className="text-xs text-text-dim font-sans">
                  "Hello Analyst, you can describe any event pattern (e.g. <em>'abrupt braking near trucks'</em>, <em>'speed spikes MH-12'</em>, or <em>'tailgating alerts'</em>). Our embedding engine will query the multi-modal database to match telemetry patterns."
                </p>

                <form onSubmit={handleSemanticSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Describe what pattern you want to match in vector index..."
                      className="w-full bg-bg-panel-raised border border-border focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/35 rounded-xl px-4 py-3 pl-11 text-sm text-text-main outline-none transition"
                    />
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint" />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Matching Vectors...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Query Ledger</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Vector Results list */}
              <div className="space-y-4">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div key={result.id} className="bg-bg-panel border border-border rounded-xl p-5 hover:border-cyan-500/40 transition flex items-center justify-between shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                            {result.match_score.toFixed(1)}% Similarity Match
                          </span>
                          <span className="text-xs text-text-dim font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                            Plate: {result.vehicle_reference}
                          </span>
                        </div>
                        <p className="text-sm text-text-main leading-relaxed font-sans">{result.summary_preview}</p>
                      </div>
                      <button
                        onClick={async () => {
                          // Select item and navigate back to live view
                          navigate(`/dashboard/evidence/${result.id}`);
                          setCurrentTab("live");
                        }}
                        className="flex items-center gap-1 text-xs text-text-dim hover:text-cyan-400 font-bold transition-colors cursor-pointer shrink-0 bg-bg-panel-raised border border-border px-3 py-1.5 rounded-lg"
                      >
                        <span>Inspect HUD</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-text-faint space-y-3 bg-bg-panel/40 border border-border border-dashed rounded-xl max-w-md mx-auto">
                    <Compass className="mx-auto text-cyan-400 animate-pulse" size={32} />
                    <div>
                      <p className="text-xs font-mono uppercase font-bold tracking-wider">Ready for Vector Matrix Queries</p>
                      <p className="text-[11px] text-text-dim mt-1 font-sans">Submit a natural language description above to scan Qdrant databases.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // POLICE EMERGENCY DISPATCH PORTAL TAB
            <PoliceConsole />
          )}
        </div>
      </div>

      {/* Amazon-style Footer wrapper */}
      <Footer />
    </div>
  );
};

export default EvidenceConsole;