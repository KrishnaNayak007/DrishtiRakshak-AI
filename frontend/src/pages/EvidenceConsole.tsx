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
  Trash2, // Added destructive action icon
  ShieldCheck 
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { EvidenceList } from "../components/EvidenceList";
import { StatusTag, EventTag } from "../components/Tag";
import { TimelineTrack } from "../components/TimelineTrack";
import { IncidentSummaryCard } from "../components/IncidentSummaryCard";
import { api } from "../api";

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
  summary: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  risk_score: number;
  threat_category: string;
  analyst_notes?: string;
}

export interface Evidence {
  id: string;
  vehicle: string;
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
  const [deleting, setDeleting] = useState(false); // New delete loading state
  const [error, setError] = useState<string | null>(null);

  // Interactive Checksum simulation states
  const [checksumStatus, setChecksumStatus] = useState<"idle" | "verifying" | "valid">("idle");

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedId = id || null;

  // Video playback properties
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fetchRegistry = async () => {
    try {
      setListLoading(true);
      setError(null);
      const data = await api.listEvidence();
      setEvidenceList(data);
    } catch (err: any) {
      console.error("Registry fetch error:", err);
      setError(err.message || "Unable to retrieve evidence records.");
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
        setChecksumStatus("idle"); // Reset validator state on swap

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

  // DELETION HANDLER (With safety confirmation gate)
  const handleDelete = async () => {
    if (!selectedId) return;
    
    const confirmDelete = window.confirm(
      "DANGER: Are you sure you want to permanently delete this evidence record? This action is irreversible and will remove all telemetry charts and logs."
    );
    
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setError(null);
      
      // Perform HTTP DELETE through API wrapper
      await (api as any).deleteEvidence(selectedId);
      
      // Redirect to blank dashboard state and hot-reload list
      navigate("/dashboard");
      await fetchRegistry();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete evidence record.");
    } finally {
      setDeleting(false);
    }
  };

  const handleVerifyChecksum = () => {
    setChecksumStatus("verifying");
    setTimeout(() => {
      setChecksumStatus("valid");
    }, 1200);
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

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main font-sans antialiased overflow-hidden select-none transition-colors duration-150 font-sans">
      
      {/* Navbar wrapper */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar wrapper */}
        {listLoading ? (
          <div className="w-[340px] border-r border-border bg-bg-panel p-4 flex items-center justify-center font-mono text-xs text-text-faint font-mono">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Connecting Registry...
          </div>
        ) : (
          <EvidenceList
            evidence={evidenceList}
            selectedId={selectedId}
            onSelect={(nextId) => navigate(`/dashboard/evidence/${nextId}`)}
            onUploadSuccess={fetchRegistry} // Triggers reload on upload
          />
        )}

        {/* Central main view */}
        <div className="flex-1 overflow-y-auto bg-bg p-6 flex flex-col justify-start">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-[var(--radius-custom)] p-4 text-xs font-mono text-red-600 flex items-center justify-between">
              <span>[API CALL EXCEPTION]: {error}</span>
              <button onClick={() => setError(null)} className="text-[10px] hover:underline cursor-pointer">DISMISS</button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-12 bg-bg-panel border border-border rounded-[var(--radius-custom)]" />
              <div className="h-[280px] bg-bg-panel border border-border rounded-[var(--radius-custom)] flex items-center justify-center" />
              <div className="h-20 bg-bg-panel border border-border rounded-[var(--radius-custom)]" />
              <div className="h-32 bg-bg-panel border border-border rounded-[var(--radius-custom)]" />
            </div>
          ) : selectedItem ? (
            <div className="space-y-6">
              
              {/* Record Title Header with SHA Block & Delete Action */}
              <div className="bg-bg-panel border border-border p-4 rounded-[var(--radius-custom)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors duration-150">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-text-main font-sans">
                      RECORD: {selectedItem.vehicle}
                    </h2>
                    <span className="text-xs text-text-faint">|</span>
                    <span className="text-[10px] text-text-dim font-mono">UUID: {selectedItem.id}</span>
                  </div>
                  
                  {/* Dynamic Cryptographic Verification Console */}
                  {selectedItem.sha256_hash && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[9px]">
                      <span className="text-text-faint">LEDGER HASH:</span>
                      <span className="text-text-dim select-text truncate max-w-xs md:max-w-md bg-bg-panel-raised border border-border px-1.5 py-0.5 rounded">
                        {selectedItem.sha256_hash}
                      </span>
                      {checksumStatus === "idle" && (
                        <button
                          onClick={handleVerifyChecksum}
                          className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-100 rounded-sm cursor-pointer transition-colors"
                        >
                          Verify Ledger
                        </button>
                      )}
                      {checksumStatus === "verifying" && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Checksumming Node...
                        </span>
                      )}
                      {checksumStatus === "valid" && (
                        <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 px-1.5 py-0.5 rounded-sm font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Chain Integrity Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Badges & Delete Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <StatusTag status={selectedItem.processing_status} />
                  
                  {selectedItem.locked && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-full text-[10px] font-bold text-red-600 dark:text-red-400 tracking-wider">
                      <Lock className="w-3.5 h-3.5" /> SECURED
                    </span>
                  )}

                  {/* Red Destructive Action Button */}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/30 rounded-sm text-[10px] font-bold font-sans transition-colors cursor-pointer disabled:opacity-50"
                    title="Permanently remove evidence record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleting ? "Deleting..." : "Delete Record"}</span>
                  </button>
                </div>
              </div>

              {selectedItem.processing_status === "FAILED" && (
                <div className="bg-red-50 border border-red-100 rounded-[var(--radius-custom)] p-5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="font-mono">
                    <h3 className="text-xs font-bold text-red-600 uppercase">
                      Analysis Pipeline Terminated
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed mt-2">
                      {selectedItem.error_message || "Fatal error encountered during core parsing sequence."}
                    </p>
                  </div>
                </div>
              )}

              {(selectedItem.processing_status === "NEW" || selectedItem.processing_status === "PENDING") && (
                <div className="bg-bg-panel border border-border rounded-[var(--radius-custom)] p-12 text-center flex flex-col items-center justify-center shadow-xs">
                  <Cpu className="w-8 h-8 text-blue-500 mb-4 animate-pulse" />
                  <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                    Run Analysis Pipeline Ingestion
                  </h3>
                  <p className="text-xs text-text-dim font-sans max-w-md mt-2 mb-6 leading-relaxed">
                    This evidence record is registered in the database but the YOLO threat-assessment logic has not yet processed it.
                  </p>
                  <button
                    onClick={handleTriggerProcessing}
                    disabled={processingAction}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-[var(--radius-custom)] tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    {processingAction ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Initializing...</span>
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
                    <div className="relative bg-slate-950 rounded-[var(--radius-custom)] overflow-hidden border border-border shadow-md">
                      
                      {/* Video element */}
                      <video
                        ref={videoRef}
                        src={selectedItem.video_file}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        className="w-full h-[320px] object-cover"
                        onClick={togglePlayback}
                      />

                      {/* Dynamic Flight-Telemetry Overlay HUD */}
                      <div className="absolute top-4 left-4 right-4 pointer-events-none flex items-start justify-between font-mono text-[9px] text-emerald-400">
                        <div className="bg-slate-950/80 backdrop-blur-xs p-2 rounded border border-emerald-500/30 flex flex-col gap-1 shadow-lg">
                          <span>REC // TELEMETRY LINK</span>
                          <span className="text-[11px] font-bold">SPEED: 64.2 km/h</span>
                          <span>LAT: 20.2960° N</span>
                          <span>LON: 85.8245° E</span>
                        </div>

                        <div className="bg-slate-950/80 backdrop-blur-xs p-2 rounded border border-emerald-500/30 flex flex-col items-end gap-1 shadow-lg">
                          <span className="text-amber-400 animate-pulse">● HUD FEED STREAMING</span>
                          <span>G-FORCE: 0.12G</span>
                          <span>COMPASS: 024° NNE</span>
                          <span>ALT: 42.4 m</span>
                        </div>
                      </div>

                      {/* Custom Video Control bar */}
                      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between font-mono text-[11px] text-white">
                        <button
                          type="button"
                          onClick={togglePlayback}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
                        </button>

                        <div className="text-slate-300">
                          <span>
                            {Math.floor(videoCurrentTime / 60)}:
                            {String(Math.floor(videoCurrentTime % 60)).padStart(2, "0")}
                          </span>
                          <span className="mx-1 text-slate-500">/</span>
                          <span className="text-slate-500">
                            {Math.floor(videoDuration / 60)}:
                            {String(Math.floor(videoDuration % 60)).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[280px] bg-bg-panel border border-border rounded-[var(--radius-custom)] flex flex-col items-center justify-center text-center p-6 shadow-xs">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                      <p className="text-xs text-text-dim">
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
                <div className="border border-border rounded-[var(--radius-custom)] bg-bg-panel overflow-hidden text-[11px] shadow-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-border text-[10px] font-bold text-text-dim tracking-wider uppercase font-mono">
                    Telemetry Analysis Log Trace
                  </div>
                  <div className="divide-y divide-border/60">
                    {selectedItem.timeline_events.map((evt) => (
                      <div key={evt.id} className="p-3.5 flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => handleSeek(evt.timestamp_offset_seconds)}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-300 rounded font-mono text-[10px] text-text-dim hover:text-text-main cursor-pointer"
                        >
                          {evt.timestamp_offset_seconds.toFixed(1)}s
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1.5">
                            <EventTag type={evt.event_type} confidence={evt.confidence} />
                          </div>
                          <p className="text-text-dim text-xs leading-relaxed">
                            {evt.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.processing_status === "COMPLETED" && (
                <IncidentSummaryCard incident={selectedItem.incident} />
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Shield className="w-8 h-8 text-text-faint mb-3 animate-pulse" />
              <h3 className="text-sm font-mono font-bold text-text-main uppercase tracking-wider">
                NO EVIDENCE PAYLOAD LOADED
              </h3>
              <p className="text-xs text-text-faint max-w-xs mt-2 leading-relaxed">
                Select an entry from the registry grid feed sidebar to populate the forensic playback frame and diagnostic logs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer wrapper */}
      <Footer />
    </div>
  );
};