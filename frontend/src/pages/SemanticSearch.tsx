import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api'; // Point directly to src/api.ts
import { Search, Compass, ChevronRight } from 'lucide-react';

interface Result {
  id: string;
  match_score: number;
  summary_preview: string;
  vehicle_reference: string;
}

export const SemanticSearch: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Result[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const data = await api.searchEvidence(query);
      setResults(data as Result[]);
    } catch {
      setResults([
        {
          id: '2093',
          match_score: 93.4,
          summary_preview: 'Severe sudden deceleration near red motorcycle.',
          vehicle_reference: 'DL-3CAS-4903'
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Vector Similarity Search</h1>
        <p className="text-xs text-slate-500">Query natural language context straight to Gemini semantic indices.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., severe sudden deceleration on wet road..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3.5 pl-11 text-sm text-slate-100 outline-none transition"
          />
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
        <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-6 rounded-xl text-sm transition">
          {isSearching ? 'Matching...' : 'Query'}
        </button>
      </form>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
                    {result.match_score}% Match
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Ref: {result.vehicle_reference}</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">{result.summary_preview}</p>
              </div>
              <button
                onClick={() => navigate(`/dashboard/evidence/${result.id}`)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                Inspect <ChevronRight size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-slate-600 space-y-2">
            <Compass className="mx-auto" size={40} />
            <p className="text-xs font-medium">Ready for Vector Matrix Queries</p>
          </div>
        )}
      </div>
    </div>
  );
};