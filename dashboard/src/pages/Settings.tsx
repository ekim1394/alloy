import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { fetchApiKeys, createApiKey, deleteApiKey } from '../lib/api'
import BillingSettings from '../components/BillingSettings'
import type { ApiKey } from '../types'

function Settings() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'general' | 'billing'>('general')
  const queryClient = useQueryClient()
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  // Switch to billing tab if returned from checkout or requested via tab param
  useEffect(() => {
    const tab = searchParams.get('tab')
    const checkout = searchParams.get('checkout')
    
    if (tab === 'billing' || checkout) {
      setActiveTab('billing')
    }
  }, [searchParams])

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['apiKeys'],
    queryFn: fetchApiKeys,
    enabled: activeTab === 'general',
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div role="tablist" className="tabs tabs-lifted mb-8">
        <a 
          role="tab" 
          className={`tab ${activeTab === 'general' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </a>
        <a 
          role="tab" 
          className={`tab ${activeTab === 'billing' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing
        </a>
      </div>

      <div className="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
        {activeTab === 'general' ? (
          <>
            <div className="card bg-base-100 mb-8">
              <h3 className="text-xl font-bold mb-4">Create New API Key</h3>
              <form onSubmit={handleCreateKey} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Key name (e.g., CI Server)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="input input-bordered flex-1"
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
                <div role="alert" className="alert alert-success mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <h3 className="font-bold">API key created!</h3>
                    <div className="text-xs">Copy it now - you won't see it again.</div>
                    <div className="mt-2 text-sm bg-base-300 p-2 rounded font-mono select-all">
                      {createdKey}
                    </div>
                  </div>
                </div>
              )}

              {createMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                   <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Failed to create API key: {createMutation.error?.message}</span>
                </div>
              )}
            </div>

            <div className="card bg-base-100">
              <h3 className="text-xl font-bold mb-4">Your API Keys</h3>
              
              {isLoading ? (
                <div className="flex justify-center p-4">
                   <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : apiKeys.length === 0 ? (
                <p className="text-base-content/60 italic">No API keys yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
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
                        <tr key={key.id} className="hover">
                          <td className="font-medium">{key.name}</td>
                          <td className="font-mono text-xs">{key.key_prefix}...</td>
                          <td className="text-base-content/70 text-sm">
                            {new Date(key.created_at).toLocaleDateString()}
                          </td>
                          <td className="text-base-content/70 text-sm">
                            {key.last_used_at 
                              ? new Date(key.last_used_at).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="text-right">
                            <button 
                              className="btn btn-ghost btn-xs text-error" 
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
                </div>
              )}
            </div>

            <div className="card bg-base-100 mt-8">
              <h3 className="text-xl font-bold mb-4">CLI Configuration</h3>
              <p className="text-base-content/70 mb-4 text-sm">
                Add this to your CLI config file:
              </p>
              <div className="mockup-code text-sm">
                <pre data-prefix="$"><code>cat ~/.alloy/config.toml</code></pre> 
                <pre><code>{`orchestrator_url = "${window.location.origin}"
api_key = "your-api-key-here"`}</code></pre>
              </div>
            </div>
          </>
        ) : (
          <BillingSettings />
        )}
      </div>
    </div>
  )
}

export default Settings
