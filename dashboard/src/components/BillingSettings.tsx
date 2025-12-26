import { useState, useEffect } from 'react'
import { fetchSubscription, createCheckoutSession, createPortalSession } from '../lib/api'
import type { Subscription } from '../types'

export default function BillingSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  async function loadSubscription() {
    try {
      setLoading(true)
      const sub = await fetchSubscription()
      setSubscription(sub)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(plan: 'pro' | 'team') {
    try {
      setCheckoutLoading(plan)
      const { url } = await createCheckoutSession(plan)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setCheckoutLoading(null)
    }
  }

  async function handleManageSubscription() {
    try {
      setCheckoutLoading('portal')
      const { url } = await createPortalSession()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal')
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p>Loading subscription...</p>
      </div>
    )
  }

  const isTrialing = subscription?.status === 'trialing'
  const isActive = subscription?.status === 'active'
  const isPastDue = subscription?.status === 'past_due'
  const isCanceled = subscription?.status === 'canceled'
  
  const trialDaysLeft = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const usagePercent = subscription 
    ? Math.min(100, (subscription.minutes_used / subscription.minutes_included) * 100)
    : 0

  return (
    <div>
      {error && (
        <div className="card" style={{ background: 'var(--error)', marginBottom: '1rem' }}>
          <p style={{ color: 'white', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Current Plan</h2>
        
        {subscription ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {subscription.plan}
              </span>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px',
                background: isActive ? 'var(--success)' : isTrialing ? 'var(--warning)' : isPastDue ? 'var(--error)' : 'var(--text-muted)',
                color: 'white'
              }}>
                {subscription.status}
              </span>
            </div>

            {isTrialing && (
              <p style={{ color: 'var(--warning)', margin: '0.5rem 0' }}>
                ⏱️ Trial ends in {trialDaysLeft} days
              </p>
            )}

            {isPastDue && (
              <p style={{ color: 'var(--error)', margin: '0.5rem 0' }}>
                ⚠️ Payment past due - please update your payment method
              </p>
            )}

            {/* Usage Bar */}
            {subscription.plan === 'pro' && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Usage</span>
                  <span>{subscription.minutes_used.toFixed(1)} / {subscription.minutes_included} min</span>
                </div>
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '4px', 
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    background: usagePercent > 90 ? 'var(--error)' : usagePercent > 70 ? 'var(--warning)' : 'var(--success)',
                    width: `${usagePercent}%`,
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {usagePercent >= 100 && (
                  <p style={{ color: 'var(--warning)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Overage will be billed automatically via Stripe
                  </p>
                )}
              </div>
            )}

            {subscription.plan === 'team' && (
              <p style={{ color: 'var(--success)', marginTop: '1rem' }}>
                ✓ Unlimited minutes included
              </p>
            )}

            {(isActive || isTrialing) && subscription.stripe_customer_id && (
              <button 
                className="btn" 
                onClick={handleManageSubscription}
                disabled={checkoutLoading !== null}
                style={{ marginTop: '1rem' }}
              >
                {checkoutLoading === 'portal' ? 'Opening...' : 'Manage Subscription'}
              </button>
            )}
          </>
        ) : (
          <p>No subscription found. Choose a plan below to get started.</p>
        )}
      </div>

      {/* Plans */}
      <h2 style={{ marginTop: '2rem' }}>Available Plans</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        
        {/* Pro Plan */}
        <div className="card" style={{ 
          border: subscription?.plan === 'pro' ? '2px solid var(--primary)' : undefined
        }}>
          <h3 style={{ marginTop: 0 }}>Pro</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            $20<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span>
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '1rem 0' }}>
            <li>300 minutes included</li>
            <li>Overage billed automatically</li>
            <li>7-day free trial</li>
          </ul>
          {subscription?.plan !== 'pro' && (
            <button 
              className="btn btn-primary" 
              onClick={() => handleUpgrade('pro')}
              disabled={checkoutLoading !== null}
              style={{ width: '100%' }}
            >
              {checkoutLoading === 'pro' ? 'Loading...' : 'Start Pro Trial'}
            </button>
          )}
          {subscription?.plan === 'pro' && (
            <p style={{ color: 'var(--primary)', textAlign: 'center', margin: 0 }}>
              ✓ Current Plan
            </p>
          )}
        </div>

        {/* Team Plan */}
        <div className="card" style={{ 
          border: subscription?.plan === 'team' ? '2px solid var(--primary)' : undefined
        }}>
          <h3 style={{ marginTop: 0 }}>Team</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            $200<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span>
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '1rem 0' }}>
            <li>Unlimited minutes</li>
            <li>Priority support</li>
            <li>7-day free trial</li>
          </ul>
          {subscription?.plan !== 'team' && (
            <button 
              className="btn btn-primary" 
              onClick={() => handleUpgrade('team')}
              disabled={checkoutLoading !== null}
              style={{ width: '100%' }}
            >
              {checkoutLoading === 'team' ? 'Loading...' : subscription?.plan === 'pro' ? 'Upgrade to Team' : 'Start Team Trial'}
            </button>
          )}
          {subscription?.plan === 'team' && (
            <p style={{ color: 'var(--primary)', textAlign: 'center', margin: 0 }}>
              ✓ Current Plan
            </p>
          )}
        </div>
      </div>

      {/* Cancel notice */}
      {isCanceled && (
        <div className="card" style={{ marginTop: '1.5rem', background: 'var(--bg-secondary)' }}>
          <p style={{ margin: 0 }}>
            Your subscription has been canceled. Choose a plan above to resubscribe.
          </p>
        </div>
      )}
    </div>
  )
}
