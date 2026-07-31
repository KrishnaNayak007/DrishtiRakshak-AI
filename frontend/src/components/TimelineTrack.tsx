import React from "react";
import { TimelineEvent } from "../pages/EvidenceConsole";

interface TimelineTrackProps {
  events: TimelineEvent[];
  videoDuration: number;
  videoCurrentTime: number;
  onMarkerClick: (seconds: number) => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  events,
  videoDuration,
  videoCurrentTime,
  onMarkerClick,
}) => {
  const normalizedDuration = videoDuration > 0 ? videoDuration : 1;
  const playheadPercent = (videoCurrentTime / normalizedDuration) * 100;

  const getMarkerClass = (type: string, isHighlighted: boolean) => {
    const base = "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-150 z-10 cursor-pointer shadow-md transform -translate-x-1/2 hover:scale-125 focus:outline-none";
    if (type === "sudden_deceleration") {
      return `${base} bg-red-500 border-white ring-2 ${isHighlighted ? "ring-red-600 scale-125" : "ring-transparent"}`;
    }
    if (type === "sustained_proximity") {
      return `${base} bg-amber-500 border-white ring-2 ${isHighlighted ? "ring-amber-600 scale-125" : "ring-transparent"}`;
    }
    return `${base} bg-slate-400 border-white ring-2 ${isHighlighted ? "ring-slate-600 scale-125" : "ring-transparent"}`;
  };

  return (
    <div className="font-sans py-4 border-t border-border mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-bold text-text-dim tracking-wider uppercase font-mono">
          Asynchronous Video Analysis Track ({normalizedDuration.toFixed(1)}s)
        </h4>
        <span className="text-[10px] font-mono text-text-faint">
          {events.length} flagged events
        </span>
      </div>

      <div className="relative bg-slate-50 border border-border rounded-[var(--radius-custom)] p-4 h-16 flex items-center shadow-xs">
        {/* Continuous Track Base Line */}
        <div className="absolute left-4 right-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          {/* Real-time Playhead Progression */}
          <div
            className="h-full bg-blue-500/30 transition-all duration-75"
            style={{ width: `${Math.min(playheadPercent, 100)}%` }}
          />
        </div>

        {/* Scaled Events Overlay */}
        <div className="absolute left-4 right-4 h-full flex items-center">
          {events.map((evt) => {
            const positionPct = (evt.timestamp_offset_seconds / normalizedDuration) * 100;
            const isHighlighted = Math.abs(videoCurrentTime - evt.timestamp_offset_seconds) < 1.5;

            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => onMarkerClick(evt.timestamp_offset_seconds)}
                className={getMarkerClass(evt.event_type, isHighlighted)}
                style={{ left: `${Math.min(Math.max(positionPct, 0), 100)}%` }}
                title={`${evt.event_type}: ${evt.timestamp_offset_seconds.toFixed(1)}s`}
              >
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-800 text-[9px] text-white py-1 px-2 rounded font-mono shadow-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  <span className="font-bold">{evt.timestamp_offset_seconds.toFixed(1)}s</span> - {evt.event_type}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};