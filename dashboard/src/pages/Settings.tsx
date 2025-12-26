import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Key,
  CreditCard,
  Copy,
  Trash2,
  Terminal,
  CheckCircle2,
  XCircle,
  User,
  Mail,
  Lock,
} from 'lucide-react';
import { fetchApiKeys, createApiKey, deleteApiKey } from '../lib/api';
import { supabase } from '../lib/supabase';
import BillingSettings from '../components/BillingSettings';
import type { ApiKey } from '../types';

function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'general' | 'billing'>('general');
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // User account state
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Switch to billing tab if returned from checkout or requested via tab param
  useEffect(() => {
    const tab = searchParams.get('tab');
    const checkout = searchParams.get('checkout');

    if (tab === 'billing' || checkout) {
      setActiveTab('billing');
    }
  }, [searchParams]);

  // Fetch user data
  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoadingUser(false);
      }
    }
    getUser();
  }, []);

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['apiKeys'],
    queryFn: fetchApiKeys,
    enabled: activeTab === 'general',
  });

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: (name: string) => createApiKey(name),
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setNewKeyName('');
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => deleteApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createMutation.mutate(newKeyName);
  };

  const handleDeleteKey = (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    deleteMutation.mutate(id);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    setUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordMessage({ type: 'error', text: error.message });
      } else {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
        setNewPassword('');
        setShowPasswordForm(false);

        // Refresh user to ensure identities are up to date
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const hasPassword = user?.identities?.some((identity) => identity.provider === 'email');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-base-content/60 mt-1 font-medium">
            Manage your account preferences and API access.
          </p>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-boxed bg-base-200/50 p-1 mb-8 w-fit">
        <a
          role="tab"
          className={`tab px-6 ${activeTab === 'general' ? 'tab-active shadow-md' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Key size={16} className="mr-2" />
          General
        </a>
        <a
          role="tab"
          className={`tab px-6 ${activeTab === 'billing' ? 'tab-active shadow-md' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          <CreditCard size={16} className="mr-2" />
          Billing
        </a>
      </div>

      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200">
        {activeTab === 'general' ? (
          <div className="p-8">
            {/* Account Section */}
            <div className="bg-base-50 rounded-xl p-6 border border-base-200 mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Account
              </h3>

              {loadingUser ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-sm text-primary"></span>
                </div>
              ) : user ? (
                <div className="space-y-4">
                  <div className="form-control w-full max-w-md">
                    <label className="label">
                      <span className="label-text">Email Address</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={user.email}
                        readOnly
                        className="input input-bordered w-full pl-10 bg-base-200/50 text-base-content/70"
                      />
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                      />
                    </div>
                  </div>

                  <div className="form-control w-full max-w-md">
                    <label className="label">
                      <span className="label-text">Password</span>
                    </label>

                    {!showPasswordForm ? (
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={hasPassword ? '••••••••' : 'Not set'}
                            readOnly
                            className="input input-bordered w-full pl-10 bg-base-200/50 text-base-content/70"
                          />
                          <Lock
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                          />
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setShowPasswordForm(true);
                            setPasswordMessage(null);
                          }}
                        >
                          {hasPassword ? 'Change Password' : 'Set Password'}
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleUpdatePassword}
                        className="bg-base-100 p-4 rounded-lg border border-base-200"
                      >
                        <div className="form-control mb-4">
                          <label className="label cursor-pointer justify-start gap-2">
                            <span className="label-text font-medium">New Password</span>
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input input-bordered"
                            placeholder="Enter new password"
                            minLength={6}
                            required
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={updatingPassword}
                          >
                            {updatingPassword ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              'Save Password'
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setNewPassword('');
                              setPasswordMessage(null);
                            }}
                            disabled={updatingPassword}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {passwordMessage && (
                      <div
                        className={`alert ${passwordMessage.type === 'success' ? 'alert-success' : 'alert-error'} mt-4 py-2 text-sm shadow-sm`}
                      >
                        {passwordMessage.type === 'success' ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span>{passwordMessage.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div role="alert" className="alert alert-warning">
                  <XCircle size={24} />
                  <span>Unable to load user information.</span>
                </div>
              )}
            </div>

            <div className="bg-base-50 rounded-xl p-6 border border-base-200 mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Key size={20} className="text-primary" />
                Create New API Key
              </h3>
              <form onSubmit={handleCreateKey} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Key name (e.g., CI Server)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="input input-bordered input-sm flex-1 h-10"
                  disabled={createMutation.isPending}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm h-10 px-6"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Key'}
                </button>
              </form>

              {createdKey && (
                <div role="alert" className="alert alert-success mt-4 shadow-sm">
                  <CheckCircle2 size={24} />
                  <div>
                    <h3 className="font-bold">API key created!</h3>
                    <div className="text-xs">Copy it now - you won't see it again.</div>
                    <div className="mt-2 text-sm bg-base-100 p-3 rounded-lg border border-success/20 font-mono select-all flex justify-between items-center">
                      {createdKey}
                      <button className="btn btn-ghost btn-xs btn-square">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {createMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  <XCircle size={24} />
                  <span>Failed to create API key: {createMutation.error?.message}</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Your API Keys</h3>

              {isLoading ? (
                <div className="flex justify-center p-8">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-base-200 rounded-xl">
                  <Key size={32} className="mx-auto text-base-content/20 mb-2" />
                  <p className="text-base-content/60 italic">No API keys yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-base-200 rounded-xl">
                  <table className="table">
                    <thead className="bg-base-200/50">
                      <tr>
                        <th>Name</th>
                        <th>Key Prefix</th>
                        <th>Created</th>
                        <th>Last Used</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((key) => (
                        <tr key={key.id} className="hover">
                          <td className="font-medium">{key.name}</td>
                          <td className="font-mono text-xs opacity-70">{key.key_prefix}...</td>
                          <td className="text-base-content/70 text-sm">
                            {new Date(key.created_at).toLocaleDateString()}
                          </td>
                          <td className="text-base-content/70 text-sm">
                            {key.last_used_at
                              ? new Date(key.last_used_at).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="text-right">
                            <button
                              className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                              onClick={() => handleDeleteKey(key.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Terminal size={20} className="text-primary" />
                CLI Configuration
              </h3>
              <p className="text-base-content/70 mb-4 text-sm">
                Add this to your CLI config file to authenticate your runner:
              </p>
              <div className="mockup-code text-sm bg-base-900 border border-base-content/10">
                <pre data-prefix="$">
                  <code>cat ~/.alloy/config.toml</code>
                </pre>
                <pre className="text-success">
                  <code>
                    {`      
        orchestrator_url = "${window.location.origin}"
        api_key = "your-api-key-here"`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <BillingSettings />
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
