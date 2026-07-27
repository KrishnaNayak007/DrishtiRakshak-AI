const API_BASE = "http://127.0.0.1:8000/api";

// Local storage abstractions for JWT credentials
export const tokenStorage = {
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

// In-flight refresh promise to prevent concurrent request race conditions
let refreshPromise = null;

async function request(path, options = {}) {
  const headers = { ...options.headers };
  
  // Attach the authorization header unless requesting token operations
  const token = tokenStorage.getAccess();
  if (token && !path.startsWith("/token/")) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle object-to-JSON formatting automatically
  if (options.body && !(options.body instanceof FormData) && typeof options.body === "object") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Handle Token Expiration (401 Unauthorized)
  if (res.status === 401 && !path.startsWith("/token/")) {
    const refresh = tokenStorage.getRefresh();
    if (!refresh) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth_logout"));
      throw new Error("Session expired. Please log in again.");
    }

    try {
      // Deduplicate overlapping refresh requests
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

      // Persist the newly rotated access token
      tokenStorage.set(tokens.access, tokens.refresh);

      // Re-attempt original request with the fresh Access Token
      headers["Authorization"] = `Bearer ${tokens.access}`;
      const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!retryRes.ok) {
        const body = await retryRes.text();
        throw new Error(`${retryRes.status} ${retryRes.statusText}: ${body}`);
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
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Authentication Actions
  login: async (username, password) => {
    const data = await request("/token/", {
      method: "POST",
      body: { username, password },
    });
    tokenStorage.set(data.access, data.refresh);
    return data;
  },
  logout: () => {
    tokenStorage.clear();
    window.dispatchEvent(new Event("auth_logout"));
  },

  // Operational APIs mapping to backend versioned URLs
  listEvidence: () => request("/v1/evidence/"),
  getEvidence: (id) => request(`/v1/evidence/${id}/`),
  processEvidence: (id) => request(`/v1/evidence/${id}/process/`, { method: "POST" }),
  uploadEvidence: (vehicleId, file) => {
    const form = new FormData();
    form.append("vehicle", vehicleId);
    form.append("video_file", file);
    return request("/v1/evidence/", { method: "POST", body: form });
  },
  listVehicles: () => request("/v1/vehicles/"),
};
