// Centralized API client for orchestrator communication

import { Job, JobWithLogs, ApiKey, CreateApiKeyResponse, RetryJobResponse } from '../types'

// API base URL - uses env variable in production, relative path for local dev (Vite proxy)
const API_URL = import.meta.env.VITE_API_URL || ''
const API_BASE = `${API_URL}/api/v1`

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
  return response.json()
}

// ===== Jobs API =====

export async function fetchJobs(status?: string, limit?: number): Promise<Job[]> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (limit) params.set('limit', limit.toString())
  
  const url = params.toString() 
    ? `${API_BASE}/jobs?${params}` 
    : `${API_BASE}/jobs`
  
  const response = await fetch(url)
  return handleResponse<Job[]>(response)
}

export async function fetchJob(jobId: string): Promise<JobWithLogs> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`)
  const job = await handleResponse<Job>(response)
  // Job detail endpoint returns job directly, logs come from websocket
  return { job }
}

export async function cancelJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to cancel job' }))
    throw new Error(error.message)
  }
}

export async function retryJob(jobId: string): Promise<RetryJobResponse> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/retry`, {
    method: 'POST',
  })
  return handleResponse<RetryJobResponse>(response)
}

// ===== API Keys =====

export async function fetchApiKeys(): Promise<ApiKey[]> {
  const response = await fetch(`${API_BASE}/api-keys`)
  const data = await handleResponse<{ keys: ApiKey[] }>(response)
  return data.keys || []
}

export async function createApiKey(name: string): Promise<CreateApiKeyResponse> {
  const response = await fetch(`${API_BASE}/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return handleResponse<CreateApiKeyResponse>(response)
}

export async function deleteApiKey(keyId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api-keys/${keyId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete API key' }))
    throw new Error(error.message)
  }
}

// ===== Utilities =====

/**
 * Get the WebSocket URL for log streaming
 * Uses VITE_API_URL in production, current host in development
 */
export function getWebSocketUrl(jobId: string): string {
  if (API_URL) {
    // Production: use API domain
    const wsProtocol = API_URL.startsWith('https') ? 'wss:' : 'ws:'
    const apiHost = API_URL.replace(/^https?:\/\//, '')
    return `${wsProtocol}//${apiHost}/api/v1/jobs/${jobId}/logs`
  }
  // Development: use current host (Vite proxy)
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${window.location.host}/api/v1/jobs/${jobId}/logs`
}
