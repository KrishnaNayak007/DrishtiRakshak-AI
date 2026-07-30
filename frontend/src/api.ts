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
  if (token && !path.startsWith("/token/")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, body });

  if (res.status === 401 && !path.startsWith("/token/")) {
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
        const errBody = await retryRes.text();
        throw new Error(`${retryRes.status} ${retryRes.statusText}: ${errBody}`);
      }
      return retryRes.status === 204 ? null : retryRes.json();
    } catch (err) {
      refreshPromise = null;
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth_logout"));
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${errBody}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  login: async (username: string, password: string): Promise<any> => {
    const data = await request("/token/", {
      method: "POST",
      body: { username, password } as any,
    });
    tokenStorage.set(data.access, data.refresh);
    return data;
  },
  logout: (): void => {
    tokenStorage.clear();
    window.dispatchEvent(new Event("auth_logout"));
  },
  listEvidence: (): Promise<any[]> => request("/v1/evidence/"),
  getEvidence: (id: string): Promise<any> => request(`/v1/evidence/${id}/`),
  processEvidence: (id: string): Promise<any> => request(`/v1/evidence/${id}/process/`, { method: "POST" }),
  uploadEvidence: (vehicleId: string, file: File): Promise<any> => {
    const form = new FormData();
    form.append("vehicle", vehicleId);
    form.append("video_file", file);
    return request("/v1/evidence/", { method: "POST", body: form });
  },
  listVehicles: (): Promise<any[]> => request("/v1/vehicles/"),
  searchEvidence: (query: string): Promise<any[]> => request("/v1/evidence/search/", {
    method: "POST",
    body: { query } as any
  }),
};