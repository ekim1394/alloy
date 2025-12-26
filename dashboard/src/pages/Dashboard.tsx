import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchJobs } from '../lib/api'
import type { Job } from '../types'
import LiveLogPanel from '../components/LiveLogPanel'

function Dashboard() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const { 
    data: jobs = [], 
    isLoading, 
    refetch 
  } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => fetchJobs(),
    refetchInterval: 5000,
  })

  // Calculate stats
  const activeBuilds = jobs.filter(j => j.status === 'running').length
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'failed')
  const successRate = completedJobs.length > 0 
    ? Math.round((completedJobs.filter(j => j.status === 'completed').length / completedJobs.length) * 100 * 10) / 10
    : 100

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesSearch = searchQuery === '' || 
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.command || job.script || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const formatDuration = (job: Job) => {
    if (!job.started_at) return '—'
    const start = new Date(job.started_at)
    const end = job.completed_at ? new Date(job.completed_at) : new Date()
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return '●'
      case 'completed': return '✓'
      case 'failed': return '✕'
      default: return '○'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'Running'
      case 'completed': return 'Passed'
      case 'failed': return 'Failed'
      case 'pending': return 'Queued'
      default: return status
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Overview</h1>
            <p className="dashboard-subtitle">Monitor Apple Silicon build clusters and agent status.</p>
          </div>
          <div className="dashboard-header-actions">
            <button className="btn btn-secondary" onClick={() => refetch()}>
              ↻ Refresh
            </button>
            <button className="btn btn-primary">
              + New Workflow
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Active Builds</span>
              <span className="stat-icon">🔧</span>
            </div>
            <div className="stat-value">
              {activeBuilds}
              <span className="stat-trend positive">↑1</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Avg Queue Time</span>
              <span className="stat-icon">⏱️</span>
            </div>
            <div className="stat-value">
              45s
              <span className="stat-trend negative">↓12s</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Success Rate</span>
              <span className="stat-icon">✓</span>
            </div>
            <div className="stat-value">
              {successRate}%
              <span className="stat-trend positive">↑2.1%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Agents Online</span>
              <span className="stat-icon">🖥️</span>
            </div>
            <div className="stat-value">
              8<span className="stat-total">/8</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by Job ID, Commit, or Workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-dropdowns">
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="running">Running</option>
              <option value="completed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Queued</option>
            </select>
            <select className="filter-select">
              <option>Agent: Any</option>
            </select>
          </div>
        </div>

        {/* Jobs Table */}
        {isLoading ? (
          <div className="card">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <p>No jobs yet. Run your first job with:</p>
            <pre>alloy run -c "xcodebuild test -scheme MyApp"</pre>
          </div>
        ) : (
          <div className="jobs-table-wrapper">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>JOB ID / WORKFLOW</th>
                  <th>AGENT</th>
                  <th>DURATION</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className={selectedJob?.id === job.id ? 'selected' : ''}
                    onClick={() => setSelectedJob(job)}
                  >
                    <td>
                      <span className={`status-indicator status-${job.status}`}>
                        <span className="status-dot">{getStatusIcon(job.status)}</span>
                        {getStatusLabel(job.status)}
                      </span>
                    </td>
                    <td>
                      <div className="job-info">
                        <span className="job-id">#{job.id.slice(0, 8)}</span>
                        <span className="job-name">{(job.command || job.script || 'Build').split(' ')[0]}</span>
                        <div className="job-meta">
                          <span className="job-commit">{job.id.slice(-7)}</span>
                          <span className="job-desc">{(job.command || job.script || '').substring(0, 30)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="agent-chip">
                        <span className="agent-icon">🖥️</span>
                        {job.worker_id ? `M1-${job.worker_id.slice(0, 4)}` : '—'}
                      </span>
                    </td>
                    <td className="duration-cell">{formatDuration(job)}</td>
                    <td>
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="action-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Log Panel */}
      {selectedJob && (
        <LiveLogPanel 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </div>
  )
}

export default Dashboard
