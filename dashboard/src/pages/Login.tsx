import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, signInWithGitHub } from '../lib/supabase';
import GithubIcon from '../components/GithubIcon';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    const { error } = await signInWithGitHub();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Redirect handled by Supabase
  };

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

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : 'Sign in'}
            </button>
          </form>

          <div className="mt-6">
            <button
              className="btn btn-outline w-full gap-2"
              onClick={handleGitHubLogin}
              disabled={loading}
            >
              <GithubIcon />
              Sign in with GitHub
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-base-content/60">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="link link-primary no-underline hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
