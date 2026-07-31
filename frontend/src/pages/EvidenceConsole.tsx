import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, Lock, AlertTriangle, Play, Pause, RefreshCw, Cpu } from "lucide-react";
import { EvidenceList } from "../components/EvidenceList";
import { StatusBadge, EventBadge } from "../components/StatusBadge";
import { TimelineTrack } from "../components/TimelineTrack";
import { IncidentSummaryCard } from "../components/IncidentSummaryCard";
import { api } from "../api"; // Correct root import path to your api helper

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
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedId = id || null;

  // Video controller references
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 1. QUERY THE REGISTRY USING YOUR BUILT-IN api.searchEvidence METHODS
  // 1. QUERY THE REGISTRY USING YOUR BUILT-IN api.listEvidence METHOD
  const fetchRegistry = async () => {
    try {
      setListLoading(true);
      setError(null);
      
      // Perform a standard GET request to fetch all evidence
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

  // 2. FETCH INDIVIDUAL EVIDENCE DATA VIA api.getEvidence
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

        // Fetch detail metrics via GET /api/v1/evidence/{id}/ using your API wrapper
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

  // 3. TRIGGER PIPELINE PROCESSING VIA api.processEvidence
  const handleTriggerProcessing = async () => {
    if (!selectedId) return;
    try {
      setProcessingAction(true);
      setError(null);

      // Triggers POST /api/v1/evidence/{id}/process/ using your API wrapper
      await api.processEvidence(selectedId);
      
      // Refresh registry and detail parameters
      await fetchRegistry();
    } catch (err: any) {
      console.error("Pipeline trigger error:", err);
      setError(err.message || "Failed to start pipeline analysis.");
    } finally {
      setProcessingAction(false);
    }
  };

  // Video metadata synchronization functions
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
    <div className="flex flex-col h-screen bg-bg text-text-main font-sans antialiased overflow-hidden">
      <header className="h-12 bg-bg-panel border-b border-border px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-risk-high" />
          <h1 className="text-sm font-mono font-extrabold tracking-wider text-text-main uppercase">
            DRISHTIRAKSHAK AI // EVIDENCE PORTAL
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-text-faint tracking-wider uppercase">
            SECURE CLOUD CONSOLE SESSION
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {listLoading ? (
          <div className="w-[340px] border-r border-border bg-bg-panel p-4 flex items-center justify-center font-mono text-xs text-text-faint">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading Registry Database...
          </div>
        ) : (
          <EvidenceList
            evidence={evidenceList}
            selectedId={selectedId}
            onSelect={(nextId) => navigate(`/dashboard/evidence/${nextId}`)}
          />
        )}

        <div className="flex-1 overflow-y-auto bg-bg p-6 flex flex-col justify-start">
          {error && (
            <div className="mb-6 bg-risk-high/10 border border-risk-high/30 rounded-[var(--radius-custom)] p-4 text-xs font-mono text-risk-high flex items-center justify-between">
              <span>[API CALL EXCEPTION]: {error}</span>
              <button onClick={() => setError(null)} className="text-[10px] hover:underline cursor-pointer">DISMISS</button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-12 bg-bg-panel-raised border border-border rounded-[var(--radius-custom)]" />
              <div className="h-[280px] bg-bg-panel-raised border border-border rounded-[var(--radius-custom)] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-text-faint animate-spin" />
              </div>
              <div className="h-20 bg-bg-panel-raised border border-border rounded-[var(--radius-custom)]" />
              <div className="h-32 bg-bg-panel-raised border border-border rounded-[var(--radius-custom)]" />
            </div>
          ) : selectedItem ? (
            <div className="space-y-6">
              <div className="bg-bg-panel border border-border p-4 rounded-[var(--radius-custom)] flex items-center justify-between font-mono">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-text-main">
                      RECORD: {selectedItem.vehicle}
                    </h2>
                    <span className="text-xs text-text-faint">|</span>
                    <span className="text-[10px] text-text-dim">UUID: {selectedItem.id}</span>
                  </div>
                  <div className="text-[10px] text-text-faint mt-1.5">
                    Uploaded: {new Date(selectedItem.uploaded_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedItem.processing_status} />
                  {selectedItem.locked && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-risk-high/10 border border-risk-high/30 rounded-[var(--radius-custom)] text-[10px] font-bold text-risk-high tracking-wider">
                      <Lock className="w-3.5 h-3.5" /> SECURED
                    </span>
                  )}
                </div>
              </div>

              {selectedItem.processing_status === "FAILED" && (
                <div className="bg-risk-high/10 border border-risk-high/30 rounded-[var(--radius-custom)] p-5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-risk-high shrink-0 mt-0.5" />
                  <div className="font-mono">
                    <h3 className="text-xs font-bold text-risk-high uppercase">
                      Analysis Pipeline Terminated
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed mt-2">
                      {selectedItem.error_message || "Fatal error encountered during core parsing sequence."}
                    </p>
                  </div>
                </div>
              )}

              {(selectedItem.processing_status === "NEW" || selectedItem.processing_status === "PENDING") && (
                <div className="bg-bg-panel border border-border rounded-[var(--radius-custom)] p-12 text-center flex flex-col items-center justify-center font-sans">
                  <Cpu className="w-8 h-8 text-blue-400 mb-4 animate-pulse" />
                  <h3 className="text-xs font-mono font-bold text-text-main uppercase">
                    Run Analysis Pipeline Ingestion
                  </h3>
                  <p className="text-xs text-text-faint font-mono max-w-md mt-2 mb-6 leading-relaxed">
                    This evidence record is registered in the database but the YOLO threat-assessment logic has not yet processed it.
                  </p>
                  <button
                    onClick={handleTriggerProcessing}
                    disabled={processingAction}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-bg text-xs font-mono font-extrabold uppercase rounded-[var(--radius-custom)] tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {processingAction ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Initializing Ingestion...</span>
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
                    <div className="relative bg-black rounded-[var(--radius-custom)] overflow-hidden border border-border">
                      <video
                        ref={videoRef}
                        src={selectedItem.video_file}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        className="w-full h-[280px] object-cover"
                        onClick={togglePlayback}
                      />

                      <div className="bg-bg-panel-raised border-t border-border px-4 py-2 flex items-center justify-between font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={togglePlayback}
                          className="flex items-center gap-1.5 text-text-dim hover:text-text-main transition-colors cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
                        </button>

                        <div className="text-text-dim">
                          <span>
                            {Math.floor(videoCurrentTime / 60)}:
                            {String(Math.floor(videoCurrentTime % 60)).padStart(2, "0")}
                          </span>
                          <span className="mx-1 text-text-faint">/</span>
                          <span className="text-text-faint">
                            {Math.floor(videoDuration / 60)}:
                            {String(Math.floor(videoDuration % 60)).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[280px] bg-bg-panel border border-border rounded-[var(--radius-custom)] flex flex-col items-center justify-center text-center p-6">
                      <AlertTriangle className="w-6 h-6 text-risk-mid mb-2" />
                      <p className="text-xs font-mono text-text-dim">
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
                <div className="border border-border rounded-[var(--radius-custom)] bg-bg-panel overflow-hidden font-mono text-[11px]">
                  <div className="bg-bg-panel-raised px-4 py-2 border-b border-border text-[10px] font-bold text-text-faint tracking-wider uppercase">
                    Telemetry Analysis Log Trace
                  </div>
                  <div className="divide-y divide-border/40">
                    {selectedItem.timeline_events.map((evt) => (
                      <div key={evt.id} className="p-3.5 flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => handleSeek(evt.timestamp_offset_seconds)}
                          className="px-2 py-0.5 bg-bg-panel-raised border border-border hover:border-text-dim rounded text-text-dim hover:text-text-main cursor-pointer"
                        >
                          {evt.timestamp_offset_seconds.toFixed(1)}s
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <EventBadge type={evt.event_type} confidence={evt.confidence} />
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
    </div>
  );
};