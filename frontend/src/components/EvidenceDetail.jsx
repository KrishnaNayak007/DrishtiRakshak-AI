import { useEffect, useRef, useState } from "react";
import { api } from "../api";

function riskColor(score) {
  if (score >= 0.7) return "var(--risk-high)";
  if (score >= 0.35) return "var(--risk-mid)";
  return "var(--risk-none)";
}

export default function EvidenceDetail({ evidenceId, onProcessed }) {
  const [evidence, setEvidence] = useState(null);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  // 1. Initial Load Effect
  useEffect(() => {
    setEvidence(null);
    setError(null);
    if (!evidenceId) return;
    api.getEvidence(evidenceId).then(setEvidence).catch((e) => setError(e.message));
  }, [evidenceId]);

  // 2. Auto-Polling Effect for Async Celery Worker Status updates
  useEffect(() => {
    let intervalId;

    const isBackgroundRunning = 
      evidence?.processing_status === "PENDING" || 
      evidence?.processing_status === "PROCESSING";

    if (evidenceId && isBackgroundRunning) {
      intervalId = setInterval(() => {
        api.getEvidence(evidenceId)
          .then((updated) => {
            setEvidence(updated);
            
            // Once finished, stop the spinner and notify parent
            if (updated.processing_status === "COMPLETED" || updated.processing_status === "FAILED") {
              setProcessing(false);
              onProcessed?.();
            }
          })
          .catch((err) => {
            console.error("Polling error:", err);
          });
      }, 3000); // Check status every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [evidenceId, evidence?.processing_status, onProcessed]);

  if (!evidenceId) {
    return (
      <div className="detail-pane">
        <div className="placeholder">Select an evidence item from the list.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-pane">
        <div className="placeholder">Failed to load: {error}</div>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="detail-pane">
        <div className="placeholder">Loading…</div>
      </div>
    );
  }

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      // Triggers Celery task in background (Returns immediately with 202)
      const updated = await api.processEvidence(evidence.id);
      setEvidence(updated);
    } catch (e) {
      setError(e.message);
      setProcessing(false);
    }
  };

  const jumpTo = (seconds) => {
    if (videoRef.current) videoRef.current.currentTime = seconds;
  };

  const score = evidence.incident?.risk_score ?? 0;
  
  // Safe extraction of nested timeline events
  const timelineEvents = evidence.timeline_events || [];

  // Human-friendly status label mapping our backend states
  const getStatusLabel = () => {
    if (evidence.processing_status === "PENDING") return "Queued in Background...";
    if (evidence.processing_status === "PROCESSING") return "Processing with AI Worker...";
    if (evidence.processing_status === "FAILED") return "Failed";
    return evidence.processed ? "processed" : "not processed";
  };

  const isBusy = processing || 
                 evidence.processing_status === "PENDING" || 
                 evidence.processing_status === "PROCESSING";

  return (
    <div className="detail-pane">
      <video
        ref={videoRef}
        src={evidence.video_file}
        controls
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
      />

      {duration > 0 && timelineEvents.length > 0 && (
        <div className="timeline-track">
          {timelineEvents.map((ev) => (
            <div
              key={ev.id}
              className="timeline-marker"
              data-label={`${ev.event_type} @ ${ev.timestamp_offset_seconds.toFixed(1)}s (conf ${ev.confidence.toFixed(2)})`}
              style={{
                left: `${(ev.timestamp_offset_seconds / duration) * 100}%`,
                background: riskColor(ev.confidence),
              }}
              onClick={() => jumpTo(ev.timestamp_offset_seconds)}
            />
          ))}
        </div>
      )}

      <div className="section-label">Evidence Status</div>
      <div className="locked-badge">
        {evidence.locked ? "🔒 locked" : "unlocked"} · {getStatusLabel()}
      </div>
      {evidence.sha256_hash && <div className="evidence-hash">sha256: {evidence.sha256_hash}</div>}

      {!evidence.processed && (
        <div style={{ marginTop: 16 }}>
          <button className="btn" onClick={handleProcess} disabled={isBusy}>
            {isBusy ? "Processing in Background…" : "Run detection + risk scoring"}
          </button>
        </div>
      )}

      {evidence.incident && (
        <>
          <div className="section-label">Risk Assessment</div>
          <div className="summary-box">{evidence.incident.summary}</div>
        </>
      )}

      {evidence.error_message && (
        <div style={{ color: "var(--risk-high)", marginTop: 12 }}>
          Worker Error: {evidence.error_message}
        </div>
      )}

      {error && <div style={{ color: "var(--risk-high)", marginTop: 12 }}>{error}</div>}
    </div>
  );
}