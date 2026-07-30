import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Video, Search, Car, AlertTriangle, 
  Menu, X, Bell, LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Evidence Clips', path: '/dashboard/evidence', icon: Video },
    { name: 'Semantic Search', path: '/dashboard/search', icon: Search },
    { name: 'Vehicles', path: '/dashboard/vehicles', icon: Car },
    { name: 'Incidents', path: '/dashboard/incidents', icon: AlertTriangle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <span className="text-lg font-bold tracking-wider text-emerald-500 flex items-center gap-2">
              DRISHTI <span className="text-slate-400 font-light">AI</span>
            </span>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1 rounded hover:bg-slate-800 text-slate-400 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-slate-800 text-emerald-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border-l-2 border-emerald-500' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Drishti</span>
            <span>/</span>
            <span className="text-slate-200 capitalize">
              {location.pathname.split('/').pop() || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Connection Indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pipeline: Live</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full hover:bg-slate-800 text-slate-300 transition"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800 font-semibold text-xs text-slate-400">
                    Background Processing Activities
                  </div>
                  <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                    <div className="text-xs">
                      <p className="text-slate-200 font-medium">Pipeline execution finished</p>
                      <p className="text-slate-500">Video #2094 analysis succeeded</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Meta */}
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-200">{user?.username || 'Fleet Admin'}</p>
              <p className="text-[10px] text-slate-500">{user?.organization || 'Global Logistics HQ'}</p>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};