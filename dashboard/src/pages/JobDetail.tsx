import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Job {
  id: string
  command: string
  status: string
  exit_code: number | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

function JobDetail() {
  const { jobId } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchJob()
    const interval = setInterval(fetchJob, 3000)
    return () => clearInterval(interval)
  }, [jobId])

  useEffect(() => {
    if (job?.status === 'running') {
      const ws = new WebSocket(
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/jobs/${jobId}/logs`
      )

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.content) {
          setLogs((prev) => [...prev, data.content])
        }
      }

      return () => ws.close()
    }
  }, [job?.status, jobId])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`)
      if (res.ok) {
        const data = await res.json()
        setJob(data.job)
        if (data.logs) {
          setLogs(data.logs.map((l: { content: string }) => l.content))
        }
      }
    } catch (err) {
      console.error('Failed to fetch job:', err)
    } finally {
      setLoading(false)
    }
  }

  const cancelJob = async () => {
    if (!confirm('Are you sure you want to cancel this job?')) return

    try {
      await fetch(`/api/v1/jobs/${jobId}/cancel`, { method: 'POST' })
      fetchJob()
    } catch (err) {
      console.error('Failed to cancel job:', err)
    }
  }

  const retryJob = async () => {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/retry`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        window.location.href = `/jobs/${data.job_id}`
      }
    } catch (err) {
      console.error('Failed to retry job:', err)
    }
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'status-running'
      case 'completed': return 'status-completed'
      case 'failed': return 'status-failed'
      default: return 'status-pending'
    }
  }

  if (loading) {
    return <div className="card">Loading...</div>
  }

  if (!job) {
    return <div className="card">Job not found</div>
  }

  return (
    <div className="job-detail">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)' }}>
          ← Back to Jobs
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Job Details
            <span className={`status ${getStatusClass(job.status)}`}>
              {job.status}
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {job.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {job.status === 'running' && (
            <button className="btn" onClick={cancelJob} style={{ color: 'var(--error)' }}>
              Cancel
            </button>
          )}
          {job.status === 'failed' && (
            <button className="btn btn-primary" onClick={retryJob}>
              Retry
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Command</h3>
        <pre style={{ 
          background: 'var(--bg-dark)', 
          padding: '0.75rem', 
          borderRadius: '6px',
          overflow: 'auto'
        }}>
          {job.command}
        </pre>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Created</div>
          <div>{new Date(job.created_at).toLocaleString()}</div>
        </div>
        {job.started_at && (
          <div className="card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Started</div>
            <div>{new Date(job.started_at).toLocaleString()}</div>
          </div>
        )}
        {job.exit_code !== null && (
          <div className="card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Exit Code</div>
            <div style={{ color: job.exit_code === 0 ? 'var(--success)' : 'var(--error)' }}>
              {job.exit_code}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Logs</h3>
        <div className="log-viewer" ref={logRef}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>
              {job.status === 'running' ? 'Waiting for logs...' : 'No logs available'}
            </div>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="log-line">{line}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default JobDetail
