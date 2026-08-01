import React from "react";
import { CheckCircle2, Loader2, AlertTriangle, Clock, HelpCircle, Car, User, Activity, Gauge } from "lucide-react";

interface StatusTagProps {
  status: "NEW" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const config = {
    NEW: {
      bg: "bg-slate-500/5 border-slate-500/20 text-slate-400",
      text: "NEW",
      icon: <Clock className="w-2.5 h-2.5" />,
    },
    PENDING: {
      bg: "bg-blue-500/5 border-blue-500/20 text-blue-400 animate-pulse",
      text: "QUEUED",
      icon: <Clock className="w-2.5 h-2.5" />,
    },
    PROCESSING: {
      bg: "bg-amber-500/5 border-amber-500/25 text-amber-400",
      text: "SCANNING",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />,
    },
    COMPLETED: {
      bg: "bg-emerald-500/5 border-emerald-500/25 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.08)]",
      text: "PROCESSED",
      icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    },
    FAILED: {
      bg: "bg-rose-500/5 border-rose-500/25 text-rose-400",
      text: "FAILED",
      icon: <AlertTriangle className="w-2.5 h-2.5" />,
    },
  };

  const active = config[status] || config.NEW;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-mono font-bold tracking-widest uppercase ${active.bg}`}>
      {active.icon}
      <span>{active.text}</span>
    </span>
  );
};

interface EventTagProps {
  type: "vehicle_detected" | "person_detected" | "sustained_proximity" | "sudden_deceleration" | "other";
  confidence: number;
}

export const EventTag: React.FC<EventTagProps> = ({ type, confidence }) => {
  const config = {
    vehicle_detected: {
      bg: "bg-sky-500/5 border-sky-500/20 text-sky-400",
      label: "VEHICLE DETECTED",
      icon: <Car className="w-3 h-3" />,
    },
    person_detected: {
      bg: "bg-purple-500/5 border-purple-500/20 text-purple-400",
      label: "PEDESTRIAN",
      icon: <User className="w-3 h-3" />,
    },
    sustained_proximity: {
      bg: "bg-amber-500/5 border-amber-500/20 text-amber-400",
      label: "PROXIMITY WARNING",
      icon: <Activity className="w-3 h-3" />,
    },
    sudden_deceleration: {
      bg: "bg-rose-500/5 border-rose-500/20 text-rose-400",
      label: "DECELERATION SPIKE",
      icon: <Gauge className="w-3 h-3" />,
    },
    other: {
      bg: "bg-slate-500/5 border-slate-500/20 text-slate-400",
      label: "MISC TELEMETRY",
      icon: <HelpCircle className="w-3 h-3" />,
    },
  };

  const active = config[type] || config.other;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border font-mono text-[9px] font-bold tracking-wider uppercase ${active.bg}`}>
      {active.icon}
      <span>{active.label}</span>
      <span className="opacity-45 text-[8px] font-normal">({(confidence * 100).toFixed(0)}% MATCH)</span>
    </span>
  );
};