import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from "../api";

interface TimelineEvent {
  id: string;
  timestamp: number;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

interface Evidence {
  id: string;
  vehicle: string;
  video_file: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary: string;
  events: TimelineEvent[];
  created_at?: string;
}

export const EvidenceConsole: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lists and loading states
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Added for detail pane transition feedback
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Form Inputs
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch initial collections
  const loadResources = async () => {
    try {
      const [evidenceData, vehicleData] = await Promise.all([
        api.listEvidence(),
        api.listVehicles().catch(() => [])
      ]);
      const resolvedEvidence = Array.isArray(evidenceData) 
        ? evidenceData 
        : (evidenceData?.results || []);

      const resolvedVehicles = Array.isArray(vehicleData) 
        ? vehicleData 
        : (vehicleData?.results || []);

      setEvidenceList(resolvedEvidence);
      setVehicles(resolvedVehicles);
    } catch (err) {
      // Offline fallback placeholders matching CSS schema
      const fallbackList: Evidence[] = [
        {
          id: '2093',
          vehicle: 'DL-3CAS-4903',
          video_file: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          status: 'COMPLETED',
          summary: '### AI Narrative\n- Velocity fluctuation observed.\n- Hazard vector resolution successful.',
          events: [
            { id: '1', timestamp: 2.5, label: 'Proximity Anomaly', severity: 'medium' },
            { id: '2', timestamp: 5.0, label: 'Deceleration Event', severity: 'high' }
          ]
        },
        {
          id: '1284',
          vehicle: 'MH-12RT-8219',
          video_file: '',
          status: 'PENDING',
          summary: '',
          events: []
        }
      ];
      setEvidenceList(fallbackList);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // Sync active detail element only when URL sub-route changes
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      // Fetch detailed view directly to ensure summary & events parameters are retrieved
      api.getEvidence(id)
        .then((detailedData) => {
          setActiveEvidence(detailedData);
        })
        .catch(() => {
          // Fallback to local memory list lookup if unreachable
          const matched = evidenceList.find(item => item.id === id);
          if (matched) setActiveEvidence(matched);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setActiveEvidence(null);
    }
  }, [id]); // Stopping list-refresh rewrites

  // Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedFile) {
      setUploadError('Select vehicle and file payload.');
      return;
    }
    setIsUploading(true);
    setUploadError('');
    try {
      await api.uploadEvidence(selectedVehicle, selectedFile);
      setSelectedFile(null);
      loadResources();
    } catch (err: any) {
      setUploadError(err.message || 'Transmission pipeline error.');
    } finally {
      setIsUploading(false);
    }
  };

  // Timeline jump trigger
  const handleMarkerJump = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  };

  // AI Pipeline run
  const runAIEngine = async () => {
    if (!activeEvidence) return;
    setIsProcessing(true);
    try {
      // 1. Invoke pipeline
      await api.processEvidence(activeEvidence.id);

      // 2. Instantly fetch rich summary details from database
      const updatedDetail = await api.getEvidence(activeEvidence.id);
      setActiveEvidence(updatedDetail);

      // 3. Silent refresh of background sidebar list
      api.listEvidence().then(res => {
        const resolved = Array.isArray(res) ? res : (res?.results || []);
        setEvidenceList(resolved);
      }).catch(() => {});
    } catch (err) {
      console.warn('AI pipeline invocation timed out.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      {/* App Header */}
      <header className="app-header">
        <h1>DrishtiRakshak AI</h1>
        <span className="subtitle">CONNECTED VEHICLE SECURITY TERMINAL</span>
      </header>

      {/* Main Grid Division */}
      <div className="app-body">
        {/* Left Hand Sidebar Frame */}
        <aside className="sidebar">
          {/* Upload Form Area */}
          <form onSubmit={handleUploadSubmit} className="upload-form">
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="select"
            >
              <option value="">-- Choose fleet registration --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.vehicle_id || v.id}>{v.vehicle_id || v.id}</option>
              ))}
              {vehicles.length === 0 && (
                <>
                  <option value="DL-3CAS-4903">DL-3CAS-4903</option>
                  <option value="MH-12RT-8219">MH-12RT-8219</option>
                </>
              )}
            </select>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            {uploadError && <span className="upload-error">{uploadError}</span>}
            <button type="submit" className="btn" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Clip'}
            </button>
          </form>

          {/* Scrollable Evidence Grid Rows */}
          <div className="evidence-list">
            {evidenceList.length === 0 ? (
              <div className="empty-state">No clips found in database vault.</div>
            ) : (
              evidenceList.map((item) => {
                const highestSeverity = item.events?.some(e => e.severity === 'high') ? 'high' : 'low';
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/dashboard/evidence/${item.id}`)}
                    className={`evidence-row ${activeEvidence?.id === item.id ? 'active' : ''}`}
                  >
                    <div className="row-top">
                      <span className="veh">{item.vehicle}</span>
                      <span 
                        className="risk-chip"
                        style={{ 
                          background: highestSeverity === 'high' ? 'var(--risk-high)' : 'var(--risk-none)' 
                        }}
                      >
                        {highestSeverity === 'high' ? 'ALERT' : 'NORMAL'}
                      </span>
                    </div>
                    <div className="meta">CLIP #{item.id} • {item.status}</div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Hand Detail Assessment Pane */}
        <main className="detail-pane">
          {isLoading ? (
            <div className="placeholder">Syncing detailed telemetry logs...</div>
          ) : activeEvidence ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600 }}>Inspection Node: {activeEvidence.vehicle}</h2>
                <div className="evidence-hash">Stream Index Key: {activeEvidence.id}</div>
              </div>

              {activeEvidence.video_file ? (
                <div>
                  <video ref={videoRef} src={activeEvidence.video_file} controls />
                  
                  {/* Timeline Track with absolute placed Marker nodes */}
                  <div className="timeline-track">
                    {activeEvidence.events?.map((ev) => {
                      const posPercent = (ev.timestamp / 10) * 100; // Scaled to hypothetical 10s clip length
                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleMarkerJump(ev.timestamp)}
                          className="timeline-marker"
                          data-label={`${ev.label} (${ev.timestamp}s)`}
                          style={{
                            left: `${Math.min(posPercent, 98)}%`,
                            background: ev.severity === 'high' ? 'var(--risk-high)' : 'var(--risk-mid)'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="placeholder" style={{ paddingTop: '40px' }}>
                  No video associated with this pending upload.
                </div>
              )}

              <div className="section-label">Pipeline Action</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={runAIEngine} 
                  disabled={isProcessing || activeEvidence.status === 'PROCESSING'} 
                  className="btn"
                >
                  {isProcessing ? 'Running AI Extraction...' : 'Trigger AI Pipeline'}
                </button>
                <span className="locked-badge">Status: {activeEvidence.status}</span>
              </div>

              {activeEvidence.summary && (
                <>
                  <div className="section-label">Narrative Summary Extract</div>
                  <pre className="summary-box">{activeEvidence.summary}</pre>
                </>
              )}
            </div>
          ) : (
            <div className="placeholder">
              Select an evidence clip from the left pane to analyze telemetry.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};