const statusStyles = {
  Draft: 'status-draft',
  draft: 'status-draft',
  'Ready for Submission': 'status-ready',
  ready: 'status-ready',
  'Under Review': 'status-review',
  under_review: 'status-review',
  'Issues Found': 'status-issues',
  issues_found: 'status-issues',
  'Pending Human Review': 'status-pending',
  pending: 'status-pending',
  Uploaded: 'status-document-uploaded',
  uploaded: 'status-document-uploaded',
  stored: 'status-document-uploaded',
  'Pending Review': 'status-document-pending',
  'Needs Attention': 'status-document-attention',
  failed: 'status-issues',
  'Needs review': 'status-ai-needs-review',
  needs_review: 'status-ai-needs-review',
  'Potential match': 'status-ai-potential-match',
  potential_match: 'status-ai-potential-match',
  'Potentially relevant': 'status-ai-potential-match',
  potentially_relevant: 'status-ai-potential-match',
  'Insufficient evidence': 'status-ai-insufficient-evidence',
  insufficient_evidence: 'status-ai-insufficient-evidence',
  'Preliminary review': 'status-review',
  preliminary_review: 'status-review',
  'No extractable text': 'status-issues',
  no_extractable_text: 'status-issues',
  consistent: 'status-ready',
  incomplete: 'status-pending',
  no_documents: 'status-issues',
  approved: 'status-ready',
  rejected: 'status-issues',
};

export default function StatusBadge({ status }) {
  const displayStatus = typeof status === 'string'
    ? status.replace(/_/g, ' ')
    : String(status ?? 'Draft');
  const styleClass = statusStyles[status] || statusStyles[displayStatus] || 'status-draft';
  return <span className={`status-badge ${styleClass}`}>{displayStatus}</span>;
}
