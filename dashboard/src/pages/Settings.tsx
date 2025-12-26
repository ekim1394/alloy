import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApiKeys, createApiKey, deleteApiKey } from '../lib/api'
import type { ApiKey } from '../types'

function Settings() {
  const queryClient = useQueryClient()
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['apiKeys'],
    queryFn: fetchApiKeys,
  })

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => createApiKey(name),
    onSuccess: (data) => {
      setCreatedKey(data.key)
      setNewKeyName('')
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => deleteApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    createMutation.mutate(newKeyName)
  }

  const handleDeleteKey = (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h1>API Keys</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Create New API Key</h3>
        <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Key name (e.g., CI Server)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            style={{ flex: 1 }}
            disabled={createMutation.isPending}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Key'}
          </button>
        </form>

        {createdKey && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(63, 185, 80, 0.15)',
            borderRadius: '6px'
          }}>
            <p style={{ marginBottom: '0.5rem', color: 'var(--success)' }}>
              ✓ API key created! Copy it now - you won't see it again.
            </p>
            <code style={{ 
              display: 'block', 
              padding: '0.5rem', 
              background: 'var(--bg-dark)',
              borderRadius: '4px',
              wordBreak: 'break-all'
            }}>
              {createdKey}
            </code>
          </div>
        )}

        {createMutation.isError && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(248, 81, 73, 0.15)',
            borderRadius: '6px',
            color: 'var(--error)'
          }}>
            Failed to create API key: {createMutation.error?.message}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Your API Keys</h3>
        
        {isLoading ? (
          <p>Loading...</p>
        ) : apiKeys.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No API keys yet.</p>
        ) : (
          <table className="job-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Created</th>
                <th>Last Used</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{key.key_prefix}...</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {key.last_used_at 
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td>
                    <button 
                      className="btn" 
                      style={{ color: 'var(--error)' }}
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>CLI Configuration</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Add this to your CLI config file:
        </p>
        <pre style={{ 
          background: 'var(--bg-dark)', 
          padding: '1rem', 
          borderRadius: '6px',
          overflow: 'auto'
        }}>
{`# ~/.alloy/config.toml
orchestrator_url = "${window.location.origin}"
api_key = "your-api-key-here"`}
        </pre>
      </div>
    </div>
  )
}

export default Settings
