import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Settings from './pages/Settings'
import JobDetail from './pages/JobDetail'
import Landing from './pages/Landing'

function NavBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">⚡ Alloy</Link>
      </div>
      <div className="nav-links">
        <Link to="/">Jobs</Link>
        {user ? (
          <>
            <Link to="/settings">Settings</Link>
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
      </div>
    </nav>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card">Loading...</div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  if (!user) {
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

  // Authenticated view
  return (
    <div className="app">
      <NavBar />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Dashboard />} />
          <Route path="/signup" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
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
