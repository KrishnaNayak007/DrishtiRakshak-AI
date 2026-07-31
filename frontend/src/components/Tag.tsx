import React from "react";
import { CheckCircle2, Loader2, AlertTriangle, Clock, HelpCircle, Car, User, Activity, Gauge } from "lucide-react";

interface StatusTagProps {
  status: "NEW" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const config = {
    NEW: {
      bg: "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
      text: "NEW",
      icon: <Clock className="w-3 h-3 text-slate-500" />,
    },
    PENDING: {
      bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse",
      text: "QUEUED",
      icon: <Clock className="w-3 h-3 text-blue-500" />,
    },
    PROCESSING: {
      bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-300",
      text: "PROCESSING",
      icon: <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />,
    },
    COMPLETED: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      text: "PROCESSED",
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    },
    FAILED: {
      bg: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300",
      text: "FAILED",
      icon: <AlertTriangle className="w-3 h-3 text-red-500" />,
    },
  };

  const active = config[status] || config.NEW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${active.bg}`}>
      {active.icon}
      {active.text}
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
      bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300",
      label: "Vehicle",
      icon: <Car className="w-3.5 h-3.5" />,
    },
    person_detected: {
      bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 text-purple-700 dark:text-purple-300",
      label: "Pedestrian",
      icon: <User className="w-3.5 h-3.5" />,
    },
    sustained_proximity: {
      bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-300",
      label: "Tailgating Alert",
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    sudden_deceleration: {
      bg: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300",
      label: "Deceleration Spike",
      icon: <Gauge className="w-3.5 h-3.5" />,
    },
    other: {
      bg: "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
      label: "Other Event",
      icon: <HelpCircle className="w-3.5 h-3.5" />,
    },
  };

  const active = config[type] || config.other;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-custom)] border font-mono text-xs font-semibold ${active.bg}`}>
      {active.icon}
      <span>{active.label}</span>
      <span className="opacity-60 text-[10px]">({(confidence * 100).toFixed(0)}%)</span>
    </span>
  );
};