import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api, tokenStorage } from "./api";
import EvidenceList from "./components/EvidenceList";
import EvidenceDetail from "./components/EvidenceDetail";
import UploadForm from "./components/UploadForm";
import "./styles.css";

// 1. Root Router with Global Auth Listener
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <EvidenceConsole />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// 2. Authentication Route Shield
function ProtectedRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      navigate("/login");
    };
    window.addEventListener("auth_logout", handleLogout);
    return () => window.removeEventListener("auth_logout", handleLogout);
  }, [navigate]);

  if (!tokenStorage.getAccess()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 3. Simple Login form component
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(username, password);
      navigate("/");
    } catch (err) {
      setError("Authentication failed. Please verify your username and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f5f6f8" }}>
      <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "380px", padding: "30px", background: "#ffffff", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginBottom: "10px", color: "#1a1f36" }}>DrishtiRakshak AI</h2>
        <p style={{ margin: "0 0 20px 0", color: "#697386", fontSize: "14px" }}>Sign in to access your secure evidence node</p>
        
        {error && <div style={{ color: "#df1b41", background: "#fbeae1", padding: "10px", borderRadius: "4px", fontSize: "14px", marginBottom: "15px" }}>{error}</div>}

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "5px", color: "#3c4257" }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d9d9d9", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "5px", color: "#3c4257" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d9d9d9", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "12px", background: "#212529", color: "#ffffff", border: "none", borderRadius: "4px", fontWeight: "600", cursor: "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

// 4. Refactored Evidence Console View
function EvidenceConsole() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const refresh = () => {
    api
      .listEvidence()
      .then(setItems)
      .catch((e) => setError(e.message));
  };

  const handleUploadDone = (newEvidenceId) => {
    refresh();
    setSelectedId(newEvidenceId);
  };

  const handleSignOut = () => {
    api.logout();
    navigate("/login");
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="app">
      <header className="app-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>DrishtiRakshak — Evidence Console</h1>
          <span className="subtitle">Node Control · Phase 1</span>
        </div>
        <button
          onClick={handleSignOut}
          style={{ padding: "8px 14px", border: "1px solid #ccc", borderRadius: "4px", background: "transparent", cursor: "pointer", fontWeight: "600" }}
        >
          Logout
        </button>
      </header>
      <div className="app-body">
        {error ? (
          <div className="empty-state">
            Could not reach the secure API endpoint. Please check connection.
            <br />
            {error}
          </div>
        ) : (
          <div className="sidebar">
            <UploadForm onDone={handleUploadDone} />
            <EvidenceList
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}
        <EvidenceDetail evidenceId={selectedId} onProcessed={refresh} />
      </div>
    </div>
  );
};