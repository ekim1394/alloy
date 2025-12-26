// Centralized API client for orchestrator communication

import { Job, JobWithLogs, ApiKey, CreateApiKeyResponse, RetryJobResponse } from '../types';

// API base URL - uses env variable in production, relative path for local dev (Vite proxy)
const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api/v1`;

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

// ===== Jobs API =====

import { supabase } from './supabase';

// Helper to get auth headers from current session
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }
  return { 'Content-Type': 'application/json' };
}

export async function fetchJobs(status?: string, limit?: number): Promise<Job[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', limit.toString());

  const url = params.toString() ? `${API_BASE}/jobs?${params}` : `${API_BASE}/jobs`;
  const headers = await getAuthHeaders();

  const response = await fetch(url, { headers });
  return handleResponse<Job[]>(response);
}

export async function fetchJob(jobId: string): Promise<JobWithLogs> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, { headers });
  const job = await handleResponse<Job>(response);
  // Job detail endpoint returns job directly, logs come from websocket
  return { job };
}

export async function fetchJobLogs(jobId: string): Promise<string[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/jobs/${jobId}/logs/stored`, { headers });
  const logs = await handleResponse<Array<{ content: string }>>(response);
  return logs.map((l) => l.content);
}

export async function cancelJob(jobId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to cancel job' }));
    throw new Error(error.message);
  }
}

export async function retryJob(jobId: string): Promise<RetryJobResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/jobs/${jobId}/retry`, {
    method: 'POST',
    headers,
  });
  return handleResponse<RetryJobResponse>(response);
}

// ===== API Keys =====

export async function fetchApiKeys(): Promise<ApiKey[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api-keys`, { headers });
  return handleResponse<ApiKey[]>(response);
}

export async function createApiKey(name: string): Promise<CreateApiKeyResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api-keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  return handleResponse<CreateApiKeyResponse>(response);
}

export async function deleteApiKey(keyId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/api-keys/${keyId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete API key' }));
    throw new Error(error.message);
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
    const wsProtocol = API_URL.startsWith('https') ? 'wss:' : 'ws:';
    const apiHost = API_URL.replace(/^https?:\/\//, '');
    return `${wsProtocol}//${apiHost}/api/v1/jobs/${jobId}/logs`;
  }
  // Development: use current host (Vite proxy)
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}/api/v1/jobs/${jobId}/logs`;
}

// ===== Billing API (via Supabase) =====

import type { Subscription, CheckoutResponse, PortalResponse } from '../types';

export async function fetchSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase.from('subscriptions').select('*').single();

  if (error) {
    // PGRST116 means no rows found - new user without subscription
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }
  return data;
}

export async function createCheckoutSession(plan: 'pro' | 'team'): Promise<CheckoutResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await supabase.functions.invoke('create-checkout', {
    body: {
      plan,
      successUrl: `${window.location.origin}/settings?checkout=success`,
      cancelUrl: `${window.location.origin}/settings?checkout=cancel`,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to create checkout session');
  }
  return response.data;
}

export async function createPortalSession(): Promise<PortalResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await supabase.functions.invoke('create-portal', {
    body: {
      returnUrl: `${window.location.origin}/settings`,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to create portal session');
  }
  return response.data;
}
