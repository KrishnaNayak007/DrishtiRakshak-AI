import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Shield, 
  Activity, 
  Database, 
  Clock, 
  User, 
  ChevronRight,
  ChevronDown,
  Sun, 
  Moon, 
  Menu,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Search,
  Tv,
  Settings as SettingsIcon,
  LogOut,
  Siren
} from "lucide-react";

interface NavbarProps {
  currentTab?: "live" | "search" | "police";
  onTabChange?: (tab: "live" | "search" | "police") => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab = "live",
  onTabChange,
  sidebarOpen = true,
  onToggleSidebar
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [systemTime, setSystemTime] = useState(new Date().toISOString());
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("dr_theme") as "light" | "dark") || "dark"
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/auth");
  };

  // Synchronize theme with document root class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
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
    <nav className="h-14 bg-bg-panel border-b border-border px-5 flex items-center justify-between shrink-0 font-sans shadow-xs transition-colors duration-150 backdrop-blur-md relative z-40">
      <div className="flex items-center gap-4">
        {/* Sidebar open/close toggle with AI-style animated hover */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-500/5 text-text-dim hover:text-emerald-400 transition-all duration-200 cursor-pointer flex items-center justify-center mr-1"
            title={sidebarOpen ? "Collapse Edge Registry" : "Expand Edge Registry"}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
        )}

        <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
          <Shield className="w-5 h-5 fill-current animate-pulse" />
          <span className="font-extrabold tracking-wider text-xs uppercase font-mono hidden sm:inline-block">DRISHTIRAKSHAK AI</span>
        </div>
        
        <div className="h-4 w-px bg-border hidden sm:block" />
        
        {/* Node dropdown */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-text-dim font-medium">
          <select className="bg-transparent border-none text-text-dim font-semibold focus:outline-none cursor-pointer hover:text-text-main pr-1 font-mono">
            <option>Bhubaneswar_Node_04</option>
            <option>Cuttack_Cluster_02</option>
            <option>Puri_Edge_09</option>
          </select>
          <ChevronRight className="w-3.5 h-3.5 text-text-faint" />
        </div>

        {/* View Switcher: Live incident vs Semantic vector search */}
        {onTabChange && (
          <div className="flex bg-bg-panel-raised border border-border p-0.5 rounded-xl ml-2 shadow-inner">
            <button
              onClick={() => onTabChange("live")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === "live"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm"
                  : "text-text-dim hover:text-text-main"
              }`}
            >
              <Tv size={13} />
              <span className="hidden xs:inline">Live HUD Console</span>
            </button>
            <button
              onClick={() => onTabChange("search")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === "search"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm"
                  : "text-text-dim hover:text-text-main"
              }`}
            >
              <Search size={13} />
              <span className="hidden xs:inline">Vector Search Ledger</span>
              <span className="bg-cyan-500/20 text-cyan-400 dark:bg-cyan-950/40 text-[8px] font-mono font-bold px-1 rounded-sm border border-cyan-400/20 animate-pulse ml-0.5">AI</span>
            </button>

            {/* Police Dispatch Hub option ONLY for Police role */}
            {user?.role === "POLICE" && (
              <button
                onClick={() => onTabChange("police")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  currentTab === "police"
                    ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm"
                    : "text-text-dim hover:text-text-main"
                }`}
              >
                <Siren size={13} className={currentTab === "police" ? "animate-spin" : "text-rose-400"} />
                <span className="hidden xs:inline">Police Dispatch Hub</span>
                <span className="bg-rose-500/20 text-rose-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-rose-400/30 animate-pulse ml-0.5">SOS</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-5 text-xs text-text-dim">
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Edge: <span className="text-text-main font-bold font-mono">14ms</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>DB: <span className="text-text-main font-bold font-mono">Synced</span></span>
          </div>
        </div>

        <div className="h-4 w-px bg-border hidden lg:block" />

        {/* Dynamic theme switcher button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-bg-panel-raised border border-border text-text-dim hover:text-text-main transition-all cursor-pointer"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-text-faint" />
          <span className="tabular-nums font-bold text-text-dim">{systemTime.replace("T", " ").substring(11, 19)} UTC</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-text-main font-bold cursor-pointer hover:bg-bg-panel-raised px-2 py-1 rounded-lg transition-colors"
          >
            <User className="w-3.5 h-3.5 text-text-dim" />
            <span className="hidden xs:inline">{user?.username || "admin"}</span>
            <ChevronDown className={`w-3 h-3 text-text-faint transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-bg-panel border border-border rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3.5 py-2.5 border-b border-border space-y-1">
                <p className="text-xs font-bold text-text-main truncate">{user?.full_name || user?.username || "System Operator"}</p>
                <p className="text-[10px] text-text-faint truncate">{user?.email || user?.organization}</p>
                <div className="pt-1 flex items-center gap-1">
                  <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                    user?.role === "POLICE"
                      ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
                      : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                  }`}>
                    ROLE: {user?.role || "DRIVER"}
                  </span>
                </div>
              </div>

              {/* Portal Switcher Link ONLY for Police role */}
              {user?.role === "POLICE" && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onTabChange) {
                      onTabChange(currentTab === "police" ? "live" : "police");
                    } else {
                      navigate(currentTab === "police" ? "/dashboard" : "/police");
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-main hover:bg-bg-panel-raised transition-colors cursor-pointer border-b border-border/50 font-semibold"
                >
                  {currentTab === "police" ? (
                    <>
                      <Tv className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Switch to Driver HUD</span>
                    </>
                  ) : (
                    <>
                      <Siren className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span>Police Control Room Portal</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => { setMenuOpen(false); navigate("/dashboard/settings"); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-dim hover:text-text-main hover:bg-bg-panel-raised transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};