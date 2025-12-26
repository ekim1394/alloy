import { useState, useEffect, useRef } from 'react'
import { getWebSocketUrl } from '../lib/api'
import type { Job } from '../types'

interface LiveLogPanelProps {
  job: Job
  onClose: () => void
}

function LiveLogPanel({ job, onClose }: LiveLogPanelProps) {
  const [logs, setLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  // WebSocket for real-time log streaming
  useEffect(() => {
    setLogs([]) // Clear logs when job changes
    
    if (job.status === 'running') {
      const ws = new WebSocket(getWebSocketUrl(job.id))

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.content) {
          setLogs((prev) => [...prev, data.content])
        }
      }

      return () => ws.close()
    }
  }, [job.id, job.status])

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const getTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  return (
    <div className="live-log-panel">
      <div className="log-panel-header">
        <div className="log-panel-title">
          <span className={`log-status-dot ${job.status}`}></span>
          <span className="log-title-text">Job #{job.id.slice(0, 8)} Live Log</span>
        </div>
        <div className="log-panel-meta">
          Target: {(job.command || job.script || 'Build').split(' ')[0]} • {job.worker_id ? `M1-${job.worker_id.slice(0, 4)}` : 'Pending'}
        </div>
        <div className="log-panel-actions">
          <button className="log-action-btn" title="Download">↓</button>
          <button className="log-action-btn" title="Fullscreen">⛶</button>
          <button className="log-action-btn close" onClick={onClose} title="Close">●</button>
        </div>
      </div>

      <div className="log-panel-content" ref={logRef}>
        <div className="log-timestamp">
          Build started at {job.started_at ? new Date(job.started_at).toLocaleTimeString() : 'pending'}
        </div>
        
        {logs.length === 0 ? (
          <div className="log-waiting">
            {job.status === 'running' ? (
              <>
                <div className="log-line">→ Cloning repository...</div>
                <div className="log-line dim">  Cached credentials found.</div>
                <div className="log-line">→ Setting up environment...</div>
              </>
            ) : job.status === 'pending' ? (
              <div className="log-line dim">Waiting for agent...</div>
            ) : (
              <div className="log-line dim">No logs available</div>
            )}
          </div>
        ) : (
          logs.map((line, i) => (
            <div 
              key={i} 
              className={`log-line ${line.includes('✓') || line.includes('success') || line.includes('complete') ? 'success' : ''} ${line.includes('error') || line.includes('failed') ? 'error' : ''}`}
            >
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LiveLogPanel
