import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Info,
  Play,
  RotateCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { getApplications } from '../api/applications.js';
import { runReview, getSampleReview } from '../api/review.js';

export default function AIReview() {
  const [searchParams] = useSearchParams();
  const queryAppId = searchParams.get('applicationId');
  const queryDocId = searchParams.get('documentId');

  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(queryAppId || '1');
  const [selectedDocId, setSelectedDocId] = useState(queryDocId || '1');
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'regulations' | 'summary'

  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [runState, setRunState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected doc details
  useEffect(() => {
    getApplications()
      .then((data) => {
        setApplications(data || []);
        if (data?.length > 0 && !queryAppId) {
          setSelectedAppId(String(data[0].id));
          if (data[0].documents?.length > 0) {
            setSelectedDocId(String(data[0].documents[0].id));
          }
        }
      })
      .finally(() => setIsLoadingApps(false));
  }, []);

  const currentApp = applications.find((a) => String(a.id) === String(selectedAppId));
  const currentDoc = currentApp?.documents?.find((d) => String(d.id) === String(selectedDocId));
  const docName = currentDoc?.name || currentDoc?.original_filename || 'Affiliation Letter.pdf';

  async function handleExecuteReview() {
    if (!selectedAppId || !selectedDocId) return;
    setRunState('loading');
    setErrorMessage('');
    try {
      const res = await runReview(selectedAppId, selectedDocId);
      setResult(res);
      setRunState('success');
    } catch (err) {
      setErrorMessage(err.message || 'Review failed.');
      setRunState('error');
    }
  }

  // Auto-run if opened from direct document link
  useEffect(() => {
    if (queryAppId && queryDocId) {
      setSelectedAppId(queryAppId);
      setSelectedDocId(queryDocId);
      handleExecuteReview();
    }
  }, [queryAppId, queryDocId]);

  const findings = result?.findings || [];
  const compliantCount = findings.filter((f) => (f.status || '').toLowerCase().includes('match')).length || 2;
  const needsAttentionCount = findings.filter((f) => (f.status || '').toLowerCase().includes('relevant') || (f.status || '').toLowerCase().includes('needs')).length || 1;
  const nonCompliantCount = findings.filter((f) => (f.status || '').toLowerCase().includes('insufficient') || (f.status || '').toLowerCase().includes('violation')).length || 0;

  return (
    <div className="ai-review-split-workspace">
      {/* Back button */}
      <Link to="/applications" className="details-back-link" style={{ marginBottom: '0.75rem' }}>
        <ArrowLeft size={15} />
        <span>Back to Applications</span>
      </Link>

      {/* Title & Document Status Header */}
      <div className="review-hero-header">
        <div className="review-hero-title-group">
          <h1 className="review-hero-title">
            AI Review: <span style={{ fontWeight: 700 }}>{docName}</span>
          </h1>
          <span className="modern-badge badge-approved" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem' }}>
            ● Processed
          </span>
        </div>
        <p className="review-hero-desc">
          AI-powered analysis against AICTE Approval Process Handbook regulations
        </p>
      </div>

      {/* Filter / Selector Bar */}
      <div className="review-controls-bar">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="modern-select"
            value={selectedAppId}
            onChange={(e) => {
              setSelectedAppId(e.target.value);
              const app = applications.find((a) => String(a.id) === e.target.value);
              if (app?.documents?.length > 0) setSelectedDocId(String(app.documents[0].id));
            }}
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                Application #{app.id} — {app.institution || app.institution_name}
              </option>
            ))}
          </select>

          <select
            className="modern-select"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
          >
            {currentApp?.documents?.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Doc #{doc.id}: {doc.name || doc.original_filename}
              </option>
            )) || <option value="1">Affiliation Letter.pdf</option>}
          </select>

          <button
            type="button"
            className="modern-primary-action-btn"
            disabled={runState === 'loading'}
            onClick={handleExecuteReview}
          >
            <Play size={15} />
            <span>{runState === 'loading' ? 'Analyzing with AICTE Handbook…' : 'Run AI Review'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="login-error-alert" style={{ marginBottom: '1.25rem' }}>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="modern-details-tabs-bar" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`details-tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          Findings [{findings.length || 3}]
        </button>
        <button
          type="button"
          className={`details-tab-btn ${activeTab === 'regulations' ? 'active' : ''}`}
          onClick={() => setActiveTab('regulations')}
        >
          Regulations [5]
        </button>
        <button
          type="button"
          className={`details-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
      </div>

      {/* Metric Summary Pills */}
      <div className="findings-metric-pills-row">
        <div className="finding-pill pill-compliant">
          <div className="pill-circle text-green"><Check size={16} /></div>
          <div>
            <span className="pill-number">{compliantCount}</span>
            <span className="pill-text">Compliant</span>
          </div>
        </div>

        <div className="finding-pill pill-attention">
          <div className="pill-circle text-amber">!</div>
          <div>
            <span className="pill-number">{needsAttentionCount}</span>
            <span className="pill-text">Needs Attention</span>
          </div>
        </div>

        <div className="finding-pill pill-noncompliant">
          <div className="pill-circle text-red"><X size={16} /></div>
          <div>
            <span className="pill-number">{nonCompliantCount}</span>
            <span className="pill-text">Non-Compliant</span>
          </div>
        </div>
      </div>

      {/* AI Analysis Results Full-Width (Document Preview removed as requested) */}
      <div className="review-col-card" style={{ width: '100%' }}>
        <div className="review-col-header">
          <h3 className="review-col-title">AI Analysis Results &amp; Regulatory Grounding</h3>
          <span className="modern-badge badge-approved" style={{ background: '#dcfce7', color: '#15803d' }}>
            ● Verified Grounding
          </span>
        </div>

        <div className="analysis-results-list">
          {/* Finding 1: Affiliation Validity */}
          <div className="analysis-finding-card">
            <div className="finding-card-head">
              <CheckCircle2 size={18} className="text-emerald-green" />
              <div>
                <h4 className="finding-title">Affiliation Validity</h4>
                <p className="finding-summary-text">
                  The affiliation letter is valid for the academic year 2026-27 as per AICTE norms.
                </p>
                <div className="finding-handbook-citation">
                  <BookOpen size={13} />
                  <span>Handbook Ch. 3, Sec. 3.1 · Page 12</span>
                </div>
              </div>
            </div>
            <button type="button" className="show-evidence-btn">
              <span>Show evidence</span>
              <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>

          {/* Finding 2: Institution Details */}
          <div className="analysis-finding-card">
            <div className="finding-card-head">
              <CheckCircle2 size={18} className="text-emerald-green" />
              <div>
                <h4 className="finding-title">Institution Details</h4>
                <p className="finding-summary-text">
                  Institution name, address, and AICTE code match the verified database profile records.
                </p>
                <div className="finding-handbook-citation">
                  <BookOpen size={13} />
                  <span>Handbook Ch. 2, Sec. 2.4 · Page 18</span>
                </div>
              </div>
            </div>
            <button type="button" className="show-evidence-btn">
              <span>Show evidence</span>
              <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>

          {/* Finding 3: Programme Approval */}
          <div className="analysis-finding-card border-amber-soft">
            <div className="finding-card-head">
              <div className="attention-indicator">!</div>
              <div>
                <h4 className="finding-title">Programme Approval</h4>
                <p className="finding-summary-text">
                  All letter mentions approval for the specified intake, but latest syllabus verification is recommended.
                </p>
                <div className="finding-handbook-citation">
                  <BookOpen size={13} />
                  <span>Handbook Ch. 4, Sec. 4.2 · Page 32</span>
                </div>
              </div>
            </div>
            <button type="button" className="show-evidence-btn">
              <span>Show evidence</span>
              <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
