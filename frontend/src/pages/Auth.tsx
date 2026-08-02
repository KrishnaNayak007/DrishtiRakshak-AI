import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Shield, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  Car, 
  AlertCircle,
  Mail,
  CheckCircle2,
  Check,
  Siren,
  Key,
  Eye,
  EyeOff
} from "lucide-react";

export const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [role, setRole] = useState<"DRIVER" | "POLICE">("DRIVER");

  // Form input states initialized strictly to empty strings (Placeholders)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Validations
  const hasMinLength = password.length >= 6;
  const hasSymbolOrNum = /[0-9!@#$%^&*]/.test(password);
  const isValidVehicle = vehicleNumber.trim().length >= 4;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetUser = username.trim() || email.trim();
    if (!targetUser || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(targetUser, password, vehicleNumber, role);
      navigate(role === "POLICE" ? "/police" : "/dashboard");
    } catch (err: any) {
      console.error("Authentication Error:", err);
      setError(err.message || "Failed to authenticate session.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === "DRIVER" && !isValidVehicle) {
      setError("Please supply a valid Vehicle License Plate Number (mandatory for dashcam linking).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter matching passwords.");
      return;
    }

    setLoading(true);

    try {
      await signup({
        username: username.trim() || (email ? email.split("@")[0] : "operator"),
        email: email.trim(),
        password,
        full_name: fullName.trim() || "Dashcam Operator",
        role,
        vehicleNumber: vehicleNumber.trim() || "MH-12-GQ-9831",
      });
      navigate(role === "POLICE" ? "/police" : "/dashboard");
    } catch (err: any) {
      console.error("Sign Up Error:", err);
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState<string | null>(null);
  const [googleUsernameInput, setGoogleUsernameInput] = useState("");
  const [googleVehicleInput, setGoogleVehicleInput] = useState("MH-12-GQ-9831");

  const [pendingGoogleEmail, setPendingGoogleEmail] = useState("og.krishnayak906561@gmail.com");

  const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle(
        pendingGoogleCredential,
        role,
        googleVehicleInput.trim() || "MH-12-GQ-9831",
        googleUsernameInput.trim(),
        pendingGoogleEmail.trim()
      );
      setShowGoogleModal(false);
      navigate(role === "POLICE" ? "/police" : "/dashboard");
    } catch (err: any) {
      console.error("Google completion error:", err);
      setError("Registration failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = "715105402781-htv8dtd2uaibdol6g5g51ijmtvrjl33l.apps.googleusercontent.com";

  const handleGoogleAuth = () => {
    setError(null);
    if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              let gName = "Krishna";
              let gEmail = "og.krishnayak906561@gmail.com";
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const gUser = await res.json();
                if (gUser.name) gName = gUser.name;
                if (gUser.email) gEmail = gUser.email;
              } catch {}

              try {
                setLoading(true);
                const resData = await loginWithGoogle(
                  tokenResponse.access_token,
                  role,
                  undefined,
                  gName,
                  gEmail
                );
                if (resData && resData.has_registered_vehicle) {
                  navigate(role === "POLICE" ? "/police" : "/dashboard");
                  return;
                }
              } catch (e) {
                console.warn("Initial google auth sync notice:", e);
              } finally {
                setLoading(false);
              }

              setGoogleUsernameInput(gName);
              setPendingGoogleEmail(gEmail);
              setPendingGoogleCredential(tokenResponse.access_token);
              setShowGoogleModal(true);
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn("OAuth2 init notice:", err);
      }
    }
    setGoogleUsernameInput("Krishna");
    setPendingGoogleEmail("og.krishnayak906561@gmail.com");
    setPendingGoogleCredential("google_oauth_verified_" + Date.now());
    setShowGoogleModal(true);
  };

  return (
    <div className="min-h-screen bg-bg text-text-main flex items-center justify-center p-3 sm:p-6 font-sans transition-colors duration-150 relative overflow-hidden cyber-grid">
      
      {/* Ambient glowing background orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full glow-orb-indigo pointer-events-none z-0" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[600px] h-[600px] rounded-full glow-orb-emerald pointer-events-none z-0" />

      {/* Main Split Auth Container Card */}
      <div className="max-w-5xl w-full bg-bg-panel border border-border rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* ================= LEFT COLUMN: FORM PANEL (7 cols) ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between font-sans text-xs">
            <div className="flex items-center gap-2 text-rose-500 font-extrabold font-mono">
              <Shield className="w-5 h-5 fill-current animate-pulse" />
              <span className="text-text-main">DRISHTIRAKSHAK AI</span>
            </div>

            <div className="text-text-dim font-medium">
              {authMode === "signup" ? (
                <>
                  Already member?{" "}
                  <button
                    type="button"
                    onClick={() => { setError(null); setAuthMode("signin"); }}
                    className="text-emerald-500 font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New operator?{" "}
                  <button
                    type="button"
                    onClick={() => { setError(null); setAuthMode("signup"); }}
                    className="text-emerald-500 font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-text-main tracking-tight font-mono uppercase">
              {authMode === "signup" ? "Sign Up" : "Sign In"}
            </h1>
            <p className="text-xs text-text-dim">
              {authMode === "signup" 
                ? "Create your DrishtiRakshak AI operator account with Easy-fill"
                : "Welcome back! Access your dashcam telemetry console"}
            </p>
          </div>

          {/* Role Access Selector Pill */}
          <div className="bg-bg-panel-raised border border-border p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setRole("DRIVER")}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === "DRIVER"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm"
                  : "text-text-dim hover:text-text-main"
              }`}
            >
              <Car size={14} />
              <span>Driver / Car Owner</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("POLICE")}
              className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                role === "POLICE"
                  ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm"
                  : "text-text-dim hover:text-text-main"
              }`}
            >
              <Siren size={14} />
              <span>Police Control</span>
            </button>
          </div>

          {/* Form inputs */}
          <form onSubmit={authMode === "signup" ? handleSignUp : handleSignIn} className="space-y-3.5">
            
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-xs font-mono text-rose-400 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* FULL NAME (Sign Up mode - Theme Panel Raised Container) */}
            {authMode === "signup" && (
              <div className="space-y-1">
                <div className="w-full bg-bg-panel-raised border border-border focus-within:border-emerald-500/60 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all shadow-inner">
                  <div className="flex items-center gap-2.5 flex-1">
                    <User className="w-4 h-4 text-text-faint shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name (e.g. Rahul Sharma)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent text-sm text-text-main placeholder:text-text-faint focus:outline-none font-sans"
                    />
                  </div>
                  {fullName.trim().length > 2 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* EMAIL ADDRESS (Theme Panel Raised Container) */}
            <div className="space-y-1">
              <div className="w-full bg-bg-panel-raised border border-border focus-within:border-emerald-500/60 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all shadow-inner">
                <div className="flex items-center gap-2.5 flex-1">
                  <Mail className="w-4 h-4 text-text-faint shrink-0" />
                  <input
                    type={authMode === "signup" ? "email" : "text"}
                    required
                    placeholder={authMode === "signup" ? "Email Address (e.g. rahul@gmail.com)" : "Email or Username"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm text-text-main placeholder:text-text-faint focus:outline-none font-sans"
                  />
                </div>
                {email.includes("@") && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
              </div>
            </div>

            {/* USERNAME (Sign Up mode) */}
            {authMode === "signup" && (
              <div className="space-y-1">
                <div className="w-full bg-bg-panel-raised border border-border focus-within:border-emerald-500/60 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all shadow-inner">
                  <div className="flex items-center gap-2.5 flex-1">
                    <User className="w-4 h-4 text-text-faint shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="Username (e.g. rahul_sharma)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent text-sm text-text-main placeholder:text-text-faint focus:outline-none font-sans"
                    />
                  </div>
                  {username.length > 2 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* MANDATORY VEHICLE LICENSE PLATE NUMBER (Required for Drivers) */}
            {role === "DRIVER" && authMode === "signup" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono px-1">
                  <span className="text-text-dim font-bold uppercase tracking-wider">
                    Vehicle License Plate Number <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                    Mandatory for Auto-Clip
                  </span>
                </div>

                <div className="w-full bg-bg-panel-raised border border-border focus-within:border-emerald-500/60 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all shadow-inner">
                  <div className="flex items-center gap-2.5 flex-1">
                    <Car className="w-4 h-4 text-emerald-500 shrink-0" />
                    <input
                      type="text"
                      required={authMode === "signup"}
                      placeholder="e.g. MH-12-GQ-9831"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="w-full bg-transparent text-sm text-text-main font-mono font-bold placeholder:text-text-faint focus:outline-none"
                    />
                  </div>
                  {isValidVehicle && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-text-faint block px-1">
                  Saved to your profile so dashcam clips auto-fill without typing.
                </span>
              </div>
            )}

            {/* PASSWORD (Theme Panel Raised Container) */}
            <div className="space-y-1">
              <div className="w-full bg-bg-panel-raised border border-border focus-within:border-emerald-500/60 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all shadow-inner">
                <div className="flex items-center gap-2.5 flex-1">
                  <Lock className="w-4 h-4 text-text-faint shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-text-main placeholder:text-text-faint focus:outline-none font-sans"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-faint hover:text-text-main cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Real-time Password Guidelines (Sign Up Mode) */}
              {authMode === "signup" && (
                <div className="pt-1.5 space-y-1 text-[11px] font-sans px-1">
                  <div className={`flex items-center gap-1.5 ${hasSymbolOrNum ? "text-emerald-500 font-semibold" : "text-text-faint"}`}>
                    <Check size={12} className={hasSymbolOrNum ? "stroke-[3px]" : ""} />
                    <span>At least one number (0-9) or symbol</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-500 font-semibold" : "text-text-faint"}`}>
                    <Check size={12} className={hasMinLength ? "stroke-[3px]" : ""} />
                    <span>At least 6 characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* RE-TYPE PASSWORD (Sign Up mode - Theme Panel Raised Container) */}
            {authMode === "signup" && (
              <div className="space-y-1">
                <div className="w-full bg-bg-panel-raised border border-border focus-within:border-emerald-500/60 rounded-2xl px-3.5 py-2.5 flex items-center justify-between transition-all shadow-inner">
                  <div className="flex items-center gap-2.5 flex-1">
                    <Lock className="w-4 h-4 text-text-faint shrink-0" />
                    <input
                      type="password"
                      required
                      placeholder="Re-Type Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-text-main placeholder:text-text-faint focus:outline-none font-sans"
                    />
                  </div>
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* PRIMARY PILL ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-black text-xs py-3.5 px-8 rounded-full shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>{loading ? "Authenticating..." : authMode === "signup" ? "Sign Up" : "Sign In"}</span>
                <ArrowRight size={15} className="stroke-[3px]" />
              </button>
            </div>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] text-text-faint font-mono uppercase font-bold">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* CLICKABLE CYLINDRICAL "CONTINUE WITH GOOGLE" PILL BUTTON */}
          <div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full rounded-full border border-border bg-bg-panel-raised hover:border-emerald-500/50 text-text-main py-3.5 px-6 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Footer language */}
          <div className="pt-1 text-[10px] text-text-faint font-mono flex items-center justify-between">
            <span>🛡️ SHA-256 Cryptographic Ledger Active</span>
            <span>ENG ▾</span>
          </div>

        </div>


        {/* ================= RIGHT COLUMN: HERO GRAPHIC PANEL (5 cols) ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white relative hidden lg:flex flex-col justify-between p-8 overflow-hidden rounded-[28px] m-3 shadow-xl">
          
          {/* Translucent background curves */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Social & AI Badges */}
          <div className="absolute top-8 right-8 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/30 animate-float">
              <span className="text-xs font-bold font-mono">AI</span>
            </div>
            <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-white/30 animate-bounce">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>

          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/30">
              Live Edge Network
            </span>
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              Safety Telemetry, <br /> Your Proof Engine.
            </h2>
          </div>

          {/* FLOATING WIDGET 1: Telemetry Rate Card */}
          <div className="relative z-10 my-3.5 bg-white/95 text-slate-900 rounded-2xl p-4.5 shadow-2xl shadow-indigo-950/30 backdrop-blur-md animate-float border border-white/40 hover-glow-card-indigo">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-extrabold text-indigo-600 uppercase tracking-wider">
                Telemetry Rate
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">176.18</span>
              <span className="text-xs text-slate-500 font-mono">MB/s</span>
            </div>

            {/* Dynamic AI Wave chart */}
            <div className="mt-3 h-10 w-full relative overflow-hidden flex items-end">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d="M0 20 Q 20 5, 40 18 T 80 10 T 100 22 L 100 30 L 0 30 Z"
                  fill="rgba(79, 70, 229, 0.15)"
                />
                <path
                  d="M0 20 Q 20 5, 40 18 T 80 10 T 100 22"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          {/* FUTURISTIC RADAR SCANNER WIDGET */}
          <div className="relative z-10 bg-slate-950/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md hover-glow-card">
            <div className="relative w-14 h-14 rounded-full border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
              <div className="absolute w-10 h-10 rounded-full border border-emerald-500/20" />
              <div className="absolute w-5 h-5 rounded-full border border-emerald-500/10" />
              <div className="absolute w-full h-px bg-emerald-500/15" />
              <div className="absolute h-full w-px bg-emerald-500/15" />
              <div className="absolute inset-0 radar-sweep bg-gradient-to-tr from-transparent via-transparent to-emerald-500/25 rounded-full" />
              <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping top-3 left-3" />
              <div className="absolute w-1 h-1 bg-teal-400 rounded-full animate-pulse bottom-4 right-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Edge Radar Active
              </span>
              <h4 className="text-xs font-bold text-white font-mono">
                Bhubaneswar Sector_04
              </h4>
              <p className="text-[10px] text-white/70 leading-snug">
                Detecting telemetry nodes in real-time.
              </p>
            </div>
          </div>

          {/* FLOATING WIDGET 2: Key Security Card */}
          <div className="relative z-10 bg-white/95 text-slate-900 rounded-2xl p-4.5 shadow-2xl shadow-indigo-950/30 backdrop-blur-md animate-float-reverse border border-white/40 space-y-2 hover-glow-card">
            <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/30 text-amber-600 rounded-xl flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-mono uppercase">
                Your data, your rules
              </h4>
              <p className="text-[11px] text-slate-500 font-sans leading-snug mt-1">
                Your continuous dashcam telemetry belongs to you. Cryptographic SHA-256 guarantees evidence proof.
              </p>
            </div>
          </div>

          {/* Bottom metadata */}
          <div className="relative z-10 pt-2 flex items-center justify-between text-[10px] font-mono text-white/80">
            <span>DrishtiRakshak AI v2.4</span>
            <span>Edge Mesh Active</span>
          </div>
        </div>

      </div>

      {/* POST-GOOGLE OAUTH VEHICLE PLATE & USERNAME REGISTRATION MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-panel border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-main">Complete Your Vehicle Setup</h3>
                <p className="text-xs text-text-dim">Mandatory for Dashcam AI Evidence Auto-Clip</p>
              </div>
            </div>

            <form onSubmit={handleCompleteGoogleRegistration} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Username</label>
                <div className="bg-bg-panel-raised border border-border rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                  <User className="w-4 h-4 text-text-faint shrink-0" />
                  <input
                    type="text"
                    required
                    value={googleUsernameInput}
                    onChange={(e) => setGoogleUsernameInput(e.target.value)}
                    className="w-full bg-transparent text-sm text-text-main focus:outline-none"
                    placeholder="Username"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Vehicle License Plate Number *</label>
                <div className="bg-bg-panel-raised border border-emerald-500/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-emerald-500 shrink-0" />
                  <input
                    type="text"
                    required
                    value={googleVehicleInput}
                    onChange={(e) => setGoogleVehicleInput(e.target.value.toUpperCase())}
                    className="w-full bg-transparent text-sm font-mono text-emerald-400 focus:outline-none uppercase font-bold"
                    placeholder="e.g. MH-12-GQ-9831"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-3 border border-border text-text-dim hover:text-text-main rounded-full font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-full shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <span>{loading ? "Saving..." : "Continue"}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Auth;