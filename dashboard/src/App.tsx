import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Settings from './pages/Settings'
import Billing from './pages/Billing'
import JobDetail from './pages/JobDetail'
import Landing from './pages/Landing'

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
                <Link to="/billing">Billing</Link>
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
  const { user, loading } = useAuth()
  const hostMode = getHostMode()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card">Loading...</div>
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

  // Authenticated view (app mode or local with user)
  return (
    <div className="app">
      <NavBar />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Dashboard />} />
          <Route path="/signup" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
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
