import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Film, Plus, Play } from 'lucide-react';
import { UploadForm } from '../components/UploadForm';

interface EvidenceClip {
  id: string;
  vehicle: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at?: string;
}

export const EvidenceList: React.FC = () => {
  const navigate = useNavigate();
  const [evidenceList, setEvidenceList] = useState<EvidenceClip[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const [evidenceData, vehicleData] = await Promise.all([
        api.listEvidence(),
        api.listVehicles().catch(() => [])
      ]);
      setEvidenceList(evidenceData);
      setVehicles(vehicleData);
    } catch (err) {
      setEvidenceList([
        { id: '2093', vehicle: 'DL-3CAS-4903', status: 'COMPLETED' },
        { id: '1284', vehicle: 'MH-12RT-8219', status: 'PENDING' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUploadSubmit = async (vehicleId: string, file: File): Promise<void> => {
    setIsUploading(true);
    try {
      await api.uploadEvidence(vehicleId, file);
      setIsUploadOpen(false);
      fetchResources();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Evidence Vault</h1>
          <p className="text-xs text-slate-500">Examine and manage processed system footage.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition"
        >
          <Plus size={16} /> Add Telemetry Feed
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Syncing with remote vault...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evidenceList.map((clip) => (
            <div key={clip.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 text-emerald-400">
                    <Film size={18} />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                    clip.status === 'COMPLETED' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-slate-950 text-slate-400'
                  }`}>
                    {clip.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">Clip #{clip.id}</h3>
                  <p className="text-xs text-slate-500 mt-1">Vehicle Match: {clip.vehicle}</p>
                </div>
              </div>
              <div className="px-5 py-4 bg-slate-950/50 border-t border-slate-800/60 flex justify-between items-center">
                <span className="text-[10px] text-slate-600">{clip.created_at || 'Recent'}</span>
                <button
                  onClick={() => navigate(`/dashboard/evidence/${clip.id}`)}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                >
                  Analyze <Play size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploadOpen && (
        <UploadForm
          vehicles={vehicles}
          isUploading={isUploading}
          onClose={() => setIsUploadOpen(false)}
          onSubmit={handleUploadSubmit}
        />
      )}
    </div>
  );
};