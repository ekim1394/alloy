import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Settings, FileText, LogOut, HardDrive } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../assets/logo.png'

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
      <div className="menu p-4 min-h-full bg-base-200 text-base-content flex flex-col border-r border-base-300">
        <div className="mb-8 px-2">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={Logo} alt="Alloy Logo" className="w-8 h-8 object-contain" />
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
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className={isActive('/settings') ? 'active' : ''}
            >
              <Settings size={20} />
              Settings
            </Link>
          </li>
        </ul>

        <div className="mt-auto pt-8">
          <ul className="menu p-0 gap-2">
            <li>
              <a href="https://github.com/ekim1394/alloy/tree/main/docs" target="_blank" rel="noopener noreferrer">
                <FileText size={20} />
                Documentation
              </a>
            </li>
            {user && (
               <li>
                <button onClick={onSignOut} className="text-error hover:bg-error/10">
                  <LogOut size={20} />
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
