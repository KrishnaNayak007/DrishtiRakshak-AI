import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { EvidenceConsole } from './pages/EvidenceConsole';
import { PoliceConsole } from './pages/PoliceConsole';
import { Settings } from './pages/Settings';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen bg-bg text-text-dim p-6 font-mono text-xs flex items-center justify-center">Verifying platform session...</div>;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen bg-bg text-text-dim p-6 font-mono text-xs flex items-center justify-center">Verifying platform session...</div>;
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Gateway checks authentication before routing */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/auth" element={<Auth />} />

          {/* Core Master Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <EvidenceConsole />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/evidence/:id" 
            element={
              <PrivateRoute>
                <EvidenceConsole />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/police" 
            element={
              <PrivateRoute>
                <PoliceConsole />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/police" 
            element={
              <PrivateRoute>
                <PoliceConsole />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/settings" 
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;