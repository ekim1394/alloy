import { useState, useEffect } from 'react'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
}

function Settings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/v1/api-keys')
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.keys || [])
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data.key)
        setNewKeyName('')
        fetchApiKeys()
      }
    } catch (err) {
      console.error('Failed to create API key:', err)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchApiKeys()
      }
    } catch (err) {
      console.error('Failed to delete API key:', err)
    }
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h1>API Keys</h1>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Create New API Key</h3>
        <form onSubmit={createApiKey} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Key name (e.g., CI Server)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Create Key
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
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Your API Keys</h3>
        
        {loading ? (
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
                      onClick={() => deleteApiKey(key.id)}
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
