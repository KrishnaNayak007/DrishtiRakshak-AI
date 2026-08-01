import React, { useState, useEffect } from "react";
import { EvidenceRow } from "./EvidenceRow";
import { Filter, Search, Plus, X, Upload, RefreshCw, AlertCircle, Sparkles, Video, Car, CheckCircle2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

interface EvidenceListProps {
  evidence: any;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUploadSuccess: () => void;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  evidence,
  selectedId,
  onSelect,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const getPresetVehicle = () => user?.vehicleNumber || localStorage.getItem("dr_default_vehicle") || "MH-12-GQ-9831";
  
  const [vehicleId, setVehicleId] = useState(getPresetVehicle);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isUploadOpen && (!vehicleId || vehicleId.trim() === "")) {
      setVehicleId(getPresetVehicle());
    }
  }, [isUploadOpen]);

  const evidenceArray = Array.isArray(evidence)
    ? evidence
    : evidence && typeof evidence === "object"
    ? (Array.isArray(evidence.results) ? evidence.results
    : Array.isArray(evidence.data) ? evidence.data
    : Array.isArray(evidence.items) ? evidence.items
    : [])
    : [];

  const filteredList = evidenceArray.filter((item) => {
    if (!item || !item.vehicle) return false;
    const matchesSearch = item.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.processing_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !file) {
      setUploadError("Please supply both an edge vehicle identifier and a valid video file.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      await api.uploadEvidence(vehicleId, file);
      setFile(null);
      setIsUploadOpen(false);
      onUploadSuccess();
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to transmit video evidence.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-bg-panel text-text-main transition-colors duration-150">
      
      {/* Header Panel */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-text-faint uppercase tracking-wider flex items-center gap-1.5">
            <Video size={12} className="text-emerald-400" />
            <span>Evidence Registry ({evidenceArray.length})</span>
          </span>
          
          <button
            onClick={() => {
              setVehicleId(getPresetVehicle());
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-[10px] rounded-lg cursor-pointer shadow-md shadow-emerald-500/15 transition-all uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            <span>Ingest Clip</span>
          </button>
        </div>

        {/* Plate Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by plate / uuid..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-panel-raised border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main font-mono placeholder:text-text-faint focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </div>

        {/* Filter Toolbar selection */}
        <div className="flex items-center gap-2 bg-bg-panel-raised border border-border rounded-xl px-2.5 py-1">
          <Filter className="w-3 h-3 text-text-faint shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-[10px] py-1 text-text-dim font-mono focus:outline-none cursor-pointer w-full uppercase tracking-wider font-semibold"
          >
            <option value="ALL">ALL PROCESS STATES</option>
            <option value="NEW">NEW</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Primary Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filteredList.length > 0 ? (
          filteredList.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onSelect={() => onSelect(item.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-text-faint text-xs font-mono flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} className="text-text-faint" />
            <span>No secure payloads found matching criteria.</span>
          </div>
        )}
      </div>

      {/* MODULAR UPLOAD DIALOG BACKDROP (AI-Enhanced & Glassmorphic) */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-slate-100">
            
            {/* AI Glow elements */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Ingest New Evidence Node
                </h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition-colors"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {uploadError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-xs font-mono text-rose-400 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Conversational input 1 - AUTO FILLED FROM LOGIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Car size={13} className="text-emerald-400" />
                    <span>Which vehicle recorded this incident?</span>
                  </label>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={10} /> Auto-filled
                  </span>
                </div>
                
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-GQ-9831"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-slate-950/80 border border-slate-700/70 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl p-3 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                />
                <span className="text-[10px] text-slate-400 font-sans block leading-normal">
                  Pre-filled from your active session. You can edit this plate number if uploading for a different vehicle.
                </span>
              </div>

              {/* Conversational input 2 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload size={13} className="text-emerald-400" />
                  <span>Select the source video file</span>
                </label>
                <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-400/60 rounded-xl bg-slate-950/50 p-6 text-center transition-all cursor-pointer group">
                  <input
                    type="file"
                    required
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 group-hover:border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="block text-xs font-semibold text-white mb-1">
                    {file ? file.name : "Select or drag dashcam file"}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Accepts video/mp4, video/avi"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block leading-normal">
                  YOLOv8 neural nets sample this video to compute incident threat metrics.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all border border-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Upload Clip</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};