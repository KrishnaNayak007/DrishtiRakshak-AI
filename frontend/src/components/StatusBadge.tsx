import React from "react";
import { 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  Car, 
  User, 
  Activity, 
  Gauge 
} from "lucide-react";

interface StatusBadgeProps {
  status: "NEW" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    NEW: {
      bg: "bg-risk-none/10 border-risk-none/40 text-text-dim",
      text: "NEW",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    PENDING: {
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse",
      text: "QUEUED",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    PROCESSING: {
      bg: "bg-risk-mid/10 border-risk-mid/30 text-risk-mid",
      text: "PROCESSING",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    COMPLETED: {
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      text: "PROCESSED",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    FAILED: {
      bg: "bg-risk-high/10 border-risk-high/30 text-risk-high",
      text: "FAILED",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
  };

  const active = config[status] || config.NEW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-custom)] border text-[10px] font-mono font-semibold tracking-wider ${active.bg}`}>
      {active.icon}
      {active.text}
    </span>
  );
};

interface EventBadgeProps {
  type: "vehicle_detected" | "person_detected" | "sustained_proximity" | "sudden_deceleration" | "other";
  confidence: number;
}

export const EventBadge: React.FC<EventBadgeProps> = ({ type, confidence }) => {
  const config = {
    vehicle_detected: {
      bg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      label: "Vehicle Det.",
      icon: <Car className="w-3.5 h-3.5" />,
    },
    person_detected: {
      bg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      label: "Pedestrian Det.",
      icon: <User className="w-3.5 h-3.5" />,
    },
    sustained_proximity: {
      bg: "bg-risk-mid/10 border-risk-mid/20 text-risk-mid",
      label: "Proximity Alert",
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    sudden_deceleration: {
      bg: "bg-risk-high/10 border-risk-high/20 text-risk-high",
      label: "Sudden Decel.",
      icon: <Gauge className="w-3.5 h-3.5" />,
    },
    other: {
      bg: "bg-risk-none/10 border-risk-none/20 text-text-dim",
      label: "Misc Event",
      icon: <HelpCircle className="w-3.5 h-3.5" />,
    },
  };

  const active = config[type] || config.other;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-custom)] border font-mono text-xs ${active.bg}`}>
      {active.icon}
      <span>{active.label}</span>
      <span className="opacity-60 text-[10px]">({(confidence * 100).toFixed(0)}%)</span>
    </span>
  );
};