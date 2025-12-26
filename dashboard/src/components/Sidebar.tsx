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
    <aside className="drawer-side h-full z-20">
      <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label> 
      <div className="menu p-4 w-80 min-h-full bg-base-200 text-base-content flex flex-col">
        <div className="mb-8 px-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-bold text-xl tracking-tight">Alloy</div>
              <div className="text-[10px] font-bold tracking-widest opacity-50">CI/CD RUNNER</div>
            </div>
          </Link>
        </div>

        <ul className="menu text-base font-medium p-0 gap-2">
          <li>
            <Link 
              to="/" 
              className={isActive('/') ? 'active' : ''}
            >
              <span className="text-lg mr-1">📊</span>
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={isActive('/settings') ? 'active' : ''}
            >
              <span className="text-lg mr-1">⚙️</span>
              Settings
            </Link>
          </li>
        </ul>

        <div className="mt-auto pt-8">
          <div className="bg-base-300 rounded-lg p-4 mb-4">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>Storage</span>
              <span className="opacity-70">78%</span>
            </div>
            <progress className="progress progress-primary w-full" value="78" max="100"></progress>
          </div>

          <ul className="menu p-0 gap-2">
            <li>
              <a href="https://github.com/ekim1394/alloy/tree/main/docs" target="_blank" rel="noopener noreferrer">
                <span className="text-lg mr-1">📄</span>
                Documentation
              </a>
            </li>
            {user && (
               <li>
                <button onClick={onSignOut} className="text-error hover:bg-error/10">
                  <span className="text-lg mr-1">🚪</span>
                  Sign out
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
