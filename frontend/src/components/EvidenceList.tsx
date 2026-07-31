import React, { useState } from "react";
import { EvidenceRow } from "./EvidenceRow";
import { Filter, Search, Plus, X, Upload, RefreshCw } from "lucide-react";
import { api } from "../api";

interface EvidenceListProps {
  evidence: any;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUploadSuccess: () => void; // Triggered to refresh the registry after a successful POST
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  evidence,
  selectedId,
  onSelect,
  onUploadSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Upload modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Normalizes the evidence list if wrapped by standard backend payloads
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

  // Handles the multi-part form submit directly through api.uploadEvidence
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !file) {
      setUploadError("Please provide both a Vehicle ID and a video clip.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      
      // Perform the upload through your built-in api module
      await api.uploadEvidence(vehicleId, file);

      // Reset state and notify page component to refresh
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
    <div className="w-[340px] border-r border-border bg-bg-panel flex flex-col h-full shrink-0 font-sans transition-colors duration-150">
      
      {/* List Header with inline upload trigger */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono font-bold text-text-faint uppercase tracking-wider">
            Evidence Records ({evidenceArray.length})
          </span>
          
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] rounded-[var(--radius-custom)] cursor-pointer shadow-sm transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Upload Clip</span>
          </button>
        </div>

        {/* Plate Search input */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by plate / uuid..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-panel-raised border border-border rounded-[var(--radius-custom)] pl-9 pr-3 py-1.5 text-xs text-text-main font-mono placeholder:text-text-faint focus:outline-none focus:border-text-dim transition-colors"
          />
        </div>

        {/* Filter Toolbar selection */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-text-faint shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg-panel-raised border border-border rounded text-[10px] py-1 px-2 text-text-dim font-mono focus:outline-none cursor-pointer w-full"
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
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
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
          <div className="p-8 text-center text-text-faint text-xs font-mono">
            No secure payloads found matching criteria.
          </div>
        )}
      </div>

      {/* 3. MODULAR UPLOAD DIALOG BACKDROP */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-bg-panel border border-border rounded-lg max-w-sm w-full p-5 shadow-xl transition-colors duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-xs font-mono font-bold text-text-main uppercase tracking-wider">
                Ingest New Evidence Clip
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-text-faint hover:text-text-main cursor-pointer"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 p-3 rounded text-[11px] font-mono text-red-600 dark:text-red-400">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-text-dim uppercase mb-1.5">
                  Vehicle Identifier / Plate Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-GQ-9831"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-bg-panel-raised border border-border rounded-[var(--radius-custom)] p-2 text-xs text-text-main font-mono placeholder:text-text-faint focus:outline-none focus:border-text-dim transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-text-dim uppercase mb-1.5">
                  Dashcam Video File
                </label>
                <div className="relative border border-dashed border-border hover:border-text-dim rounded-[var(--radius-custom)] bg-bg-panel-raised p-6 text-center transition-colors">
                  <input
                    type="file"
                    required
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-text-faint mx-auto mb-2" />
                  <span className="block text-xs font-semibold text-text-main mb-1">
                    {file ? file.name : "Select raw clip"}
                  </span>
                  <span className="text-[10px] text-text-faint block">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "video/mp4 or video/avi"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-bg-panel-raised hover:bg-slate-200 dark:hover:bg-slate-800 text-text-dim font-semibold text-xs rounded-[var(--radius-custom)] transition-colors border border-border cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-[var(--radius-custom)] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <span>Upload Clip</span>
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