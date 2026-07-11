const API_BASE = "http://127.0.0.1:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  listEvidence: () => request("/evidence/"),
  getEvidence: (id) => request(`/evidence/${id}/`),
  processEvidence: (id) => request(`/evidence/${id}/process/`, { method: "POST" }),
  uploadEvidence: (vehicleId, file) => {
    const form = new FormData();
    form.append("vehicle", vehicleId);
    form.append("video_file", file);
    return request("/evidence/", { method: "POST", body: form });
  },
  listVehicles: () => request("/vehicles/"),
};
