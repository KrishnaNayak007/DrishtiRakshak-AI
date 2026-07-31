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
  // Safe calculation if video metadata hasn't loaded
  const normalizedDuration = videoDuration > 0 ? videoDuration : 1;

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "sudden_deceleration":
        return "bg-risk-high shadow-[0_0_8px_var(--color-risk-high)]";
      case "sustained_proximity":
        return "bg-risk-mid shadow-[0_0_8px_var(--color-risk-mid)]";
      default:
        return "bg-risk-none";
    }
  };

  const playheadPercent = (videoCurrentTime / normalizedDuration) * 100;

  return (
    <div className="font-sans py-4 border-t border-border mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-bold text-text-faint tracking-wider uppercase font-mono">
          Asynchronous Video Analysis Track ({normalizedDuration.toFixed(1)}s)
        </h4>
        <span className="text-[10px] font-mono text-text-dim">
          {events.length} target telemetry flags
        </span>
      </div>

      <div className="relative bg-bg-panel border border-border rounded-[var(--radius-custom)] p-4 h-16 flex items-center">
        {/* Continuous Track Base Line */}
        <div className="absolute left-4 right-4 h-1.5 bg-bg-panel-raised rounded-full overflow-hidden">
          {/* Real-time Playhead Progression */}
          <div
            className="h-full bg-risk-mid/30 transition-all duration-75"
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
                className="absolute transform -translate-x-1/2 group focus:outline-none z-10 cursor-pointer"
                style={{ left: `${Math.min(Math.max(positionPct, 0), 100)}%` }}
              >
                {/* Visual Marker Pinpoint */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border border-bg-panel-raised transition-all duration-150 ${
                    isHighlighted ? "scale-125 ring-2 ring-text-main" : ""
                  } ${getMarkerColor(evt.event_type)}`}
                />

                {/* Popover Hover Flag */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-bg-panel-raised border border-border text-[9px] text-text-main py-1 px-2 rounded font-mono shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
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