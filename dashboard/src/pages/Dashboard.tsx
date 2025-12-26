import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  RotateCw, 
  Plus, 
  Server, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { fetchJobs } from '../lib/api'
import type { Job } from '../types'
import LiveLogPanel from '../components/LiveLogPanel'
import EmptyState from '../assets/empty-state.png'

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
      case 'running': return <Activity size={16} className="animate-pulse" />
      case 'completed': return <CheckCircle2 size={16} />
      case 'failed': return <XCircle size={16} />
      default: return <Clock size={16} />
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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-base-content/60 mt-1 font-medium">Monitor Apple Silicon build clusters and agent status.</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-outline gap-2" onClick={() => refetch()}>
              <RotateCw size={16} />
              Refresh
            </button>
            <button className="btn btn-primary gap-2">
              <Plus size={18} />
              New Workflow
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-title text-base-content/60 font-medium">Active Builds</div>
                  <div className="stat-value text-primary mt-2">{activeBuilds}</div>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Activity size={24} />
                </div>
              </div>
              <div className="stat-desc text-success flex items-center gap-1 mt-2 font-medium">
                <ArrowUpRight size={14} /> 1 since last hour
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-title text-base-content/60 font-medium">Avg Queue Time</div>
                  <div className="stat-value mt-2">45s</div>
                </div>
                <div className="p-2 bg-base-200 rounded-lg text-base-content/70">
                  <Clock size={24} />
                </div>
              </div>
              <div className="stat-desc text-success flex items-center gap-1 mt-2 font-medium">
                <ArrowDownRight size={14} /> 12s from yesterday
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-title text-base-content/60 font-medium">Success Rate</div>
                  <div className="stat-value mt-2">{successRate}%</div>
                </div>
                <div className="p-2 bg-success/10 rounded-lg text-success">
                  <CheckCircle2 size={24} />
                </div>
              </div>
              <div className="stat-desc text-success flex items-center gap-1 mt-2 font-medium">
                <ArrowUpRight size={14} /> 2.1% this week
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
             <div className="card-body p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="stat-title text-base-content/60 font-medium">Agents Online</div>
                  <div className="stat-value mt-2">8<span className="text-xl opacity-40 font-normal">/8</span></div>
                </div>
                <div className="p-2 bg-base-200 rounded-lg text-base-content/70">
                  <Server size={24} />
                </div>
              </div>
              <div className="stat-desc text-success mt-2 font-medium">All systems operational</div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                <Search size={18} />
             </div>
            <input
              type="text"
              placeholder="Search by Job ID, Commit, or Workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              className="select select-bordered flex-1 md:flex-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="running">Running</option>
              <option value="completed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Queued</option>
            </select>
            <select className="select select-bordered flex-1 md:flex-none">
              <option>Agent: Any</option>
            </select>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
          {isLoading ? (
             <div className="flex justify-center p-12">
               <span className="loading loading-spinner loading-lg text-primary"></span>
             </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <img src={EmptyState} alt="No jobs found" className="w-64 mb-6 opacity-80" />
              <h3 className="text-xl font-bold mb-2">No jobs found</h3>
              <p className="text-base-content/60 max-w-md mb-6">
                Get started by running your first job using the Alloy CLI.
              </p>
              <div className="mockup-code bg-base-300 text-base-content text-left shadow-none border border-base-content/10">
                <pre data-prefix="$"><code>alloy run -c "xcodebuild test -scheme MyApp"</code></pre>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-lg w-full">
                <thead className="bg-base-200/50">
                  <tr>
                    <th className="font-semibold text-xs tracking-wider opacity-70">STATUS</th>
                    <th className="font-semibold text-xs tracking-wider opacity-70">JOB ID / WORKFLOW</th>
                    <th className="font-semibold text-xs tracking-wider opacity-70">AGENT</th>
                    <th className="font-semibold text-xs tracking-wider opacity-70">DURATION</th>
                    <th className="font-semibold text-xs tracking-wider opacity-70">ACTIONS</th>
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
                        <div className={`badge gap-2 h-8 pl-2 pr-3 ${
                            job.status === 'running' ? 'badge-info text-info-content' :
                            job.status === 'completed' ? 'badge-success text-success-content' :
                            job.status === 'failed' ? 'badge-error text-error-content' :
                            'badge-ghost'
                        } font-medium`}>
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
                            <span className="font-mono bg-base-200/80 px-1 rounded border border-base-300">{job.id.slice(-7)}</span>
                            <span className="truncate max-w-[200px]">{(job.command || job.script || '').substring(0, 30)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-ghost badge-outline gap-1 font-mono text-xs">
                           <Server size={10} /> {job.worker_id ? `M1-${job.worker_id.slice(0, 4)}` : '—'}
                        </div>
                      </td>
                      <td className="font-mono text-sm">{formatDuration(job)}</td>
                      <td>
                        <Link 
                          to={`/jobs/${job.id}`}
                          className="btn btn-ghost btn-sm btn-circle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ArrowUpRight size={18} />
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
