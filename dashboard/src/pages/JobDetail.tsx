import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJob, fetchJobLogs, cancelJob, retryJob, getWebSocketUrl } from '../lib/api'

function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [logs, setLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  // Fetch job details with auto-refresh
  const { 
    data: jobData, 
    isLoading 
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Only auto-refresh while running
      const status = query.state.data?.job?.status
      return status === 'running' || status === 'pending' ? 3000 : false
    },
  })

  // Fetch stored logs (only once or when job completes)
  const { data: storedLogs } = useQuery({
    queryKey: ['job-logs', jobId],
    queryFn: () => fetchJobLogs(jobId!),
    enabled: !!jobId && !!jobData?.job && jobData.job.status !== 'pending',
    staleTime: Infinity, // Don't auto-refetch, rely on WS for running jobs
  })

  const job = jobData?.job

  // Sync stored logs to state
  useEffect(() => {
    if (storedLogs && logs.length === 0) {
      setLogs(storedLogs)
    } else if (storedLogs && job?.status !== 'running' && job?.status !== 'pending') {
      // If job is finished, ensure we show the full stored logs
      // This helps if we missed some WS messages or if we just loaded the page
      setLogs(storedLogs)
    }
  }, [storedLogs, job?.status])

  // WebSocket for real-time log streaming
  useEffect(() => {
    if (job?.status === 'running' && jobId) {
      const ws = new WebSocket(getWebSocketUrl(jobId))

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.content) {
          setLogs((prev) => [...prev, data.content])
        }
      }

      return () => ws.close()
    }
  }, [job?.status, jobId])

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  // Cancel job mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelJob(jobId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  // Retry job mutation
  const retryMutation = useMutation({
    mutationFn: () => retryJob(jobId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate(`/jobs/${data.new_job_id}`)
    },
  })

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this job?')) {
      cancelMutation.mutate()
    }
  }

  const handleRetry = () => {
    retryMutation.mutate()
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'status-running'
      case 'completed': return 'status-completed'
      case 'failed': return 'status-failed'
      default: return 'status-pending'
    }
  }

  if (isLoading) {
    return <div className="card">Loading...</div>
  }

  if (!job) {
    return <div className="card">Job not found</div>
  }

  const displayCommand = job.command || job.script || 'No command'

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
            <button 
              className="btn" 
              onClick={handleCancel} 
              style={{ color: 'var(--error)' }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
          {job.status === 'failed' && (
            <button 
              className="btn btn-primary" 
              onClick={handleRetry}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>
          {job.script ? 'Script' : 'Command'}
        </h3>
        <pre style={{ 
          background: 'var(--bg-dark)', 
          padding: '0.75rem', 
          borderRadius: '6px',
          overflow: 'auto'
        }}>
          {displayCommand}
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
