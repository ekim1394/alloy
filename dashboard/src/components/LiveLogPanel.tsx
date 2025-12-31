import { useState, useEffect, useRef } from 'react';
import { Download, Maximize2, Minimize2, X } from 'lucide-react';
import { getWebSocketUrl } from '../lib/api';
import type { Job } from '../types';

interface LiveLogPanelProps {
  job: Job;
  onClose: () => void;
}

function LiveLogPanel({ job, onClose }: LiveLogPanelProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // WebSocket for real-time log streaming
  useEffect(() => {
    setLogs([]); // Clear logs when job changes

    if (job.status === 'running') {
      const ws = new WebSocket(getWebSocketUrl(job.id));

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.content) {
          setLogs((prev) => [...prev, data.content]);
        }
      };

      return () => ws.close();
    }
  }, [job.id, job.status]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className={`fixed top-0 right-0 bottom-0 bg-base-100 border-l border-base-200 shadow-2xl flex flex-col z-50 transition-all duration-200 ease-in-out ${
        isFullscreen ? 'w-full left-0 border-l-0' : 'w-[420px]'
      }`}
    >
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
            title="Download Logs"
            aria-label="Download logs"
            onClick={() => {
              const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `job-${job.id}-logs.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={14} />
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-error/60 hover:text-error hover:bg-error/10"
            onClick={onClose}
            title="Close"
            aria-label="Close log panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed bg-[#050d18] text-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary focus:outline-none"
        ref={logRef}
        tabIndex={0}
        role="log"
        aria-label="Build logs"
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
