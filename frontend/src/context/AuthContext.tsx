import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, tokenStorage } from '../api'; // Correct root import path

export interface User {
  username: string;
  organization: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth_logout', handleLogoutEvent);

    const checkSession = async () => {
      const accessToken = tokenStorage.getAccess();
      if (accessToken) {
        setUser({
          username: 'System Admin',
          organization: 'Drishti Rakshak Hub',
        });
      }
      setIsLoading(false);
    };

    checkSession();
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, []);

  const loginUser = async (username: string, password: string): Promise<void> => {
    await api.login(username, password);
    setUser({
      username,
      organization: 'Drishti Rakshak Hub',
    });
  };

  const logoutUser = (): void => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login: loginUser, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};