import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getApplications } from '../api/applications.js';
import NotificationsModal from '../components/layout/NotificationsModal.jsx';

export default function AICTEDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setApplications(await getApplications());
    } catch (e) {
      setError(e.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = applications.filter((app) => {
    const matchesSearch =
      !searchTerm ||
      (app.institution_name || app.institution || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(app.id).includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || (app.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const total = applications.length;
  const pending = applications.filter((a) => (a.status || '').toLowerCase() === 'submitted' || (a.status || '').toLowerCase() === 'under_review').length;
  const approved = applications.filter((a) => (a.status || '').toLowerCase() === 'approved').length;
  const rejected = applications.filter((a) => (a.status || '').toLowerCase() === 'rejected').length;

  return (
    <div className="nirikshai-app-shell">
      {/* Official Left Sidebar */}
      <aside className="dark-sidebar">
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

        <nav className="dark-sidebar-nav">
          <Link to="/aicte-dashboard" className="dark-nav-item active">
            <LayoutDashboard size={18} strokeWidth={2} />
            <span className="nav-label">Dashboard</span>
          </Link>
          <Link to="/applications" className="dark-nav-item">
            <FileText size={18} strokeWidth={2} />
            <span className="nav-label">Applications</span>
          </Link>
          <Link to="/aicte-dashboard" className="dark-nav-item">
            <FileCheck2 size={18} strokeWidth={2} />
            <span className="nav-label">Review Queue</span>
          </Link>
          <button
            type="button"
            className="dark-nav-item"
            onClick={() => setNotifOpen(true)}
          >
            <Bell size={18} strokeWidth={2} />
            <span className="nav-label">Notifications</span>
            <span className="nav-red-dot" />
          </button>
        </nav>

        <div className="dark-sidebar-footer">
          <button
            type="button"
            className="dark-nav-item logout-button"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={18} strokeWidth={2} />
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Official Content Panel */}
      <div className="nirikshai-main-container">
        {/* Top Header */}
        <div className="top-navbar">
          <div className="top-navbar-left">
            <button className="navbar-menu-toggle" type="button" aria-label="Toggle navigation">
              <span style={{ fontSize: '1.25rem' }}>☰</span>
            </button>
          </div>
          <div className="top-navbar-right">
            <button
              className="navbar-notification-btn"
              type="button"
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={18} />
              <span className="notification-badge-dot" />
            </button>
            <div className="user-profile-widget">
              <div className="user-avatar-circle" style={{ background: '#7c3aed' }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="user-profile-info">
                <span className="user-name">{user?.username || 'official1'}</span>
                <span className="user-role-tag">AICTE Official</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Body */}
        <main className="nirikshai-page-body">
          <div className="dashboard-title-bar">
            <div>
              <h1 className="dashboard-page-title">Review Dashboard</h1>
              <p className="dashboard-page-desc">Applications submitted by Institutions for AICTE compliance</p>
            </div>
          </div>

          {/* 4 Official Stat Cards */}
          <div className="metric-cards-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="metric-card border-blue-accent">
              <div className="metric-card-header">
                <span className="metric-icon-box text-blue"><FileText size={18} /></span>
                <span className="metric-card-label">Total Applications</span>
              </div>
              <div className="metric-card-body">
                <span className="metric-value">{total || 12}</span>
              </div>
            </div>

            <div className="metric-card border-amber-accent">
              <div className="metric-card-header">
                <span className="metric-icon-box text-amber"><Clock3 size={18} /></span>
                <span className="metric-card-label">Pending Review</span>
              </div>
              <div className="metric-card-body">
                <span className="metric-value">{pending || 4}</span>
              </div>
            </div>

            <div className="metric-card border-green-accent">
              <div className="metric-card-header">
                <span className="metric-icon-box text-green"><CheckCircle2 size={18} /></span>
                <span className="metric-card-label">Approved</span>
              </div>
              <div className="metric-card-body">
                <span className="metric-value">{approved || 5}</span>
              </div>
            </div>

            <div className="metric-card border-red-accent" style={{ borderBottomColor: '#ef4444' }}>
              <div className="metric-card-header">
                <span className="metric-icon-box" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={18} /></span>
                <span className="metric-card-label">Rejected</span>
              </div>
              <div className="metric-card-body">
                <span className="metric-value">{rejected || 2}</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="table-filter-search-bar">
            <div className="search-input-pill">
              <Search size={16} className="text-muted" />
              <input
                type="text"
                placeholder="Search by institution name, application ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select
                className="modern-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Queue Table */}
          <div className="modern-table-card">
            <div className="table-responsive-wrapper">
              <table className="modern-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Application ID</th>
                    <th>Institution</th>
                    <th>Status</th>
                    <th>Submitted On</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        No applications matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((app, idx) => (
                      <tr key={app.id}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <Link to={`/aicte-review/${app.id}`} className="app-id-code">
                            APP-2026-000{app.id}
                          </Link>
                        </td>
                        <td>{app.institution_name || app.institution || app.institutionName || '—'}</td>
                        <td>
                          <span
                            className="modern-badge"
                            style={{
                              background: (app.status || '').toLowerCase() === 'approved' ? '#dcfce7' : (app.status || '').toLowerCase() === 'submitted' ? '#dbeafe' : '#fef3c7',
                              color: (app.status || '').toLowerCase() === 'approved' ? '#15803d' : (app.status || '').toLowerCase() === 'submitted' ? '#1d4ed8' : '#b45309',
                              textTransform: 'capitalize',
                            }}
                          >
                            ● {app.status?.replace(/_/g, ' ') || 'Submitted'}
                          </span>
                        </td>
                        <td>27 Oct 2026</td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/aicte-review/${app.id}`} className="action-link-arrow">
                            <span>Review</span>
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <NotificationsModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
