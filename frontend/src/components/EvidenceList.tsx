import React, { useState } from "react";
import { Evidence } from "../pages/EvidenceConsole";
import { EvidenceRow } from "./EvidenceRow";
import { Filter, Search } from "lucide-react";

interface EvidenceListProps {
  evidence: any; // Allow 'any' to dynamically handle backend envelope wraps
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  evidence,
  selectedId,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // DEFENSIVE RESOLUTION: Dynamically unpack the array from standard backend payloads
  const evidenceArray: Evidence[] = Array.isArray(evidence)
    ? evidence
    : evidence && typeof evidence === "object"
    ? (Array.isArray(evidence.results) ? evidence.results
    : Array.isArray(evidence.data) ? evidence.data
    : Array.isArray(evidence.items) ? evidence.items
    : [])
    : [];

  // Safely execute filters on the normalized array
  const filteredList = evidenceArray.filter((item) => {
    if (!item || !item.vehicle) return false;
    const matchesSearch = item.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.processing_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-[340px] border-r border-border bg-bg-panel flex flex-col h-full shrink-0 font-sans">
      {/* Header telemetry counter */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono font-bold text-text-faint uppercase tracking-wider">
            Evidence Records
          </span>
          <span className="text-[10px] font-mono bg-bg-panel-raised text-text-dim px-2 py-0.5 rounded border border-border">
            Total: {evidenceArray.length}
          </span>
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

      {/* Primary Scrollable List Wrapper */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/20">
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
    </div>
  );
};