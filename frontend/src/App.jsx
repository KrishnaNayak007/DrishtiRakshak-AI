import { useEffect, useState } from "react";
import { api } from "./api";
import EvidenceList from "./components/EvidenceList";
import EvidenceDetail from "./components/EvidenceDetail";
import UploadForm from "./components/UploadForm";
import "./styles.css";

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>DrishtiRakshak — Evidence Console</h1>
        <span className="subtitle">prototype · Month 1</span>
      </header>
      <div className="app-body">
        {error ? (
          <div className="empty-state">
            Could not reach the API at http://127.0.0.1:8000. Is the Django
            server running?
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
}
