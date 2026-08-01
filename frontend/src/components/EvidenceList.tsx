import React, { useState } from "react";
import { EvidenceRow } from "./EvidenceRow";
import { Filter, Search, Plus, X, Upload, RefreshCw, AlertCircle, Sparkles, Video, Car } from "lucide-react";
import { api } from "../api";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      setVehicleId("");
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
            <Video size={12} className="text-emerald-500" />
            <span>Evidence Registry ({evidenceArray.length})</span>
          </span>
          
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer shadow-sm transition-all uppercase tracking-wider"
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
            className="w-full bg-bg-panel-raised border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-main font-mono placeholder:text-text-faint focus:outline-none focus:border-text-dim transition-colors"
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

      {/* MODULAR UPLOAD DIALOG BACKDROP (Humanized & Glassmorphic) */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-bg-panel border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden glass-card">
            
            {/* AI Glow elements */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-xs font-mono font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                <span>Ingest New Evidence Node</span>
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-text-faint hover:text-text-main cursor-pointer p-1 rounded-md hover:bg-bg-panel-raised transition-colors"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-xs font-mono text-rose-400 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Conversational input 1 */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider flex items-center gap-1">
                  <Car size={12} className="text-emerald-500" />
                  <span>Which vehicle recorded this incident?</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-GQ-9831"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-bg-panel-raised border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/35 rounded-xl p-3 text-xs text-text-main font-mono placeholder:text-text-faint focus:outline-none transition-all"
                />
                <span className="text-[9px] text-text-faint font-mono block">This binds the log trace to the specific plate registry.</span>
              </div>

              {/* Conversational input 2 */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider flex items-center gap-1">
                  <Upload size={12} className="text-emerald-500" />
                  <span>Select the source video file</span>
                </label>
                <div className="relative border-2 border-dashed border-border hover:border-emerald-500/40 rounded-xl bg-bg-panel-raised/40 p-6 text-center transition-all cursor-pointer">
                  <input
                    type="file"
                    required
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-text-faint mx-auto mb-2 group-hover:text-emerald-400" />
                  <span className="block text-xs font-semibold text-text-main mb-1">
                    {file ? file.name : "Select or drag dashcam file"}
                  </span>
                  <span className="text-[9px] text-text-faint block font-mono">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Accepts video/mp4, video/avi"}
                  </span>
                </div>
                <span className="text-[9px] text-text-faint font-mono block">Neural nets sample this video to index proximity alerts.</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-bg-panel-raised hover:bg-slate-200 dark:hover:bg-slate-800 text-text-dim hover:text-text-main font-semibold text-xs rounded-xl transition-all border border-border cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
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