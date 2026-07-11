function riskColor(score) {
  if (score >= 0.7) return "var(--risk-high)";
  if (score >= 0.35) return "var(--risk-mid)";
  return "var(--risk-none)";
}

function riskLabel(score) {
  if (score >= 0.7) return "HIGH";
  if (score >= 0.35) return "MED";
  if (score > 0) return "LOW";
  return "NONE";
}

export default function EvidenceList({ items, selectedId, onSelect }) {
  if (items.length === 0) {
    return (
      <div className="evidence-list">
        <div className="empty-state">
          No evidence uploaded yet.
          <br />
          Upload a clip via <code>/api/evidence/</code> to see it here.
        </div>
      </div>
    );
  }

  return (
    <div className="evidence-list">
      {items.map((item) => {
        const score = item.incident?.risk_score ?? 0;
        return (
          <div
            key={item.id}
            className={`evidence-row ${item.id === selectedId ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <div className="row-top">
              <span className="veh">{item.vehicle}</span>
              <span className="risk-chip" style={{ background: riskColor(score) }}>
                {riskLabel(score)}
              </span>
            </div>
            <div className="meta">
              {new Date(item.uploaded_at).toLocaleString()} · {item.processed ? "processed" : "pending"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
