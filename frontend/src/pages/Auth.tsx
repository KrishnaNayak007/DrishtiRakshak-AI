import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Eye, EyeOff, Activity, Database, Sparkles, Terminal, ChevronRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication credentials rejected. Please check username/password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* LEFT SIDE: AI System Showcase & Live Visuals */}
      <div className="w-full md:w-1/2 bg-slate-950 border-r border-border p-8 flex flex-col justify-between relative overflow-hidden">
        
        {/* Animated Background Overlay: Radar Sweep & Telemetry grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px]" />
          <svg className="absolute w-[400px] h-[400px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 opacity-60" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="0.5" />
            <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="0.5" />
            {/* Radar sweep wedge */}
            <path d="M100,100 L180,100 A80,80 0 0,0 156.5,43.5 Z" fill="rgba(16, 185, 129, 0.25)" className="radar-sweep" />
          </svg>
        </div>

        {/* Brand header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Shield size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase font-mono">DRISHTIRAKSHAK AI</h1>
            <span className="text-[10px] text-emerald-500 font-mono tracking-wider font-semibold">EDGE SECURITY NETWORK</span>
          </div>
        </div>

        {/* Hero showcase */}
        <div className="my-auto py-12 relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles size={12} className="animate-pulse" />
            <span>AI Incident Diagnostics Active</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Real-time visual telemetry <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              for connected fleets.
            </span>
          </h2>
          <p className="text-xs text-text-dim leading-relaxed">
            Harness computer vision logic on the edge to capture sudden vehicle deceleration events, compute security risk indices, and lock immutable cryptographic hashes to the blockchain ledger.
          </p>

          {/* Micro Telemetry Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 font-mono text-[10px]">
            <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
              <Activity size={16} className="text-emerald-400 shrink-0" />
              <div>
                <span className="text-text-dim block">EDGE LATENCY</span>
                <span className="text-white font-bold">14ms average</span>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
              <Database size={16} className="text-cyan-400 shrink-0" />
              <div>
                <span className="text-text-dim block">MATRIX SEARCH</span>
                <span className="text-white font-bold">Vector-Linked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-[10px] text-text-faint font-mono relative z-10">
          <Terminal size={12} />
          <span>DRISHTI NODE // ASIA-EAST-04 // STABLE-v1.14.2</span>
        </div>
      </div>

      {/* RIGHT SIDE: Conversational Humanized Access Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-bg relative">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Conversational Heading */}
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-text-main tracking-tight">
              Hello Operator,
            </h3>
            <p className="text-sm text-text-dim leading-relaxed">
              Please authenticate below to access the forensic registry logs and telemetry playback console.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 animate-shake">
              <Shield size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Access Denied</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Humanized Input Fields with Icons */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-text-dim uppercase tracking-wider">
                <Terminal size={12} className="text-emerald-500" />
                <span>Your Operator Username</span>
              </label>
              <div className="relative group">
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-panel-raised border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/35 rounded-xl px-4 py-3 text-sm text-text-main placeholder:text-text-faint focus:outline-none transition-all duration-200"
                  placeholder="e.g. administrator_hq"
                />
              </div>
              <span className="text-[10px] text-text-faint font-mono">Typically your agency-registered username.</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-text-dim uppercase tracking-wider">
                <Key size={12} className="text-emerald-500" />
                <span>Secure Console Password</span>
              </label>
              <div className="relative group">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-panel-raised border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/35 rounded-xl pl-4 pr-11 py-3 text-sm text-text-main placeholder:text-text-faint focus:outline-none transition-all duration-200"
                  placeholder="••••••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-dim transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="text-[10px] text-text-faint font-mono">Input case-sensitive hardware security key passphrase.</span>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Unlock Edge Console</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg px-3 text-text-faint font-mono font-bold tracking-wider">SECURE SINGLE SIGN-ON</span>
            </div>
          </div>

          {/* Google OAuth Button with updated layout */}
          <button 
            type="button"
            onClick={() => { /* Redirect to standard Google authentication endpoint */ }}
            className="w-full bg-bg-panel-raised border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-text-main py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition active:scale-[0.98] cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 0 12 0 7.35 0 3.37 2.67 1.47 6.56l3.86 3C6.27 6.95 8.93 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.63z" />
              <path fill="#FBBC05" d="M5.33 14.44a7.12 7.12 0 0 1 0-4.88l-3.86-3C.54 8.52 0 10.2 0 12s.54 3.48 1.47 5.44l3.86-3z" fillRule="evenodd" />
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.36 1.11-4.23 1.11-3.07 0-5.73-1.91-6.67-4.52l-3.86 3C3.37 21.33 7.35 24 12 24z" />
            </svg>
            <span>Sign in with Operator ID</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Auth;