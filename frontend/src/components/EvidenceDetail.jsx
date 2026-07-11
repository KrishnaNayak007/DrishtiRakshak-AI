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

  useEffect(() => {
    setEvidence(null);
    setError(null);
    if (!evidenceId) return;
    api.getEvidence(evidenceId).then(setEvidence).catch((e) => setError(e.message));
  }, [evidenceId]);

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
      const updated = await api.processEvidence(evidence.id);
      setEvidence(updated);
      onProcessed?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const jumpTo = (seconds) => {
    if (videoRef.current) videoRef.current.currentTime = seconds;
  };

  const score = evidence.incident?.risk_score ?? 0;

  return (
    <div className="detail-pane">
      <video
        ref={videoRef}
        src={evidence.video_file}
        controls
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
      />

      {duration > 0 && (
        <div className="timeline-track">
          {evidence.timeline_events.map((ev) => (
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
        {evidence.locked ? "🔒 locked" : "unlocked"} · {evidence.processed ? "processed" : "not processed"}
      </div>
      {evidence.sha256_hash && <div className="evidence-hash">sha256: {evidence.sha256_hash}</div>}

      {!evidence.processed && (
        <div style={{ marginTop: 16 }}>
          <button className="btn" onClick={handleProcess} disabled={processing}>
            {processing ? "Processing…" : "Run detection + risk scoring"}
          </button>
        </div>
      )}

      {evidence.incident && (
        <>
          <div className="section-label">Risk Assessment</div>
          <div className="summary-box">{evidence.incident.summary}</div>
        </>
      )}

      {error && <div style={{ color: "var(--risk-high)", marginTop: 12 }}>{error}</div>}
    </div>
  );
}
