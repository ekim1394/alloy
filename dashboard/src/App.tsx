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
import Sidebar from './components/Sidebar'
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
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">⚡ Alloy</Link>
      </div>
      <div className="nav-links">
        {hostMode === 'landing' ? (
          // On landing site, show link to app
          <>
            <a href="https://app.alloy-ci.dev">Dashboard</a>
            <a href="https://app.alloy-ci.dev/login">Sign in</a>
          </>
        ) : (
          // On app or local, show normal nav
          <>
            <Link to="/">Jobs</Link>
            {user ? (
              <>
                <Link to="/settings">Settings</Link>
                <Link to="/settings?tab=billing">Billing</Link>
                <button 
                  className="btn" 
                  onClick={handleSignOut}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </>
        )}
      </div>
    </nav>
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
      <div className="app loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Landing mode (alloy-ci.dev) - always show landing page
  if (hostMode === 'landing') {
    return (
      <div className="app">
        <Landing />
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
    <div className="app app-with-sidebar">
      <Sidebar onSignOut={handleSignOut} />
      
      <main className="main-content-sidebar">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Dashboard />} />
          <Route path="/signup" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/agents" element={<div className="page-placeholder"><h2>Agents</h2><p className="placeholder-text">Agent management coming soon...</p></div>} />
          <Route path="/history" element={<div className="page-placeholder"><h2>Build History</h2><p className="placeholder-text">Build history coming soon...</p></div>} />
        </Routes>
      </main>
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
