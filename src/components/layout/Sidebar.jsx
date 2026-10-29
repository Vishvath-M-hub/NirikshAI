import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  FileCheck2,
  FilePlus2,
  Files,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Sidebar({ collapsed, mobileOpen, onNavigate, onOpenNotifications }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
    onNavigate?.();
  }

  const isOfficial = user?.role === 'aicte_official';

  return (
    <aside className={`dark-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <div className="brand-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2.5" />
            <path d="M12 6v12M6 12h12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" fill="#f59e0b" />
          </svg>
        </div>
        <div className="brand-logo-text">
          <span className="brand-name-dark">Niriksh<span className="brand-name-accent">AI</span></span>
        </div>
      </div>

      {/* Nav Menu — Documents & Profile removed as requested */}
      <nav className="dark-sidebar-nav" aria-label="Main navigation">
        <NavLink
          to={isOfficial ? '/aicte-dashboard' : '/'}
          end
          title="Dashboard"
          className={({ isActive }) => `dark-nav-item${isActive ? ' active' : ''}`}
          onClick={onNavigate}
        >
          <LayoutDashboard size={18} strokeWidth={2} />
          <span className="nav-label">Dashboard</span>
        </NavLink>

        <NavLink
          to="/applications"
          end
          title="Applications"
          className={({ isActive }) => `dark-nav-item${isActive ? ' active' : ''}`}
          onClick={onNavigate}
        >
          <Files size={18} strokeWidth={2} />
          <span className="nav-label">Applications</span>
        </NavLink>

        {!isOfficial && (
          <NavLink
            to="/applications/new"
            title="New Application"
            className={({ isActive }) => `dark-nav-item${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            <FilePlus2 size={18} strokeWidth={2} />
            <span className="nav-label">New Application</span>
          </NavLink>
        )}

        <NavLink
          to="/ai-review"
          title="AI Review"
          className={({ isActive }) => `dark-nav-item${isActive ? ' active' : ''}`}
          onClick={onNavigate}
        >
          <Sparkles size={18} strokeWidth={2} />
          <span className="nav-label">AI Review</span>
        </NavLink>

        {/* Notifications Button */}
        <button
          type="button"
          className="dark-nav-item"
          title="Notifications"
          onClick={() => {
            onOpenNotifications?.();
            onNavigate?.();
          }}
        >
          <Bell size={18} strokeWidth={2} />
          <span className="nav-label">Notifications</span>
          <span className="nav-red-dot" />
        </button>
      </nav>

      {/* Footer / Sign out */}
      <div className="dark-sidebar-footer">
        {user ? (
          <button
            type="button"
            className="dark-nav-item logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} strokeWidth={2} />
            <span className="nav-label">Sign Out</span>
          </button>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) => `dark-nav-item${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            <LogIn size={18} strokeWidth={2} />
            <span className="nav-label">Sign In</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
