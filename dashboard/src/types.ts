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



// Billing types
export type SubscriptionPlan = 'pro' | 'team'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trial_ends_at: string | null
  minutes_included: number
  minutes_used: number
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface CheckoutResponse {
  url: string
  sessionId: string
}

export interface PortalResponse {
  url: string
}
