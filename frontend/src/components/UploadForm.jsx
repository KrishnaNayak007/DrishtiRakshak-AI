import { useEffect, useState } from "react";
import { api } from "../api";

export default function UploadForm({ onDone }) {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | uploading | processing | error
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listVehicles().then((list) => {
      setVehicles(list);
      if (list.length > 0) setVehicleId(list[0].id);
    }).catch((e) => setError(e.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId || !file) return;

    setError(null);
    try {
      setStage("uploading");
      const evidence = await api.uploadEvidence(vehicleId, file);

      setStage("processing");
      await api.processEvidence(evidence.id);

      setStage("idle");
      setFile(null);
      e.target.reset();
      onDone?.(evidence.id);
    } catch (err) {
      setError(err.message);
      setStage("error");
    }
  };

  if (vehicles.length === 0 && !error) {
    return (
      <div className="upload-form">
        <div className="empty-state">
          No vehicles registered yet. Create one in{" "}
          <a href="http://127.0.0.1:8000/admin/vehicles/vehicle/add/" target="_blank" rel="noreferrer">
            Django admin
          </a>{" "}
          first, then refresh this page.
        </div>
      </div>
    );
  }

  const busy = stage === "uploading" || stage === "processing";

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="section-label">Upload Evidence</div>

      <select
        className="select"
        value={vehicleId}
        onChange={(e) => setVehicleId(e.target.value)}
        disabled={busy}
      >
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nickname || v.registration_number}
          </option>
        ))}
      </select>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
        disabled={busy}
      />

      <button className="btn" type="submit" disabled={!file || busy}>
        {stage === "uploading" && "Uploading…"}
        {stage === "processing" && "Running detection…"}
        {(stage === "idle" || stage === "error") && "Upload & Process"}
      </button>

      {error && <div className="upload-error">{error}</div>}
    </form>
  );
}