import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { EvidenceConsole } from './pages/EvidenceConsole';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="placeholder font-mono text-xs">Verifying platform session...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Gateway redirects to Dashboard Console */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;