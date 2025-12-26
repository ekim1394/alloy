import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchJobs } from '../lib/api'
import type { Job } from '../types'

function Dashboard() {
  const { 
    data: jobs = [], 
    isLoading, 
    isRefetching,
    refetch 
  } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => fetchJobs(),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  })

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
        <button
          className="btn"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          aria-label="Refresh jobs list"
        >
          <span className={isRefetching ? "animate-spin" : ""}>↻</span>
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
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
                    {(job.command || job.script || '').substring(0, 60)}
                    {(job.command || job.script || '').length > 60 ? '...' : ''}
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
