const API_BASE: string = "/api";

export interface TokenStorage {
  getAccess: () => string | null;
  getRefresh: () => string | null;
  set: (access: string, refresh?: string) => void;
  clear: () => void;
}

export const tokenStorage: TokenStorage = {
  getAccess: () => localStorage.getItem("dr_access"),
  getRefresh: () => localStorage.getItem("dr_refresh"),
  set: (access, refresh) => {
    localStorage.setItem("dr_access", access);
    if (refresh) localStorage.setItem("dr_refresh", refresh);
  },
  clear: () => {
    localStorage.removeItem("dr_access");
    localStorage.removeItem("dr_refresh");
  },
};

let refreshPromise: Promise<any> | null = null;

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  
  const token = tokenStorage.getAccess();
  if (!token && !path.startsWith("/token/") && !path.startsWith("/auth/")) {
    return Array.isArray(options.body) || path.endsWith("/") ? [] : null;
  }

  if (token && !path.startsWith("/token/")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, body });

  if (res.status === 401) {
    if (path.startsWith("/token/")) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth_logout"));
      throw new Error("Authentication failed. Please log in.");
    }

    const refresh = tokenStorage.getRefresh();
    if (!refresh) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth_logout"));
      throw new Error("Session expired. Please log in again.");
    }

    try {
      if (!refreshPromise) {
        refreshPromise = fetch(`${API_BASE}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        }).then(async (r) => {
          if (!r.ok) throw new Error("Refresh token expired or invalid");
          return r.json();
        });
      }

      const tokens = await refreshPromise;
      refreshPromise = null;

      tokenStorage.set(tokens.access, tokens.refresh);

      headers["Authorization"] = `Bearer ${tokens.access}`;
      const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers, body });
      if (!retryRes.ok) {
        tokenStorage.clear();
        window.dispatchEvent(new Event("auth_logout"));
        return null;
      }
      return retryRes.status === 204 ? null : retryRes.json();
    } catch {
      refreshPromise = null;
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth_logout"));
      return null;
    }
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${errBody}`);
  }
  return res.status === 204 ? null : res.json();
}

export interface PoliceDispatch {
  id: string;
  dispatch_number: string;
  vehicle_plate: string;
  driver_name: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  threat_type: "STAGED_COLLISION_FRAUD" | "ROADBLOCK_ROBBERY_THREAT" | "SUDDEN_DECELERATION_SPIKE";
  threat_category_label: string;
  risk_score: number;
  status: "CRITICAL_SOS" | "DISPATCHED" | "CASE_SOLVED";
  resolved_at?: string;
  resolved_by?: string;
  video_file?: string;
  sha256_hash: string;
  ai_summary: string;
}

const DEFAULT_POLICE_DISPATCHES: PoliceDispatch[] = [
  {
    id: "sos-101",
    dispatch_number: "PCR-2026-9041",
    vehicle_plate: localStorage.getItem("dr_default_vehicle") || "MH-12-GQ-9831",
    driver_name: "Rahul Sharma (Driver)",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    location: {
      lat: 20.2960,
      lng: 85.8245,
      address: "NH-16 Highway, Km 42 (Bhubaneswar-Cuttack Corridor)",
    },
    threat_type: "STAGED_COLLISION_FRAUD",
    threat_category_label: "Intentional Pedestrian Obstruction (Staged Accident / Insurance Fraud)",
    risk_score: 96,
    status: "CRITICAL_SOS",
    sha256_hash: "a4f891b72e09c84132456d9812ef490c2317b",
    ai_summary: "AI Continuous Stream Engine detected a pedestrian intentionally stepping into the vehicle path at 45 km/h. Live video snippet auto-clipped and cryptographic hash secured.",
  },
  {
    id: "sos-102",
    dispatch_number: "PCR-2026-8812",
    vehicle_plate: "DL-3CAS-4903",
    driver_name: "Anita Verma (Driver)",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    location: {
      lat: 20.2905,
      lng: 85.8301,
      address: "Outer Ring Road Junction 4 (Puri Bypass)",
    },
    threat_type: "ROADBLOCK_ROBBERY_THREAT",
    threat_category_label: "Roadblock Obstruction / Robbery Attempt",
    risk_score: 92,
    status: "DISPATCHED",
    sha256_hash: "f7b190342a981c2d049811e598a912c98231a",
    ai_summary: "Sustained proximity of 2 motorcycles blocking path following sudden deceleration. Emergency beacon dispatched to Patrol Unit #04.",
  },
  {
    id: "sos-103",
    dispatch_number: "PCR-2026-7023",
    vehicle_plate: "KA-01-MJ-2091",
    driver_name: "Vikram Das (Driver)",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    location: {
      lat: 20.3012,
      lng: 85.8190,
      address: "Infocity Main Gate, Sector 5",
    },
    threat_type: "SUDDEN_DECELERATION_SPIKE",
    threat_category_label: "Sudden EmergencyDeceleration Spike",
    risk_score: 78,
    status: "CASE_SOLVED",
    resolved_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    resolved_by: "Inspector S. Patnaik (Traffic Cyber Cell)",
    sha256_hash: "e34091a782b109c91823ef4510b91a2739810",
    ai_summary: "Deceleration spike verified as stray animal crossing. Driver confirmed safe; case marked solved after on-site verification.",
  }
];

export const api = {
  login: async (username: string, password: string): Promise<any> => {
    const data = await request("/token/", {
      method: "POST",
      body: { username, password } as any,
    });
    tokenStorage.set(data.access, data.refresh);
    return data;
  },
  signup: async (payload: any): Promise<any> => {
    const data = await request("/v1/auth/register/", {
      method: "POST",
      body: payload as any,
    });
    if (data && data.access) {
      tokenStorage.set(data.access, data.refresh);
    }
    return data;
  },
  googleAuth: async (idToken: string | null, role: string = "DRIVER", vehicleNumber?: string, username?: string): Promise<any> => {
    const data = await request("/v1/auth/google/", {
      method: "POST",
      body: { id_token: idToken, role, vehicleNumber, username } as any,
    });
    if (data && data.access) {
      tokenStorage.set(data.access, data.refresh);
    }
    return data;
  },
  logout: (): void => {
    tokenStorage.clear();
    window.dispatchEvent(new Event("auth_logout"));
  },
  listEvidence: async (): Promise<any[]> => {
    if (!tokenStorage.getAccess()) return [];
    try {
      return await request("/v1/evidence/");
    } catch {
      return [];
    }
  },
  getEvidence: (id: string): Promise<any> => request(`/v1/evidence/${id}/`),
  processEvidence: (id: string): Promise<any> => request(`/v1/evidence/${id}/process/`, { method: "POST" }),
  uploadEvidence: (vehicleId: string, file: File): Promise<any> => {
    const form = new FormData();
    form.append("vehicle", vehicleId);
    form.append("video_file", file);
    return request("/v1/evidence/", { method: "POST", body: form });
  },
  listVehicles: (): Promise<any[]> => request("/v1/vehicles/"),
  updateIncident: (id: string, data: { status?: string; analyst_notes?: string }): Promise<any> =>
    request(`/v1/incidents/${id}/`, { method: "PATCH", body: data as any }),
  searchEvidence: (query: string): Promise<any[]> => request("/v1/evidence/search/", {
    method: "POST",
    body: { query } as any
  }),
  deleteEvidence: (id: string): Promise<any> => request(`/v1/evidence/${id}/`, { method: "DELETE" }),

  // POLICE DISPATCH & CASE RESOLUTION API METHODS
  listPoliceDispatches: async (): Promise<PoliceDispatch[]> => {
    try {
      const serverData = await request("/v1/police/dispatches/").catch(() => null);
      if (serverData && Array.isArray(serverData)) return serverData;
    } catch {
      // Fallback
    }
    const local = localStorage.getItem("dr_police_dispatches");
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // Fallback
      }
    }
    localStorage.setItem("dr_police_dispatches", JSON.stringify(DEFAULT_POLICE_DISPATCHES));
    return DEFAULT_POLICE_DISPATCHES;
  },

  markCaseSolved: async (dispatchId: string, notes?: string): Promise<PoliceDispatch> => {
    try {
      const serverRes = await request(`/v1/police/dispatches/${dispatchId}/solve/`, {
        method: "POST",
        body: { notes } as any,
      }).catch(() => null);
      if (serverRes) return serverRes;
    } catch {
      // Fallback
    }

    const current = await api.listPoliceDispatches();
    const updated = current.map((item) => {
      if (item.id === dispatchId) {
        return {
          ...item,
          status: "CASE_SOLVED" as const,
          resolved_at: new Date().toISOString(),
          resolved_by: "Inspector S. Patnaik (Police Dispatch Unit #04)",
        };
      }
      return item;
    });

    localStorage.setItem("dr_police_dispatches", JSON.stringify(updated));
    const target = updated.find((i) => i.id === dispatchId)!;
    return target;
  },

  simulateEmergencySOS: async (vehicleId?: string): Promise<PoliceDispatch> => {
    const assignedPlate = vehicleId || localStorage.getItem("dr_default_vehicle") || "MH-12-GQ-9831";
    const newDispatch: PoliceDispatch = {
      id: `sos-${Date.now()}`,
      dispatch_number: `PCR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicle_plate: assignedPlate,
      driver_name: "Active Operator (You)",
      timestamp: new Date().toISOString(),
      location: {
        lat: 20.2960 + (Math.random() - 0.5) * 0.01,
        lng: 85.8245 + (Math.random() - 0.5) * 0.01,
        address: "NH-16 Expressway, Near Smart City Toll Gate",
      },
      threat_type: "STAGED_COLLISION_FRAUD",
      threat_category_label: "Intentional Pedestrian Obstruction (Staged Accident / Insurance Fraud)",
      risk_score: 98,
      status: "CRITICAL_SOS",
      sha256_hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      ai_summary: `Continuous dashcam stream clipped 12s video segment during sudden deceleration at 54 km/h. Intentional pedestrian obstacle detected in vehicle path. Auto-pushed to Police Portal.`,
    };

    const current = await api.listPoliceDispatches();
    const updated = [newDispatch, ...current];
    localStorage.setItem("dr_police_dispatches", JSON.stringify(updated));

    // Try server notify if connected
    request("/v1/police/dispatches/trigger/", { method: "POST", body: newDispatch as any }).catch(() => {});

    return newDispatch;
  }
};