import React, { useState, useEffect } from "react";
import { Shield, Activity, Database, Clock, User, ChevronRight, Sun, Moon, RefreshCw } from "lucide-react";

export const Navbar: React.FC = () => {
  const [systemTime, setSystemTime] = useState(new Date().toISOString());
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("dr_theme") as "light" | "dark") || "light"
  );

  // Synchronize theme with document root class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("dr_theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <nav className="h-14 bg-bg-panel border-b border-border px-5 flex items-center justify-between shrink-0 font-sans shadow-xs transition-colors duration-150">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-risk-high">
          <Shield className="w-5 h-5 fill-current" />
          <span className="font-extrabold tracking-wider text-sm uppercase font-mono">DRISHTIRAKSHAK AI</span>
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-1.5 text-xs text-text-dim font-medium">
          <select className="bg-transparent border-none text-text-dim font-semibold focus:outline-none cursor-pointer hover:text-text-main">
            <option>Bhubaneswar_Node_04</option>
            <option>Cuttack_Cluster_02</option>
            <option>Puri_Edge_09</option>
          </select>
          <ChevronRight className="w-3.5 h-3.5 text-text-faint" />
          <span className="text-text-main font-bold">Evidence Console</span>
        </div>
      </div>

      <div className="flex items-center gap-5 text-xs text-text-dim">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Latency: <span className="text-text-main font-bold">14ms</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>DB State: <span className="text-text-main font-bold">Online</span></span>
          </div>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Dynamic theme switcher button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-bg-panel-raised border border-border text-text-dim hover:text-text-main transition-colors cursor-pointer"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2 font-mono">
          <Clock className="w-3.5 h-3.5 text-text-faint" />
          <span className="tabular-nums">{systemTime.replace("T", " ").substring(0, 19)} UTC</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2 text-text-main font-bold">
          <User className="w-3.5 h-3.5 text-text-dim" />
          <span>admin@drishtirakshak</span>
        </div>
      </div>
    </nav>
  );
};