import { useState, useEffect } from 'react';
import { fetchSubscription, createCheckoutSession, createPortalSession } from '../lib/api';
import type { Subscription } from '../types';

export default function BillingSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      setLoading(true);
      const sub = await fetchSubscription();
      setSubscription(sub);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan: 'pro' | 'team') {
    try {
      setCheckoutLoading(plan);
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setCheckoutLoading(null);
    }
  }

  async function handleManageSubscription() {
    try {
      setCheckoutLoading('portal');
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal');
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-sm p-4">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      </div>
    );
  }

  const isTrialing = subscription?.status === 'trialing';
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceled = subscription?.status === 'canceled';

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const usagePercent = subscription
    ? Math.min(100, (subscription.minutes_used / subscription.minutes_included) * 100)
    : 0;

  return (
    <div>
      {error && (
        <div role="alert" className="alert alert-error mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="card bg-base-100 shadow-sm border border-base-200 mb-8">
        <div className="card-body">
          <h2 className="card-title mb-2">Current Plan</h2>

          {subscription ? (
            <>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold uppercase tracking-wide">
                  {subscription.plan}
                </span>
                <div
                  className={`badge ${isActive ? 'badge-success' : isTrialing ? 'badge-warning' : isPastDue ? 'badge-error' : 'badge-ghost'} text-white`}
                >
                  {subscription.status}
                </div>
              </div>

              {isTrialing && (
                <div className="text-warning font-medium flex items-center gap-2 my-2">
                  <span>⏱️</span> Trial ends in {trialDaysLeft} days
                </div>
              )}

              {isPastDue && (
                <div className="text-error font-medium flex items-center gap-2 my-2">
                  <span>⚠️</span> Payment past due - please update your payment method
                </div>
              )}

              {/* Usage Bar */}
              {subscription.plan === 'pro' && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span>Usage</span>
                    <span>
                      {subscription.minutes_used.toFixed(1)} / {subscription.minutes_included} min
                    </span>
                  </div>
                  <progress
                    className={`progress w-full ${usagePercent > 90 ? 'progress-error' : usagePercent > 70 ? 'progress-warning' : 'progress-success'}`}
                    value={usagePercent}
                    max="100"
                  ></progress>
                  {usagePercent >= 100 && (
                    <p className="text-warning text-xs mt-1">
                      Overage will be billed automatically via Stripe
                    </p>
                  )}
                </div>
              )}

              {subscription.plan === 'team' && (
                <p className="text-success mt-4 font-medium flex items-center gap-2">
                  <span>✓</span> Unlimited minutes included
                </p>
              )}

              {(isActive || isTrialing) && subscription.stripe_customer_id && (
                <div className="card-actions mt-4">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleManageSubscription}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === 'portal' ? 'Opening...' : 'Manage Subscription'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>No subscription found. Choose a plan below to get started.</p>
          )}
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro Plan */}
        <div
          className={`card bg-base-100 shadow-xl border ${subscription?.plan === 'pro' ? 'border-primary' : 'border-base-200'}`}
        >
          <div className="card-body">
            <h3 className="card-title">Pro</h3>
            <div className="text-4xl font-bold my-2">
              $20<span className="text-lg font-normal text-base-content/60">/month</span>
            </div>
            <ul className="list-disc list-inside my-4 text-base-content/80 space-y-1">
              <li>300 minutes included</li>
              <li>Overage billed automatically</li>
              <li>7-day free trial</li>
            </ul>
            <div className="card-actions justify-end mt-auto">
              {subscription?.plan !== 'pro' && (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => handleUpgrade('pro')}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === 'pro' ? 'Loading...' : 'Start Pro Trial'}
                </button>
              )}
              {subscription?.plan === 'pro' && (
                <div className="w-full text-center text-primary font-bold py-2 bg-primary/10 rounded-btn">
                  ✓ Current Plan
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Plan */}
        <div
          className={`card bg-base-100 shadow-xl border ${subscription?.plan === 'team' ? 'border-primary' : 'border-base-200'}`}
        >
          <div className="card-body">
            <h3 className="card-title">Team</h3>
            <div className="text-4xl font-bold my-2">
              $200<span className="text-lg font-normal text-base-content/60">/month</span>
            </div>
            <ul className="list-disc list-inside my-4 text-base-content/80 space-y-1">
              <li>Unlimited minutes</li>
              <li>Priority support</li>
              <li>7-day free trial</li>
            </ul>
            <div className="card-actions justify-end mt-auto">
              {subscription?.plan !== 'team' && (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => handleUpgrade('team')}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === 'team'
                    ? 'Loading...'
                    : subscription?.plan === 'pro'
                      ? 'Upgrade to Team'
                      : 'Start Team Trial'}
                </button>
              )}
              {subscription?.plan === 'team' && (
                <div className="w-full text-center text-primary font-bold py-2 bg-primary/10 rounded-btn">
                  ✓ Current Plan
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel notice */}
      {isCanceled && (
        <div role="alert" className="alert alert-info mt-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>Your subscription has been canceled. Choose a plan above to resubscribe.</span>
        </div>
      )}
    </div>
  );
}
