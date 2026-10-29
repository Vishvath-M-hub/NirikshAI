import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FilePlus2,
  FileText,
  Filter,
  Plus,
  Search,
} from 'lucide-react';
import { getApplications } from '../api/applications.js';

function formatDate(value) {
  if (!value) return 'Not submitted';
  const cleanDate = value.includes('T') ? value.split('T')[0] : value;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${cleanDate}T00:00:00`));
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

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');

    getApplications()
      .then((data) => {
        if (isCurrent) setApplications(data || []);
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

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return applications.filter((application) => {
      const instName = String(application.institution || application.institution_name || application.institutionName || '').toLocaleLowerCase();
      const appIdStr = String(application.id ?? '').toLocaleLowerCase();
      const instCode = String(application.institutionCode || application.institution_code || '').toLocaleLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        instName.includes(normalizedSearch) ||
        appIdStr.includes(normalizedSearch) ||
        instCode.includes(normalizedSearch);

      const appStatus = String(application.status || '').toLowerCase().replace(/_/g, ' ');
      const filterStatus = statusFilter.toLowerCase().replace(/_/g, ' ');
      const matchesStatus =
        statusFilter === 'All statuses' ||
        appStatus === filterStatus ||
        application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  return (
    <div className="modern-dashboard-layout">
      {/* Title & Action Bar */}
      <div className="dashboard-title-bar">
        <div>
          <h1 className="dashboard-page-title">Applications</h1>
          <p className="dashboard-page-desc">Review and manage institution applications in your workspace</p>
        </div>
        <Link to="/applications/new" className="modern-primary-action-btn">
          <Plus size={18} />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="table-filter-search-bar">
        <div className="search-input-pill">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search by institution name, code, or application ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="modern-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All statuses">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
            {filteredApplications.length} of {applications.length} applications
          </span>
        </div>
      </div>

      {/* Modern Data Card Table */}
      <div className="modern-table-card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            Loading applications…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#dc2626' }}>
            {error}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="modern-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Application ID</th>
                  <th>Institution</th>
                  <th>Institution Code</th>
                  <th>Submitted Date</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No matching applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app, index) => {
                    const appIdStr = `APP-2026-000${app.id}`;
                    const inst = app.institution_name || app.institution || '—';
                    const code = app.institution_code || app.institutionCode || '—';
                    const docCount = app.document_count ?? app.documents?.length ?? 0;
                    const dateStr = formatDate(app.submitted_at || app.submittedAt || app.created_at || app.createdAt);

                    return (
                      <tr key={app.id}>
                        <td className="text-muted">{index + 1}</td>
                        <td>
                          <Link to={`/applications/${app.id}`} className="app-id-code">
                            {appIdStr}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{inst}</td>
                        <td className="text-muted">{code}</td>
                        <td>{dateStr}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>
                            {docCount} {docCount === 1 ? 'doc' : 'docs'}
                          </span>
                        </td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/applications/${app.id}`} className="action-link-arrow">
                            <span>View</span>
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
        )}
      </div>
    </div>
  );
}
