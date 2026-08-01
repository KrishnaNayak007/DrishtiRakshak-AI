import React from "react";
import { TimelineEvent } from "../pages/EvidenceConsole";
import { Car, User, Activity, Gauge, HelpCircle, Sparkles } from "lucide-react";

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

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "vehicle_detected":
        return <Car className="w-2.5 h-2.5 text-white" />;
      case "person_detected":
        return <User className="w-2.5 h-2.5 text-white" />;
      case "sustained_proximity":
        return <Activity className="w-2.5 h-2.5 text-white" />;
      case "sudden_deceleration":
        return <Gauge className="w-2.5 h-2.5 text-white" />;
      default:
        return <HelpCircle className="w-2.5 h-2.5 text-white" />;
    }
  };

  const getMarkerColor = (type: string, isHighlighted: boolean) => {
    const base = "absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-slate-950 flex items-center justify-center transition-all duration-200 z-10 cursor-pointer shadow-md transform -translate-x-1/2 hover:scale-125 focus:outline-none";
    if (type === "sudden_deceleration") {
      return `${base} bg-rose-500 hover:bg-rose-600 ring-2 ${isHighlighted ? "ring-rose-400 scale-125 shadow-[0_0_10px_rgba(244,63,94,0.6)]" : "ring-transparent"}`;
    }
    if (type === "sustained_proximity") {
      return `${base} bg-amber-500 hover:bg-amber-600 ring-2 ${isHighlighted ? "ring-amber-400 scale-125 shadow-[0_0_10px_rgba(245,158,11,0.6)]" : "ring-transparent"}`;
    }
    if (type === "vehicle_detected") {
      return `${base} bg-sky-500 hover:bg-sky-600 ring-2 ${isHighlighted ? "ring-sky-400 scale-125 shadow-[0_0_10px_rgba(56,189,248,0.6)]" : "ring-transparent"}`;
    }
    if (type === "person_detected") {
      return `${base} bg-purple-500 hover:bg-purple-600 ring-2 ${isHighlighted ? "ring-purple-400 scale-125 shadow-[0_0_10px_rgba(168,85,247,0.6)]" : "ring-transparent"}`;
    }
    return `${base} bg-slate-500 hover:bg-slate-600 ring-2 ${isHighlighted ? "ring-slate-400 scale-125" : "ring-transparent"}`;
  };

  return (
    <div className="font-sans py-4 border-t border-border mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-bold text-text-dim tracking-wider uppercase font-mono flex items-center gap-1.5">
          <Sparkles size={12} className="text-emerald-500 animate-pulse" />
          <span>Multi-modal AI Timeline Track ({normalizedDuration.toFixed(1)}s)</span>
        </h4>
        <span className="text-[9px] font-mono text-text-faint bg-bg-panel-raised border border-border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          {events.length} flagged events
        </span>
      </div>

      <div className="relative bg-bg-panel-raised border border-border rounded-xl p-4 h-14 flex items-center shadow-inner overflow-visible">
        {/* Continuous Track Base Line */}
        <div className="absolute left-4 right-4 h-2 bg-border rounded-full overflow-hidden">
          {/* Real-time Playhead Progression */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-75"
            style={{ width: `${Math.min(playheadPercent, 100)}%` }}
          />
        </div>

        {/* Scaled Events Overlay */}
        <div className="absolute left-4 right-4 h-full flex items-center">
          {events.map((evt) => {
            const positionPct = (evt.timestamp_offset_seconds / normalizedDuration) * 100;
            const isHighlighted = Math.abs(videoCurrentTime - evt.timestamp_offset_seconds) < 1.0;

            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => onMarkerClick(evt.timestamp_offset_seconds)}
                className={getMarkerColor(evt.event_type, isHighlighted)}
                style={{ left: `${Math.min(Math.max(positionPct, 0), 100)}%` }}
                title={`${evt.event_type}: ${evt.timestamp_offset_seconds.toFixed(1)}s`}
              >
                {getMarkerIcon(evt.event_type)}
                
                {/* Micro Tooltip */}
                <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-border text-[9px] text-white py-1.5 px-2 rounded-lg shadow-2xl opacity-0 hover:opacity-100 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30 font-mono scale-95 origin-bottom hover:scale-100">
                  <div className="flex items-center gap-1.5 border-b border-border pb-0.5 mb-1 text-[8px] font-bold uppercase text-emerald-400">
                    <span>{evt.event_type.replace('_', ' ')}</span>
                    <span className="text-text-faint">|</span>
                    <span>{(evt.confidence * 100).toFixed(0)}% Match</span>
                  </div>
                  <span>Timestamp: <strong>{evt.timestamp_offset_seconds.toFixed(1)}s</strong></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};