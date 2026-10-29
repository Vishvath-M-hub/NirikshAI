import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';
import { getApplicationById, runCrossDocumentVerification, uploadDocument } from '../api/applications.js';
import { submitApplication } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Loader from '../components/ui/Loader.jsx';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ApplicationDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('documents'); // 'overview' | 'documents' | 'ai_review' | 'comments' | 'history'

  // Submit for review state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Document upload state
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Cross-document verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    loadApp();
  }, [id]);

  async function loadApp() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getApplicationById(id);
      setApplication(data);
    } catch (err) {
      setError(err.message || 'Failed to load application details.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitForReview() {
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const updated = await submitApplication(id, user?.token);
      setApplication(updated);
      setSubmitSuccess('Application submitted for AICTE review.');
    } catch (err) {
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDoc(true);
    setDocUploadError('');
    try {
      await uploadDocument(id, file);
      await loadApp();
    } catch (err) {
      setDocUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRunVerification() {
    setIsVerifying(true);
    setVerificationError('');
    try {
      const res = await runCrossDocumentVerification(id, user?.token);
      setVerificationResult(res);
    } catch (err) {
      setVerificationError(err.message || 'Cross-document verification failed.');
    } finally {
      setIsVerifying(false);
    }
  }

  if (isLoading) return <Loader label="Loading application..." />;
  if (error || !application) return <ErrorState message={error || 'Application not found'} />;

  const documents = application.documents || [];
  const statusStr = (application.status || 'draft').toLowerCase();
  const canSubmit = statusStr === 'draft' || statusStr === 'under_review';
  const appIdFormatted = `APP-2026-000${application.id}`;

  return (
    <div className="application-details-modern-container">
      {/* Back button */}
      <Link to="/applications" className="details-back-link">
        <ArrowLeft size={15} />
        <span>Back to My Applications</span>
      </Link>

      {/* Header Banner */}
      <div className="details-header-banner">
        <div className="details-header-title-row">
          <div className="details-title-group">
            <h1 className="details-page-heading">Application Details</h1>
            <span className="modern-badge badge-draft" style={{ textTransform: 'capitalize' }}>
              {application.status?.replace(/_/g, ' ') || 'Draft'}
            </span>
          </div>
          <p className="details-id-subtext">
            <strong>{appIdFormatted}</strong> · {application.application_type || application.applicationType || 'Extension of Approval'}
          </p>
        </div>

        <div className="details-header-actions">
          {canSubmit && (
            <button
              type="button"
              className="modern-primary-action-btn"
              disabled={isSubmitting || documents.length === 0}
              onClick={handleSubmitForReview}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Submitting…' : 'Submit for AICTE Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback alerts */}
      {submitSuccess && (
        <div className="login-error-alert" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', marginBottom: '1rem' }}>
          <span>✅ {submitSuccess}</span>
        </div>
      )}
      {submitError && (
        <div className="login-error-alert" style={{ marginBottom: '1rem' }}>
          <span>⚠️ {submitError}</span>
        </div>
      )}

      {/* Navigation Tabs Matching Reference */}
      <div className="modern-details-tabs-bar">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'documents', label: 'Documents' },
          { key: 'ai_review', label: 'AI Review' },
          { key: 'cross_doc', label: 'Cross-Document Verification' },
          { key: 'comments', label: 'Comments' },
          { key: 'history', label: 'History' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`details-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="modern-table-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-card-title">Uploaded Documents ({documents.length})</h2>
              <p className="table-card-subtitle">Official records submitted for compliance and RAG analysis</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="modern-primary-action-btn"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                disabled={isUploadingDoc}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={16} />
                <span>{isUploadingDoc ? 'Uploading…' : 'Upload Document'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {docUploadError && (
            <div className="login-error-alert" style={{ margin: '1rem' }}>
              <span>{docUploadError}</span>
            </div>
          )}

          <div className="table-responsive-wrapper">
            <table className="modern-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Document Name</th>
                  <th>Category</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>AI Review</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No documents uploaded yet. Click "+ Upload Document" to add PDFs.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, idx) => {
                    const docName = doc.name || doc.original_filename || 'document.pdf';
                    const category = docName.toLowerCase().includes('affiliation')
                      ? 'Affiliation'
                      : docName.toLowerCase().includes('land')
                        ? 'Infrastructure'
                        : docName.toLowerCase().includes('faculty')
                          ? 'Faculty'
                          : 'General';

                    return (
                      <tr key={doc.id || idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={15} className="text-blue" />
                            <span>{docName}</span>
                          </div>
                        </td>
                        <td>{category}</td>
                        <td>{formatDate(doc.uploaded_at || doc.uploadedOn)}</td>
                        <td>
                          <span className="modern-badge badge-approved" style={{ background: '#dcfce7', color: '#15803d' }}>
                            ● Processed
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/ai-review?applicationId=${application.id}&documentId=${doc.id}`}
                            className="run-review-pill-btn"
                          >
                            <Sparkles size={13} />
                            <span>Run Review</span>
                          </Link>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/ai-review?applicationId=${application.id}&documentId=${doc.id}`}
                            className="action-link-arrow"
                          >
                            <span>View</span>
                            <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
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
      )}

      {/* Tab: Cross-Document Verification */}
      {activeTab === 'cross_doc' && (
        <div className="modern-table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 className="table-card-title">Cross-Document Consistency Verification</h2>
              <p className="table-card-subtitle">Automated validation of land area, built-up area, and intake across all documents</p>
            </div>
            <button
              type="button"
              className="modern-primary-action-btn"
              disabled={isVerifying || documents.length === 0}
              onClick={handleRunVerification}
            >
              <RefreshCw size={14} className={isVerifying ? 'spin' : ''} />
              <span>{isVerifying ? 'Verifying…' : 'Run Cross-Document Verification'}</span>
            </button>
          </div>

          {verificationError && (
            <div className="login-error-alert" style={{ marginBottom: '1rem' }}>
              <span>{verificationError}</span>
            </div>
          )}

          {verificationResult ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Status:</span>
                <span className="modern-badge badge-under-review" style={{ textTransform: 'uppercase' }}>
                  {verificationResult.status}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  ({verificationResult.documents_analyzed?.length || 0} documents evaluated)
                </span>
              </div>

              {verificationResult.discrepancies?.length === 0 ? (
                <div style={{ padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46' }}>
                  <CheckCircle2 size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  <strong>No discrepancies found across uploaded documents.</strong>
                </div>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: '#b91c1c', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Discrepancies Detected:</h4>
                  {verificationResult.discrepancies?.map((item, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '0.5rem' }}>
                      <strong>{item.field || 'Field mismatch'}</strong>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#475569' }}>{item.issue || JSON.stringify(item)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Click "Run Cross-Document Verification" to screen for discrepancies between application forms, land documents, and certificates.
            </p>
          )}
        </div>
      )}

      {/* Tab: Overview / Others */}
      {activeTab === 'overview' && (
        <div className="modern-table-card" style={{ padding: '1.5rem' }}>
          <h2 className="table-card-title" style={{ marginBottom: '1rem' }}>Institution &amp; Application Information</h2>
          <div className="step-form-grid-2">
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 2px' }}>Institution Name</p>
              <p style={{ fontWeight: 600, margin: 0 }}>{application.institution_name || application.institution || '—'}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 2px' }}>Institution Code</p>
              <p style={{ fontWeight: 600, margin: 0 }}>{application.institution_code || application.institutionCode || '—'}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 2px' }}>Application Type</p>
              <p style={{ fontWeight: 600, margin: 0 }}>{application.application_type || application.applicationType || '—'}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 2px' }}>Registered Email</p>
              <p style={{ fontWeight: 600, margin: 0 }}>{application.institution?.contact_email || 'institution1@example.com'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
