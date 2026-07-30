import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Eye, EyeOff } from 'lucide-react';

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
      setError(err.response?.data?.detail || 'Authentication credentials rejected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Shield size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white">Console Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">DrishtiRakshak Secure Access Gateway</p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition duration-200"
              placeholder="e.g., administrator_hq"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition duration-200"
                placeholder="••••••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold py-3 px-4 rounded-lg text-sm transition duration-200"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-500">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button 
          onClick={() => { /* Standard OAuth redirect handler */ }}
          className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-3 transition"
        >
          {/* Minimal Google SVG Icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02 0 12 0 7.35 0 3.37 2.67 1.47 6.56l3.86 3C6.27 6.95 8.93 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.63z" />
            <path fill="#FBBC05" d="M5.33 14.44a7.12 7.12 0 0 1 0-4.88l-3.86-3C.54 8.52 0 10.2 0 12s.54 3.48 1.47 5.44l3.86-3z" fillRule="evenodd" />
            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.36 1.11-4.23 1.11-3.07 0-5.73-1.91-6.67-4.52l-3.86 3C3.37 21.33 7.35 24 12 24z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};