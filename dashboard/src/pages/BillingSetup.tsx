import { useState } from 'react';
import { createCheckoutSession } from '../lib/api';

export default function BillingSetup() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelectPlan(plan: 'pro' | 'team') {
    try {
      setLoading(plan);
      setError(null);
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(null);
    }
  }

  return (
    <div className="max-w-[700px] mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Alloy! 🎉</h1>
        <p className="text-lg text-base-content/80 mb-2">
          Start your <strong>7-day free trial</strong> to run macOS CI jobs on your own hardware.
        </p>
        <p className="text-sm text-base-content/60">
          Add a payment method to get started. You won't be charged until your trial ends.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6 text-white text-center">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro Plan */}
        <div className="card bg-base-100 border-2 border-primary relative overflow-hidden shadow-xl">
          <div className="absolute top-5 -right-8 bg-primary text-primary-content py-1 px-10 text-xs font-bold rotate-45 shadow-sm">
            POPULAR
          </div>

          <div className="card-body p-6">
            <h3 className="card-title text-xl">Pro</h3>
            <p className="text-4xl font-bold my-2">
              $20<span className="text-base font-normal text-base-content/60">/month</span>
            </p>

            <ul className="space-y-3 my-6 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="font-bold">300 minutes</span> included per month
              </li>
              <li className="flex gap-2">Overage billed at $0.05/min</li>
              <li className="flex gap-2">Real-time log streaming</li>
              <li className="flex gap-2">Artifact collection</li>
              <li className="flex gap-2">
                <span className="text-success font-bold">✓</span> 7-day free trial
              </li>
            </ul>

            <button
              className="btn btn-primary w-full"
              onClick={() => handleSelectPlan('pro')}
              disabled={loading !== null}
            >
              {loading === 'pro' ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Start Free Trial'
              )}
            </button>
          </div>
        </div>

        {/* Team Plan */}
        <div className="card bg-base-100 border border-base-200 shadow-xl">
          <div className="card-body p-6">
            <h3 className="card-title text-xl">Team</h3>
            <p className="text-4xl font-bold my-2">
              $200<span className="text-base font-normal text-base-content/60">/month</span>
            </p>

            <ul className="space-y-3 my-6 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="font-bold">Unlimited minutes</span>
              </li>
              <li className="flex gap-2">No overage charges ever</li>
              <li className="flex gap-2">Priority support</li>
              <li className="flex gap-2">Team collaboration features</li>
              <li className="flex gap-2">
                <span className="text-success font-bold">✓</span> 7-day free trial
              </li>
            </ul>

            <button
              className="btn btn-primary w-full"
              onClick={() => handleSelectPlan('team')}
              disabled={loading !== null}
            >
              {loading === 'team' ? (
                <span className="loading loading-spinner"></span>
              ) : (
                'Start Free Trial'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-xs text-base-content/60 space-y-1">
        <p>🔒 Secure checkout powered by Stripe</p>
        <p>Cancel anytime during your trial period — no questions asked.</p>
      </div>
    </div>
  );
}
