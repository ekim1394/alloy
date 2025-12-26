import { useState } from 'react'
import { createCheckoutSession } from '../lib/api'

interface Props {
  onComplete?: () => void
}

export default function BillingSetup({ onComplete }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSelectPlan(plan: 'pro' | 'team') {
    try {
      setLoading(plan)
      setError(null)
      const { url } = await createCheckoutSession(plan)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setLoading(null)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Welcome to Alloy! 🎉
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Start your <strong>7-day free trial</strong> to run macOS CI jobs on your own hardware.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Add a payment method to get started. You won't be charged until your trial ends.
        </p>
      </div>

      {error && (
        <div className="card" style={{ background: 'var(--error)', marginBottom: '1.5rem' }}>
          <p style={{ color: 'white', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Pro Plan */}
        <div className="card" style={{ 
          border: '2px solid var(--primary)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '-30px',
            background: 'var(--primary)',
            color: 'white',
            padding: '0.25rem 2rem',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            transform: 'rotate(45deg)',
          }}>
            POPULAR
          </div>
          
          <h3 style={{ marginTop: 0 }}>Pro</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            $20<span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/month</span>
          </p>
          
          <ul style={{ paddingLeft: '1.25rem', margin: '1.5rem 0', lineHeight: '1.8' }}>
            <li><strong>300 minutes</strong> included per month</li>
            <li>Overage billed at $0.05/min</li>
            <li>Real-time log streaming</li>
            <li>Artifact collection</li>
            <li><span style={{ color: 'var(--success)' }}>✓</span> 7-day free trial</li>
          </ul>
          
          <button 
            className="btn btn-primary" 
            onClick={() => handleSelectPlan('pro')}
            disabled={loading !== null}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading === 'pro' ? 'Redirecting to checkout...' : 'Start Free Trial'}
          </button>
        </div>

        {/* Team Plan */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Team</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            $200<span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/month</span>
          </p>
          
          <ul style={{ paddingLeft: '1.25rem', margin: '1.5rem 0', lineHeight: '1.8' }}>
            <li><strong>Unlimited minutes</strong></li>
            <li>No overage charges ever</li>
            <li>Priority support</li>
            <li>Team collaboration features</li>
            <li><span style={{ color: 'var(--success)' }}>✓</span> 7-day free trial</li>
          </ul>
          
          <button 
            className="btn btn-primary" 
            onClick={() => handleSelectPlan('team')}
            disabled={loading !== null}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading === 'team' ? 'Redirecting to checkout...' : 'Start Free Trial'}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p style={{ margin: '0.5rem 0' }}>
          🔒 Secure checkout powered by Stripe
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          Cancel anytime during your trial period — no questions asked.
        </p>
      </div>
    </div>
  )
}
