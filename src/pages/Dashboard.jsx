import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  UserRoundCheck,
} from 'lucide-react';
import { getDashboardData } from '../api/dashboard.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Loader from '../components/ui/Loader.jsx';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function getStatusBadge(status) {
  const s = String(status || 'draft').toLowerCase().replace(/_/g, ' ');
  if (s === 'approved' || s === 'ready for submission') {
    return <span className="modern-badge badge-approved">Approved</span>;
  }
  if (s === 'under review') {
    return <span className="modern-badge badge-under-review">Under Review</span>;
  }
  if (s === 'requested changes' || s === 'issues found' || s === 'rejected') {
    return <span className="modern-badge badge-rejected">Rejected</span>;
  }
  if (s === 'submitted') {
    return <span className="modern-badge badge-submitted">Submitted</span>;
  }
  return <span className="modern-badge badge-draft">Draft</span>;
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');

    getDashboardData()
      .then((data) => {
        if (isCurrent) setDashboard(data);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const applications = dashboard?.applications ?? [];

  // Metrics computation matching screenshot: Total Applications, Draft, Under Review, Approved
  const totalCount = applications.length;
  const draftCount = applications.filter((a) => (a.status || '').toLowerCase() === 'draft').length;
  const underReviewCount = applications.filter(
    (a) => (a.status || '').toLowerCase() === 'under_review' || (a.status || '').toLowerCase() === 'submitted'
  ).length;
  const approvedCount = applications.filter(
    (a) => (a.status || '').toLowerCase() === 'approved'
  ).length;

  return (
    <div className="modern-dashboard-layout">
      {/* Top Welcome Title & Primary Action */}
      <div className="dashboard-title-bar">
        <div>
          <h1 className="dashboard-page-title">Dashboard</h1>
          <p className="dashboard-page-desc">Manage your applications and ensure AICTE compliance</p>
        </div>
        <Link to="/applications/new" className="modern-primary-action-btn">
          <Plus size={18} />
          <span>New Application</span>
        </Link>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="metric-cards-grid">
        {/* Total Applications */}
        <div className="metric-card border-blue-accent">
          <div className="metric-card-header">
            <span className="metric-icon-box text-blue">
              <FileText size={18} />
            </span>
            <span className="metric-card-label">Total Applications</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-value">{totalCount}</span>
            <span className="metric-subtext text-emerald-green">+2 this month</span>
          </div>
        </div>

        {/* Draft */}
        <div className="metric-card border-amber-accent">
          <div className="metric-card-header">
            <span className="metric-icon-box text-amber">
              <Clock3 size={18} />
            </span>
            <span className="metric-card-label">Draft</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-value">{draftCount}</span>
            <span className="metric-subtext text-muted">Not submitted</span>
          </div>
        </div>

        {/* Under Review */}
        <div className="metric-card border-purple-accent">
          <div className="metric-card-header">
            <span className="metric-icon-box text-purple">
              <UserRoundCheck size={18} />
            </span>
            <span className="metric-card-label">Under Review</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-value">{underReviewCount}</span>
            <span className="metric-subtext text-muted">With AICTE</span>
          </div>
        </div>

        {/* Approved */}
        <div className="metric-card border-green-accent">
          <div className="metric-card-header">
            <span className="metric-icon-box text-green">
              <CheckCircle2 size={18} />
            </span>
            <span className="metric-card-label">Approved</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-value">{approvedCount}</span>
            <span className="metric-subtext text-muted">Successfully approved</span>
          </div>
        </div>
      </div>

      {/* Recent Applications Card Table */}
      <div className="modern-table-card">
        <div className="table-card-header">
          <h2 className="table-card-title">Recent Applications</h2>
          <Link to="/applications" className="table-card-view-all">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Application ID</th>
                <th>Programme</th>
                <th>Institution</th>
                <th>Status</th>
                <th>Submitted On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No applications created yet. Click "+ New Application" to begin.
                  </td>
                </tr>
              ) : (
                applications.slice(0, 7).map((app, index) => {
                  const appIdStr = `APP-2026-000${app.id}`;
                  const programme = app.application_type || app.applicationType || 'Extension of Approval';
                  const inst = app.institution_name || app.institution || app.institutionName || '—';
                  const isDraft = (app.status || '').toLowerCase() === 'draft';

                  return (
                    <tr key={app.id}>
                      <td className="text-muted">{index + 1}</td>
                      <td>
                        <Link to={`/applications/${app.id}`} className="app-id-code">
                          {appIdStr}
                        </Link>
                      </td>
                      <td>{programme}</td>
                      <td>{inst}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{formatDate(app.submittedAt || app.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={isDraft ? `/applications/${app.id}` : `/applications/${app.id}`}
                          className="action-link-arrow"
                        >
                          <span>{isDraft ? 'Edit' : 'View'}</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
