// Shared types matching orchestrator API responses

export interface Job {
  id: string
  customer_id: string
  command: string | null
  script: string | null
  source_type: string
  source_url: string | null
  status: JobStatus
  exit_code: number | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  worker_id: string | null
}

export type JobStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface LogEntry {
  content: string
  timestamp?: string
}

export interface JobWithLogs {
  job: Job
  logs?: LogEntry[]
}

export interface CreateJobResponse {
  job_id: string
  status: JobStatus
  stream_url: string
}

export interface RetryJobResponse {
  new_job_id: string
  original_job_id: string
}

export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

export interface CreateApiKeyResponse {
  key: string
  key_id: string
  name: string
}

export interface ApiError {
  message: string
  error_type: string
}
