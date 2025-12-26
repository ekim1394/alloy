import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../lib/supabase'

function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-[400px] mx-auto mt-16">
        <div className="card bg-base-100 shadow-xl border border-base-200 text-center">
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold mb-4 text-success">✓ Check your email</h2>
            <p className="text-base-content/60 mb-6">
              We've sent a confirmation link to <strong>{email}</strong>
            </p>
            <button 
              className="btn btn-outline w-full"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[400px] mx-auto mt-16">
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Create your account</h2>
        
          {error && (
            <div className="alert alert-error mb-4 text-sm py-3 text-white">
              <span>{error}</span>
            </div>
          )}
  
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-base-content/60">Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </div>
  
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-base-content/60">Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input input-bordered w-full"
              />
            </div>
  
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-base-content/60">Confirm Password</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </div>
  
            <button 
              type="submit" 
              className="btn btn-primary w-full mt-2" 
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Create account'}
            </button>
          </form>
  
          <div className="mt-6 text-center text-sm text-base-content/60">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary no-underline hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
