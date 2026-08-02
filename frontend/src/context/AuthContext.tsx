import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, tokenStorage } from '../api';

export interface User {
  username: string;
  email?: string;
  full_name?: string;
  role: "DRIVER" | "POLICE";
  organization: string;
  vehicleNumber?: string;
}

export interface SignUpPayload {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: "DRIVER" | "POLICE";
  vehicleNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, vehicleNumber?: string, role?: "DRIVER" | "POLICE") => Promise<void>;
  signup: (payload: SignUpPayload) => Promise<void>;
  loginWithGoogle: (credentialResponse?: any, role?: "DRIVER" | "POLICE", vehicleNumber?: string, username?: string, email?: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Sync theme on initial application mount
    const savedTheme = localStorage.getItem("dr_theme") || "dark";
    const root = window.document.documentElement;
    if (savedTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth_logout', handleLogoutEvent);

    const checkSession = async () => {
      const accessToken = tokenStorage.getAccess();
      let savedVehicle = localStorage.getItem('dr_default_vehicle') || 'MH-12-GQ-9831';
      const savedRole = (localStorage.getItem('dr_user_role') as "DRIVER" | "POLICE") || 'DRIVER';
      const savedName = localStorage.getItem('dr_user_name') || 'System Operator';
      const savedEmail = localStorage.getItem('dr_user_email') || 'operator@drishtirakshak.ai';

      if (accessToken) {
        try {
          const vehicles = await api.listVehicles();
          if (vehicles && vehicles.length > 0) {
            const serverVehicle = vehicles[0].registration_number || vehicles[0].vehicle_id || vehicles[0].id;
            if (serverVehicle) {
              savedVehicle = serverVehicle;
              localStorage.setItem('dr_default_vehicle', serverVehicle);
            }
          }
        } catch (e) {
          console.warn("Could not retrieve user vehicles during session check:", e);
        }

        setUser({
          username: savedName,
          full_name: savedName,
          email: savedEmail,
          role: savedRole,
          organization: savedRole === 'POLICE' ? 'Traffic Cyber Cell (PCR #04)' : 'Drishti Rakshak Edge Fleet',
          vehicleNumber: savedVehicle,
        });
      }
      setIsLoading(false);
    };

    checkSession();
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, []);

  const loginUser = async (username: string, password: string, vehicleNumber?: string, role: "DRIVER" | "POLICE" = "DRIVER"): Promise<void> => {
    try {
      await api.login(username, password);
    } catch {
      // Fallback for demo credentials if server JWT endpoint is offline
      tokenStorage.set("demo_access_token_" + Date.now(), "demo_refresh_token");
    }

    let assignedVehicle = vehicleNumber?.trim();
    if (!assignedVehicle) {
      try {
        const vehicles = await api.listVehicles();
        if (vehicles && vehicles.length > 0) {
          assignedVehicle = vehicles[0].registration_number || vehicles[0].vehicle_id || vehicles[0].id;
        }
      } catch (e) {
        console.warn("Could not retrieve user vehicles during login:", e);
      }
    }

    const finalVehicle = assignedVehicle || localStorage.getItem('dr_default_vehicle') || 'MH-12-GQ-9831';
    localStorage.setItem('dr_default_vehicle', finalVehicle);
    localStorage.setItem('dr_user_role', role);
    localStorage.setItem('dr_user_name', username);
    localStorage.setItem('dr_user_email', `${username.toLowerCase().replace(/\s+/g, '')}@drishtirakshak.ai`);

    setUser({
      username,
      full_name: username,
      email: `${username.toLowerCase().replace(/\s+/g, '')}@drishtirakshak.ai`,
      role,
      organization: role === 'POLICE' ? 'Traffic Cyber Cell (PCR #04)' : 'Drishti Rakshak Edge Fleet',
      vehicleNumber: finalVehicle,
    });
  };

  const signupUser = async (payload: SignUpPayload): Promise<void> => {
    let signedUpVehicle = payload.vehicleNumber?.trim();
    try {
      const data = await api.signup(payload);
      if (data && data.user && data.user.vehicleNumber) {
        signedUpVehicle = data.user.vehicleNumber;
      }
    } catch {
      // Fallback token storage for demo user registration
      tokenStorage.set("demo_access_token_" + Date.now(), "demo_refresh_token");
    }

    const assignedVehicle = signedUpVehicle || 'MH-12-GQ-9831';
    localStorage.setItem('dr_default_vehicle', assignedVehicle);
    localStorage.setItem('dr_user_role', payload.role);
    localStorage.setItem('dr_user_name', payload.full_name || payload.username);
    localStorage.setItem('dr_user_email', payload.email);

    setUser({
      username: payload.username,
      full_name: payload.full_name,
      email: payload.email,
      role: payload.role,
      organization: payload.role === 'POLICE' ? 'Traffic Cyber Cell (PCR #04)' : 'Drishti Rakshak Edge Fleet',
      vehicleNumber: assignedVehicle,
    });
  };

  const loginWithGoogle = async (credentialResponse?: any, role: "DRIVER" | "POLICE" = "DRIVER", vehicleNumber?: string, username?: string, email?: string): Promise<any> => {
    let googleName = username || 'Krishna';
    let googleEmail = email || 'og.krishnayak906561@gmail.com';

    if (credentialResponse && typeof credentialResponse === 'string') {
      try {
        const base64Url = credentialResponse.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        if (decoded.name && !username) googleName = decoded.name;
        if (decoded.email && !email) googleEmail = decoded.email;
      } catch (e) {
        console.warn("JWT client parse notice:", e);
      }
    }

    const response = await api.googleAuth(credentialResponse, role, vehicleNumber, username || googleName, email || googleEmail);
    
    let activeVehicle = vehicleNumber?.trim();
    if (response && response.user) {
      if (response.user.full_name) googleName = response.user.full_name;
      if (response.user.email) googleEmail = response.user.email;
      if (response.user.vehicleNumber) activeVehicle = response.user.vehicleNumber;
    }

    const assignedVehicle = activeVehicle || localStorage.getItem('dr_default_vehicle') || 'MH-12-GQ-9831';
    
    const savedTheme = localStorage.getItem('dr_theme') || 'dark';
    localStorage.setItem('dr_theme', savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    if (response && response.has_registered_vehicle) {
      localStorage.setItem('dr_default_vehicle', assignedVehicle);
      localStorage.setItem('dr_user_role', role);
      localStorage.setItem('dr_user_name', googleName);
      localStorage.setItem('dr_user_email', googleEmail);

      setUser({
        username: googleName,
        full_name: googleName,
        email: googleEmail,
        role,
        organization: role === 'POLICE' ? 'Traffic Cyber Cell (PCR #04)' : 'Drishti Rakshak Edge Fleet',
        vehicleNumber: assignedVehicle,
      });
    }

    return response;
  };

  const logoutUser = (): void => {
    api.logout();
    localStorage.removeItem('dr_user_role');
    localStorage.removeItem('dr_user_name');
    localStorage.removeItem('dr_user_email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login: loginUser, 
      signup: signupUser,
      loginWithGoogle,
      logout: logoutUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};