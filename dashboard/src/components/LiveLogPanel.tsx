import { useState, useEffect, useRef } from 'react';
import { getWebSocketUrl } from '../lib/api';
import type { Job } from '../types';

interface LiveLogPanelProps {
  job: Job;
  onClose: () => void;
}

function LiveLogPanel({ job, onClose }: LiveLogPanelProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<string[]>([]);
  const frameRef = useRef<number>();

  // WebSocket for real-time log streaming
  useEffect(() => {
    setLogs([]); // Clear logs when job changes
    bufferRef.current = []; // Clear buffer

    if (job.status === 'running') {
      const ws = new WebSocket(getWebSocketUrl(job.id));

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.content) {
          bufferRef.current.push(data.content);

          if (!frameRef.current) {
            frameRef.current = requestAnimationFrame(() => {
              const newLogs = bufferRef.current;
              bufferRef.current = [];
              if (newLogs.length > 0) {
                setLogs((prev) => [...prev, ...newLogs]);
              }
              frameRef.current = undefined;
            });
          }
        }
      };

      return () => {
        ws.close();
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = undefined;
        }
      };
    }
  }, [job.id, job.status]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[420px] bg-base-100 border-l border-base-200 shadow-2xl flex flex-col z-50">
      <div className="p-5 bg-base-200 border-b border-base-200">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`w-2 h-2 rounded-full ${
              job.status === 'running'
                ? 'bg-primary shadow-[0_0_8px] shadow-primary animate-pulse'
                : job.status === 'completed'
                  ? 'bg-success'
                  : job.status === 'failed'
                    ? 'bg-error'
                    : 'bg-base-content/40'
            }`}
          ></span>
          <span className="font-semibold text-base-content text-sm">
            Job #{job.id.slice(0, 8)} Live Log
          </span>
        </div>
        <div className="text-xs text-base-content/60">
          Target: {(job.command || job.script || 'Build').split(' ')[0]} •{' '}
          {job.worker_id ? `M1-${job.worker_id.slice(0, 4)}` : 'Pending'}
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
            title="Download"
          >
            ↓
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
            title="Fullscreen"
          >
            ⛶
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-error/60 hover:text-error hover:bg-error/10"
            onClick={onClose}
            title="Close"
          >
            ●
          </button>
        </div>
      </div>

      <div
        className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed bg-[#050d18] text-gray-400"
        ref={logRef}
      >
        <div className="text-gray-500 text-xs mb-4">
          Build started at{' '}
          {job.started_at ? new Date(job.started_at).toLocaleTimeString() : 'pending'}
        </div>

        {logs.length === 0 ? (
          <div className="text-gray-500">
            {job.status === 'running' ? (
              <>
                <div className="py-0.5">→ Cloning repository...</div>
                <div className="py-0.5 opacity-60"> Cached credentials found.</div>
                <div className="py-0.5">→ Setting up environment...</div>
              </>
            ) : job.status === 'pending' ? (
              <div className="py-0.5 opacity-60">Waiting for agent...</div>
            ) : (
              <div className="py-0.5 opacity-60">No logs available</div>
            )}
          </div>
        ) : (
          logs.map((line, i) => (
            <div
              key={i}
              className={`py-0.5 ${
                line.includes('✓') || line.includes('success') || line.includes('complete')
                  ? 'text-success'
                  : line.includes('error') || line.includes('failed')
                    ? 'text-error'
                    : ''
              }`}
            >
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LiveLogPanel;
