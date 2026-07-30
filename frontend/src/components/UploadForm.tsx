import React, { useState } from 'react';
import { UploadCloud, AlertCircle, X } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_id?: string;
}

interface UploadFormProps {
  vehicles: Vehicle[];
  isUploading: boolean;
  onClose: () => void;
  onSubmit: (vehicleId: string, file: File) => Promise<void>;
}

export const UploadForm: React.FC<UploadFormProps> = ({ vehicles, isUploading, onClose, onSubmit }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedFile) {
      setError('Please specify both an active vehicle node and a source file.');
      return;
    }
    try {
      await onSubmit(selectedVehicle, selectedFile);
    } catch (err: any) {
      setError(err.message || 'File transmission failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition">
          <X size={18} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-white">Upload Incident Stream</h2>
          <p className="text-xs text-slate-500 mt-1">Submit visual sensor telemetry directly to edge network analyzers.</p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/40 text-rose-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Edge Node</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
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
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Source Video file</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative bg-slate-950/40">
              <input type="file" accept="video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <UploadCloud size={32} className="text-slate-500 mb-2" />
              <p className="text-xs text-slate-300 font-semibold">{selectedFile ? selectedFile.name : 'Select or drop video file'}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold py-3 rounded-lg text-sm transition"
          >
            {isUploading ? 'Transmitting...' : 'Upload Clip'}
          </button>
        </form>
      </div>
    </div>
  );
};