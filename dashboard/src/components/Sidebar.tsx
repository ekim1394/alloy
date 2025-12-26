import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  onSignOut: () => void
}

function Sidebar({ onSignOut }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  
  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <span className="sidebar-logo-icon">⚡</span>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">Alloy</span>
            <span className="sidebar-logo-subtitle">CI/CD RUNNER</span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <Link 
          to="/" 
          className={`sidebar-nav-item ${isActive('/') ? 'active' : ''}`}
        >
          <span className="sidebar-nav-icon">📊</span>
          Dashboard
        </Link>
        <Link 
          to="/agents" 
          className={`sidebar-nav-item ${isActive('/agents') ? 'active' : ''}`}
        >
          <span className="sidebar-nav-icon">🖥️</span>
          Agents
        </Link>
        <Link 
          to="/history" 
          className={`sidebar-nav-item ${isActive('/history') ? 'active' : ''}`}
        >
          <span className="sidebar-nav-icon">🕐</span>
          Build History
        </Link>
        <Link 
          to="/settings" 
          className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
        >
          <span className="sidebar-nav-icon">⚙️</span>
          Settings
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-storage">
          <div className="storage-label">
            <span>Storage</span>
            <span className="storage-percent">78%</span>
          </div>
          <div className="storage-bar">
            <div className="storage-fill" style={{ width: '78%' }}></div>
          </div>
        </div>

        <Link to="/docs" className="sidebar-nav-item">
          <span className="sidebar-nav-icon">📄</span>
          Documentation
        </Link>

        {user && (
          <button className="sidebar-signout" onClick={onSignOut}>
            Sign out
          </button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
