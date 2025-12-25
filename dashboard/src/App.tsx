import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Settings from './pages/Settings'
import JobDetail from './pages/JobDetail'

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
  return (
    <div className="app">
      <NavBar />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
