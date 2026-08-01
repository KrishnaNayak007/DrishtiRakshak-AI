import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("dr_theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("dr_theme", theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text-main mb-6 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Evidence Console</span>
      </button>

      <h1 className="text-lg font-bold mb-6">Settings</h1>

      <div className="bg-bg-panel border border-border rounded-xl p-5 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-faint mb-3">Account</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bg-panel-raised border border-border flex items-center justify-center">
            <UserIcon size={18} className="text-text-dim" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.username || "admin"}</p>
            <p className="text-xs text-text-faint">{user?.organization || ""}</p>
          </div>
        </div>
      </div>

      <div className="bg-bg-panel border border-border rounded-xl p-5 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-faint mb-3">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-bg-panel-raised text-xs font-medium cursor-pointer"
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
            <span>Switch to {theme === "light" ? "Dark" : "Light"}</span>
          </button>
        </div>
      </div>

      <div className="bg-bg-panel border border-border rounded-xl p-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};