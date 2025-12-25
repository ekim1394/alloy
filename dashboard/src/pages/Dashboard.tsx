import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Job {
  id: string
  command: string
  status: string
  exit_code: number | null
  created_at: string
  completed_at: string | null
}

function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/v1/jobs')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'status-running'
      case 'completed': return 'status-completed'
      case 'failed': return 'status-failed'
      default: return 'status-pending'
    }
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Jobs</h1>
        <button className="btn" onClick={fetchJobs}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="card">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <p>No jobs yet. Run your first job with:</p>
          <pre style={{ marginTop: '1rem', opacity: 0.7 }}>
            alloy run -c "xcodebuild test -scheme MyApp"
          </pre>
        </div>
      ) : (
        <table className="job-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Command</th>
              <th>Created</th>
              <th>Exit Code</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <span className={`status ${getStatusClass(job.status)}`}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <Link to={`/jobs/${job.id}`} style={{ color: 'var(--accent)' }}>
                    {job.command.substring(0, 60)}
                    {job.command.length > 60 ? '...' : ''}
                  </Link>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(job.created_at)}
                </td>
                <td>
                  {job.exit_code !== null ? (
                    <span style={{ 
                      color: job.exit_code === 0 ? 'var(--success)' : 'var(--error)' 
                    }}>
                      {job.exit_code}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Dashboard
