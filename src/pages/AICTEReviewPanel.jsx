import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApplicationById } from '../api/applications.js';
import { approveApplication, rejectApplication, requestCorrections } from '../api/auth.js';

const STATUS_STYLE = {
  submitted:    { bg: '#dbeafe', color: '#1d4ed8' },
  under_review: { bg: '#fef3c7', color: '#92400e' },
  approved:     { bg: '#d1fae5', color: '#065f46' },
  rejected:     { bg: '#fee2e2', color: '#991b1b' },
  draft:        { bg: '#f3f4f6', color: '#374151' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return <span style={{ ...s, padding: '0.25rem 0.7rem', borderRadius: 5, fontSize: '0.82rem', fontWeight: 700, textTransform: 'capitalize' }}>{status?.replace(/_/g, ' ')}</span>;
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>{value || '—'}</span>
    </div>
  );
}

export default function AICTEReviewPanel() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');       // 'approve' | 'reject' | 'corrections'
  const [reasonText, setReasonText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.role !== 'aicte_official') { navigate('/', { replace: true }); return; }
    load();
  }, [id]);

  async function load() {
    setLoading(true); setError('');
    try { setApp(await getApplicationById(id)); }
    catch (e) { setError(e.message || 'Failed to load.'); }
    finally { setLoading(false); }
  }

  async function handleDecision() {
    if (!action) return;
    if ((action === 'reject' || action === 'corrections') && !reasonText.trim()) {
      setError('Please provide a reason before confirming.'); return;
    }
    setSubmitting(true); setError(''); setSuccessMsg('');
    try {
      let result;
      if (action === 'approve') result = await approveApplication(id, user.token);
      else if (action === 'reject') result = await rejectApplication(id, reasonText, user.token);
      else result = await requestCorrections(id, reasonText, user.token);
      setApp(result);
      setSuccessMsg(`Application successfully ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged for corrections'}.`);
      setAction(''); setReasonText('');
    } catch (e) {
      setError(e.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b', fontSize: '1.1rem' }}>⏳ Loading application…</div>;
  if (error && !app) return <div style={{ padding: '2rem', color: '#dc2626', fontSize: '0.95rem' }}>❌ {error}</div>;

  const docs = app?.documents || [];
  const canDecide = ['submitted', 'under_review'].includes(app?.status);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', color: 'white', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <Link to="/aicte-dashboard" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.875rem' }}>← Dashboard</Link>
        <span style={{ opacity: 0.4 }}>|</span>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Review Application #{id}</h1>
        <StatusPill status={app?.status} />
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {successMsg && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '1rem', color: '#065f46', fontWeight: 600 }}>✅ {successMsg}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '1rem', color: '#dc2626' }}>⚠️ {error}</div>}

        {/* Application info card */}
        <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>Application Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            <InfoRow label="Application ID" value={`#${app?.id}`} />
            <InfoRow label="Status" value={<StatusPill status={app?.status} />} />
            <InfoRow label="Institution" value={app?.institution_name || app?.institution} />
            <InfoRow label="Institution Code" value={app?.institution_code || app?.institutionCode} />
            <InfoRow label="Type" value={app?.application_type} />
            <InfoRow label="Created" value={app?.created_at ? new Date(app.created_at).toLocaleString() : null} />
            <InfoRow label="Submitted" value={app?.submitted_at ? new Date(app.submitted_at).toLocaleString() : null} />
          </div>
          {app?.correction_notes && (
            <div style={{ marginTop: '1rem', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '0.75rem', fontSize: '0.875rem' }}>
              <strong>📝 Correction Notes:</strong> {app.correction_notes}
            </div>
          )}
          {app?.rejection_reason && (
            <div style={{ marginTop: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '0.75rem', fontSize: '0.875rem' }}>
              <strong>❌ Rejection Reason:</strong> {app.rejection_reason}
            </div>
          )}
        </div>

        {/* Documents card */}
        <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            Documents <span style={{ color: '#64748b', fontWeight: 400 }}>({docs.length})</span>
          </h2>
          {docs.length === 0
            ? <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No documents uploaded.</p>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    {['Doc ID', 'Filename', 'Status', 'Size', 'Run AI Review'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>#{doc.id}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>{doc.original_filename || doc.name}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span style={{ background: (doc.upload_status || doc.status) === 'stored' ? '#d1fae5' : '#fef3c7', color: (doc.upload_status || doc.status) === 'stored' ? '#065f46' : '#92400e', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                          {doc.upload_status || doc.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8' }}>{doc.size_kb || doc.sizeKb ? `${doc.size_kb || doc.sizeKb} KB` : '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <Link to={`/applications/${app?.id}/review?docId=${doc.id}`} target="_blank" style={{ color: '#1d4ed8', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 500 }}>
                          Run RAG Review ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        {/* Decision card */}
        <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a5f', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>AICTE Decision</h2>
          {!canDecide ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
              No decision actions available for status <strong>{app?.status}</strong>.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                  { val: 'approve', label: '✅ Approve', bg: '#059669', activeBg: '#047857' },
                  { val: 'corrections', label: '📝 Request Corrections', bg: '#d97706', activeBg: '#b45309' },
                  { val: 'reject', label: '❌ Reject', bg: '#dc2626', activeBg: '#b91c1c' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => { setAction(opt.val); setError(''); setSuccessMsg(''); setReasonText(''); }}
                    style={{ padding: '0.65rem 1.25rem', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', background: action === opt.val ? opt.activeBg : opt.bg, color: 'white', opacity: submitting ? 0.6 : 1, boxShadow: action === opt.val ? `0 0 0 3px ${opt.bg}44` : 'none' }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {action && action !== 'approve' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    {action === 'reject' ? 'Rejection Reason (required)' : 'Correction Notes (required)'}
                  </label>
                  <textarea value={reasonText} onChange={e => setReasonText(e.target.value)} rows={3}
                    placeholder={action === 'reject' ? 'Explain why this application is rejected…' : 'Describe what needs to be corrected and resubmitted…'}
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }} />
                </div>
              )}

              {action && (
                <button onClick={handleDecision} disabled={submitting}
                  style={{ padding: '0.75rem 2rem', background: submitting ? '#94a3b8' : '#1d4ed8', color: 'white', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting…' : `Confirm ${action === 'approve' ? 'Approval' : action === 'reject' ? 'Rejection' : 'Correction Request'}`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

