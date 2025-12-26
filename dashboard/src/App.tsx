import { useState, useLayoutEffect } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Settings from './pages/Settings'
import BillingSetup from './pages/BillingSetup'
import JobDetail from './pages/JobDetail'
import Landing from './pages/Landing'
import RawMarkdownPage from './components/RawMarkdownPage'
import Sidebar from './components/Sidebar'
import termsContent from './assets/terms.md?raw'
import privacyContent from './assets/privacy.md?raw'
import { fetchSubscription } from './lib/api'
import type { Subscription } from './types'

// Determine which "mode" based on hostname
function getHostMode(): 'landing' | 'app' | 'local' {
  const hostname = window.location.hostname
  
  if (hostname === 'alloy-ci.dev' || hostname === 'www.alloy-ci.dev') {
    return 'landing'
  }
  if (hostname === 'app.alloy-ci.dev') {
    return 'app'
  }
  // Local development or other domains
  return 'local'
}

function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const hostMode = getHostMode()

  const handleSignOut = async () => {
    await signOut()
    if (hostMode === 'app') {
      // Redirect to main landing site after signout
      window.location.href = 'https://alloy-ci.dev'
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="navbar bg-base-100 border-b border-base-200">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl font-bold">⚡ Alloy</Link>
      </div>
      <div className="navbar-end gap-2">
        {hostMode === 'landing' ? (
          // On landing site, show link to app
          <>
            <a href="https://app.alloy-ci.dev" className="btn btn-ghost">Dashboard</a>
            <a href="https://app.alloy-ci.dev/login" className="btn btn-primary">Sign in</a>
          </>
        ) : (
          // On app or local, show normal nav
          <>
            <Link to="/" className="btn btn-ghost">Jobs</Link>
            {user ? (
              <>
                <Link to="/settings" className="btn btn-ghost">Settings</Link>
                <Link to="/settings?tab=billing" className="btn btn-ghost">Billing</Link>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">Sign in</Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const hostMode = getHostMode()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subLoading, setSubLoading] = useState(true)

  // Load subscription when user is authenticated
  useLayoutEffect(() => {
    if (user) {
      setSubLoading(true)
      fetchSubscription()
        .then(setSubscription)
        .catch(console.error)
        .finally(() => setSubLoading(false))
    } else {
      setSubLoading(false)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    if (hostMode === 'app') {
      window.location.href = 'https://alloy-ci.dev'
    } else {
      navigate('/login')
    }
  }

  // Show loading state while checking auth
  if (loading || (user && subLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/70 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Landing mode (alloy-ci.dev) - always show landing page
  if (hostMode === 'landing') {
    return (
      <div className="app">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/terms" element={<RawMarkdownPage content={termsContent} title="Terms of Service" />} />
          <Route path="/privacy" element={<RawMarkdownPage content={privacyContent} title="Privacy Policy" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    )
  }

  // App mode (app.alloy-ci.dev) - require authentication
  if (hostMode === 'app' && !user) {
    return (
      <div className="app">
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    )
  }

  // Local mode - show landing for unauthenticated users (original behavior)
  if (hostMode === 'local' && !user) {
    return (
      <div className="app">
        <Routes>
          <Route path="/login" element={<><NavBar /><main className="main-content"><Login /></main></>} />
          <Route path="/signup" element={<><NavBar /><main className="main-content"><Signup /></main></>} />
          <Route path="/terms" element={<RawMarkdownPage content={termsContent} title="Terms of Service" />} />
          <Route path="/privacy" element={<RawMarkdownPage content={privacyContent} title="Privacy Policy" />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>
    )
  }

  // Authenticated user without billing setup - show billing onboarding
  const needsBillingSetup = user && !subscription?.stripe_customer_id

  if (needsBillingSetup) {
    return (
      <div className="app">
        <NavBar />
        <main className="main-content">
          <BillingSetup />
        </main>
      </div>
    )
  }

  // Authenticated view with sidebar layout
  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-100">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        {/* Mobile header */}
        <div className="w-full navbar bg-base-100 lg:hidden border-b border-base-200">
          <div className="flex-none">
            <label htmlFor="my-drawer-2" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 font-bold text-xl">Alloy</div>
        </div>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Dashboard />} />
            <Route path="/signup" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
          </Routes>
        </main>
      </div> 
      <Sidebar onSignOut={handleSignOut} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
