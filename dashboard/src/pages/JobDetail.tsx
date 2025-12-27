import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import { fetchJob, fetchJobLogs, cancelJob, retryJob, getWebSocketUrl } from '../lib/api';

function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Fetch job details with auto-refresh
  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Only auto-refresh while running
      const status = query.state.data?.job?.status;
      return status === 'running' || status === 'pending' ? 3000 : false;
    },
  });

  // Fetch stored logs (only once or when job completes)
  const { data: storedLogs } = useQuery({
    queryKey: ['job-logs', jobId],
    queryFn: () => fetchJobLogs(jobId!),
    enabled: !!jobId && !!jobData?.job && jobData.job.status !== 'pending',
    staleTime: Infinity, // Don't auto-refetch, rely on WS for running jobs
  });

  const job = jobData?.job;

  // Sync stored logs to state
  useEffect(() => {
    if (storedLogs && logs.length === 0) {
      setLogs(storedLogs);
    } else if (storedLogs && job?.status !== 'running' && job?.status !== 'pending') {
      // If job is finished, ensure we show the full stored logs
      // This helps if we missed some WS messages or if we just loaded the page
      setLogs(storedLogs);
    }
  }, [storedLogs, job?.status]);

  // WebSocket for real-time log streaming
  useEffect(() => {
    if (job?.status === 'running' && jobId) {
      const ws = new WebSocket(getWebSocketUrl(jobId));

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.content) {
          setLogs((prev) => [...prev, data.content]);
        }
      };

      return () => ws.close();
    }
  }, [job?.status, jobId]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Cancel job mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelJob(jobId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Retry job mutation
  const retryMutation = useMutation({
    mutationFn: () => retryJob(jobId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${data.new_job_id}`);
    },
  });

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this job?')) {
      cancelMutation.mutate();
    }
  };

  const handleRetry = () => {
    retryMutation.mutate();
  };

  const copyLogs = () => {
    const text = logs.join('');
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy logs:', err);
      });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!job) {
    return <div className="alert alert-error max-w-2xl mx-auto my-8">Job not found</div>;
  }

  const displayCommand = job.command || job.script || 'No command';

  return (
    <div>
      <div className="mb-4">
        <Link to="/" className="btn btn-ghost btn-sm gap-2">
          ← Back to Jobs
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-4">
            Job Details
            <span
              className={`badge badge-lg ${
                job.status === 'running'
                  ? 'badge-info'
                  : job.status === 'completed'
                    ? 'badge-success'
                    : job.status === 'failed'
                      ? 'badge-error'
                      : 'badge-ghost'
              } text-white`}
            >
              {job.status}
            </span>
          </h1>
          <p className="text-base-content/60 font-mono mt-2 text-sm">{job.id}</p>
        </div>
        <div className="flex gap-2">
          {job.status === 'running' && (
            <button
              className="btn btn-error btn-outline"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Job'}
            </button>
          )}
          {job.status === 'failed' && (
            <button
              className="btn btn-primary"
              onClick={handleRetry}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? 'Retrying...' : 'Retry Job'}
            </button>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
        <div className="card-body p-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-base-content/50 mb-2">
            {job.script ? 'Script' : 'Command'}
          </h3>
          <div className="mockup-code bg-base-300 text-base-content before:hidden p-4 min-w-[50%]">
            <pre>
              <code>{displayCommand}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4">
            <div className="text-xs uppercase font-bold text-base-content/50">Created</div>
            <div className="font-medium">{new Date(job.created_at).toLocaleString()}</div>
          </div>
        </div>
        {job.started_at && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4">
              <div className="text-xs uppercase font-bold text-base-content/50">Started</div>
              <div className="font-medium">{new Date(job.started_at).toLocaleString()}</div>
            </div>
          </div>
        )}
        {job.exit_code !== null && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4">
              <div className="text-xs uppercase font-bold text-base-content/50">Exit Code</div>
              <div
                className={`font-mono font-bold ${job.exit_code === 0 ? 'text-success' : 'text-error'}`}
              >
                {job.exit_code}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card bg-black text-gray-300 shadow-xl overflow-hidden rounded-xl border border-gray-800">
        <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider">Console Output</h3>
            {job.status === 'running' && (
              <span className="loading loading-spinner loading-xs text-primary"></span>
            )}
          </div>
          <button
            onClick={copyLogs}
            className="btn btn-ghost btn-xs text-gray-400 hover:text-white gap-1 tooltip tooltip-left"
            data-tip={isCopied ? 'Copied!' : 'Copy logs'}
            aria-label="Copy logs to clipboard"
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            {isCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div
          className="p-4 font-mono text-sm h-[500px] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          ref={logRef}
          tabIndex={0}
          role="log"
          aria-label="Job logs"
        >
          {logs.length === 0 ? (
            <div className="text-gray-600 italic">
              {job.status === 'running' ? 'Waiting for logs...' : 'No logs available'}
            </div>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all hover:bg-white/5 px-1">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetail;
