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
    <div className="container mx-auto">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Overview</h1>
            <p className="text-base-content/70 mt-1">Monitor Apple Silicon build clusters and agent status.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={() => refetch()}>
              <span className="loading loading-spinner loading-xs hidden"></span>
              ↻ Refresh
            </button>
            <button className="btn btn-primary">
              + New Workflow
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats shadow w-full bg-base-100">
          <div className="stat">
            <div className="stat-figure text-primary">
              <div className="text-3xl">🔧</div>
            </div>
            <div className="stat-title">Active Builds</div>
            <div className="stat-value text-primary">{activeBuilds}</div>
            <div className="stat-desc text-success">↑1</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
               <div className="text-3xl">⏱️</div>
            </div>
            <div className="stat-title">Avg Queue Time</div>
            <div className="stat-value">45s</div>
            <div className="stat-desc text-success">↓12s</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
               <div className="text-3xl">✓</div>
            </div>
            <div className="stat-title">Success Rate</div>
            <div className="stat-value">{successRate}%</div>
            <div className="stat-desc text-success">↑2.1%</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
               <div className="text-3xl">🖥️</div>
            </div>
            <div className="stat-title">Agents Online</div>
            <div className="stat-value">8<span className="text-lg opacity-50">/8</span></div>
            <div className="stat-desc">All systems operational</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="join flex-1">
             <div className="join-item flex items-center bg-base-100 border border-base-300 px-3">
                <span>🔍</span>
             </div>
            <input
              type="text"
              placeholder="Search by Job ID, Commit, or Workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered join-item w-full focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="running">Running</option>
              <option value="completed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Queued</option>
            </select>
            <select className="select select-bordered">
              <option>Agent: Any</option>
            </select>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
          {isLoading ? (
             <div className="flex justify-center p-8">
               <span className="loading loading-spinner loading-lg"></span>
             </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-base-content/60">
              <p className="mb-4 text-lg">No jobs yet.</p>
              <div className="mockup-code inline-block text-left">
                <pre data-prefix="$"><code>alloy run -c "xcodebuild test -scheme MyApp"</code></pre>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
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
                      className={`hover cursor-pointer transition-colors ${selectedJob?.id === job.id ? 'bg-base-200' : ''}`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <td>
                        <div className={`badge gap-2 ${
                            job.status === 'running' ? 'badge-info' :
                            job.status === 'completed' ? 'badge-success' :
                            job.status === 'failed' ? 'badge-error' :
                            'badge-ghost'
                        } ${job.status !== 'pending' ? 'text-white' : ''} font-medium p-3`}>
                            {getStatusIcon(job.status)}
                            {getStatusLabel(job.status)}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="flex items-baseline gap-2">
                             <span className="font-mono text-xs opacity-50">#{job.id.slice(0, 8)}</span>
                             <span className="font-bold">{(job.command || job.script || 'Build').split(' ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1">
                            <span className="font-mono bg-base-300 px-1 rounded">{job.id.slice(-7)}</span>
                            <span className="truncate max-w-[200px]">{(job.command || job.script || '').substring(0, 30)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-ghost font-mono text-xs">
                           🖥️ {job.worker_id ? `M1-${job.worker_id.slice(0, 4)}` : '—'}
                        </div>
                      </td>
                      <td className="font-mono text-sm">{formatDuration(job)}</td>
                      <td>
                        <Link 
                          to={`/jobs/${job.id}`}
                          className="btn btn-ghost btn-sm btn-circle"
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
