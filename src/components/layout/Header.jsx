import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Header({ onMenuClick, onOpenNotifications }) {
  const { user } = useAuth();

  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  const roleDisplay = user?.role === 'aicte_official' ? 'Official' : 'Institution';

  return (
    <div className="top-navbar">
      <div className="top-navbar-left">
        <button className="navbar-menu-toggle" type="button" aria-label="Toggle navigation" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
      </div>

      <div className="top-navbar-right">
        <button
          className="navbar-notification-btn"
          type="button"
          aria-label="Notifications"
          onClick={onOpenNotifications}
        >
          <Bell size={18} />
          <span className="notification-badge-dot" />
        </button>

        <div className="user-profile-widget">
          <div className="user-avatar-circle">{initial}</div>
          <div className="user-profile-info">
            <span className="user-name">{user?.username || 'Guest'}</span>
            <span className="user-role-tag">{roleDisplay}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
