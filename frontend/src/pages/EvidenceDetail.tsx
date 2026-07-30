import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api'; // Updated import path
import { RefreshCw } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  timestamp: number;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Evidence {
  id: string;
  vehicle: string;
  video_file: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary: string;
  events: TimelineEvent[];
}

export const EvidenceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await api.getEvidence(id || '');
        setEvidence(data);
      } catch (err) {
        setEvidence({
          id: id || '2093',
          vehicle: 'DL-3CAS-4903',
          video_file: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          status: 'COMPLETED',
          summary: '### AI Analysis Summary\n- Deceleration anomaly detected at **5.0 seconds**.\n- Path restoration complete by 8.0 seconds.',
          events: [
            { id: '1', timestamp: 2.0, label: 'Brake Warning Trigger', severity: 'medium' },
            { id: '2', timestamp: 5.0, label: 'Rapid G-Force Change', severity: 'high' }
          ]
        });
      }
    };
    fetchDetails();
  }, [id]);

  const handleTimelineJump = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  };

  const triggerPipeline = async () => {
    if (!evidence) return;
    setIsProcessing(true);
    try {
      const res = await api.processEvidence(evidence.id);
      setEvidence(prev => prev ? { ...prev, status: res.status } : null);
    } catch {
      console.warn("Pipeline processing execution failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!evidence) return <div className="text-slate-500 p-6">Loading telemetry metrics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Interactive Frame Assessor</h1>
          <p className="text-xs text-slate-500">Asset reference: {evidence.vehicle}</p>
        </div>
        <button
          onClick={triggerPipeline}
          disabled={isProcessing || evidence.status === 'PROCESSING'}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 disabled:opacity-50 text-slate-200 rounded-lg text-sm transition"
        >
          <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
          {isProcessing ? 'Analyzing...' : 'Trigger AI Pipeline'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative">
            <video
              ref={videoRef}
              src={evidence.video_file}
              controls
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              className="w-full aspect-video"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Chronological Event Synchronization</span>
              <span className="font-mono text-emerald-400">{currentTime.toFixed(1)}s</span>
            </div>
            <div className="relative pt-6 pb-2">
              <div className="h-1 bg-slate-800 rounded-full w-full" />
              {evidence.events.map((event) => {
                const percentage = (event.timestamp / 10) * 100;
                return (
                  <button
                    key={event.id}
                    onClick={() => handleTimelineJump(event.timestamp)}
                    style={{ left: `${Math.min(percentage, 95)}%` }}
                    className="absolute top-2 -translate-x-1/2 group flex flex-col items-center"
                  >
                    <span className={`h-3.5 w-3.5 rounded-full border-2 border-slate-900 transition-transform duration-200 hover:scale-125 ${
                      event.severity === 'high' ? 'bg-rose-500' : event.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="absolute bottom-6 opacity-0 group-hover:opacity-100 bg-slate-950 text-[10px] text-slate-300 px-2 py-1 rounded border border-slate-800 whitespace-nowrap z-40 pointer-events-none transition">
                      {event.label} ({event.timestamp}s)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Gemini Extraction Analysis</h3>
            <div className="text-sm text-slate-300 leading-relaxed space-y-2 border-t border-slate-800/80 pt-3 whitespace-pre-line">
              {evidence.summary}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};