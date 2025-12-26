import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn, signInWithGitHub } from '../lib/supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  const handleGitHubLogin = async () => {
    setLoading(true)
    const { error } = await signInWithGitHub()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Redirect handled by Supabase
  }

  return (
    <div className="max-w-[400px] mx-auto mt-16">
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Sign in to Alloy</h2>
          
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
                className="input input-bordered w-full"
              />
            </div>
  
            <button 
              type="submit" 
              className="btn btn-primary w-full mt-2" 
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Sign in'}
            </button>
          </form>
  
          <div className="mt-6">
            <button 
              className="btn btn-outline w-full gap-2" 
              onClick={handleGitHubLogin}
              disabled={loading}
            >
              <svg height="20" width="20" aria-hidden="true" viewBox="0 0 16 16" version="1.1" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              Sign in with GitHub
            </button>
          </div>
  
          <div className="mt-6 text-center text-sm text-base-content/60">
            Don't have an account?{' '}
            <Link to="/signup" className="link link-primary no-underline hover:underline font-medium">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
