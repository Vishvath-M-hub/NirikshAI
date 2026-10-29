import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import NotificationsModal from './NotificationsModal.jsx';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  function toggleSidebar() {
    if (window.matchMedia('(max-width: 760px)').matches) {
      setMobileOpen((isOpen) => !isOpen);
    } else {
      setCollapsed((isCollapsed) => !isCollapsed);
    }
  }

  return (
    <div className="nirikshai-app-shell">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onOpenNotifications={() => setNotifOpen(true)}
      />
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="nirikshai-main-container">
        <Header
          onMenuClick={toggleSidebar}
          onOpenNotifications={() => setNotifOpen(true)}
        />
        <main className="nirikshai-page-body">
          <Outlet />
        </main>
      </div>

      <NotificationsModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
