import mockApplications from '../data/mock/applications.json';
import { API_BASE_URL, delay, ENDPOINTS, USE_MOCK } from './client.js';

let sessionApplications = [...mockApplications];

function normalizeDocument(doc) {
  const sizeKb = doc.sizeKb ?? (doc.file_size ? Math.max(1, Math.round(doc.file_size / 1024)) : 0);
  const uploadedOn = doc.uploadedOn ?? (doc.uploaded_at ? doc.uploaded_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
  return {
    id: doc.id,
    documentId: doc.id,
    document_id: doc.id,
    name: doc.original_filename ?? doc.name ?? `Document #${doc.id}`,
    original_filename: doc.original_filename ?? doc.name,
    sizeKb,
    uploadedOn,
    status: doc.upload_status ?? doc.status ?? 'Stored',
  };
}

function normalizeApplication(app) {
  const documents = (app.documents ?? []).map(normalizeDocument);
  const institution = app.institution ?? app.institution_name ?? app.institutionName ?? 'Unnamed Institution';
  const institutionCode = app.institution_code ?? app.institutionCode ?? '';
  const applicationType = app.application_type ?? app.applicationType ?? 'New Institution';
  const submittedAt = app.submittedAt ?? (app.submitted_at ? app.submitted_at.slice(0, 10) : null);
  const status = app.status ?? 'draft';

  return {
    ...app,
    id: app.id,
    institution,
    institutionName: institution,
    institutionCode,
    institution_code: institutionCode,
    applicationType,
    application_type: applicationType,
    status,
    submittedAt,
    documentCount: documents.length,
    documents,
    events: app.events ?? [
      { date: app.created_at ?? new Date().toISOString(), label: 'Application created' },
    ],
  };
}

export async function getApplications() {
  if (USE_MOCK) {
    await delay(700);
    return sessionApplications.map((application) => ({ ...application }));
  }

  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.applications}`);
  if (!response.ok) throw new Error('Applications could not be loaded. Please check the backend connection.');
  const data = await response.json();
  return (Array.isArray(data) ? data : []).map(normalizeApplication);
}

export async function getApplicationById(id) {
  if (USE_MOCK) {
    await delay(500);
    const application = sessionApplications.find((item) => String(item.id) === String(id));
    if (!application) throw new Error('Application not found');
    return {
      ...application,
      documents: (application.documents ?? []).map((document) => ({ ...document })),
      events: (application.events ?? []).map((event) => ({ ...event })),
    };
  }

  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.application(encodeURIComponent(id))}`);
  if (response.status === 404) throw new Error('Application not found');
  if (!response.ok) throw new Error('Application details could not be loaded. Please try again.');
  const data = await response.json();
  return normalizeApplication(data);
}

export async function createApplication(formData) {
  if (USE_MOCK) {
    await delay(500);
    const createdAt = new Date().toISOString();
    const documents = (formData.documents ?? []).map((document) => ({ ...document }));
    const events = [
      { date: createdAt, label: 'Application created' },
      ...(documents.length ? [{ date: createdAt, label: 'Documents uploaded' }] : []),
      { date: createdAt, label: `Status changed to ${formData.status || 'Draft'}` },
    ];
    const newId = sessionApplications.length ? Math.max(...sessionApplications.map((a) => Number(String(a.id).replace(/\D/g, '')) || 0)) + 1 : 1;
    const application = {
      ...formData,
      id: newId,
      institution: formData.institutionName || formData.institution || 'Demo Institution',
      institutionCode: formData.institutionCode || 'AICTE-DEMO-01',
      submittedAt: formData.status === 'Draft' ? null : createdAt.slice(0, 10),
      documents,
      documentCount: documents.length,
      events,
    };
    sessionApplications = [application, ...sessionApplications];
    return { ...application };
  }

  const payload = {
    institution_code: (formData.institutionCode || formData.institution_code || '').trim(),
    institution_name: (formData.institutionName || formData.institution || formData.institution_name || '').trim(),
    application_type: (formData.applicationType || formData.application_type || 'New Institution').trim(),
    status: formData.status,
  };

  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.applications}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let errorDetail = '';
    try {
      const err = await response.json();
      errorDetail = err.detail ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) : '';
    } catch {}
    throw new Error(errorDetail || 'The application could not be saved. Please try again.');
  }
  const created = await response.json();
  return normalizeApplication(created);
}

export async function uploadDocument(applicationId, file) {
  if (USE_MOCK) {
    await delay(850);
    const mockDocId = Math.floor(100 + Math.random() * 900);
    return {
      id: mockDocId,
      document_id: mockDocId,
      application_id: applicationId,
      fileName: file.name,
      original_filename: file.name,
      size: file.size,
      status: 'Stored',
    };
  }

  const payload = new FormData();
  payload.append('file', file);
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.documents(applicationId)}`, {
    method: 'POST',
    body: payload,
  });
  if (!response.ok) {
    let errorDetail = '';
    try {
      const err = await response.json();
      errorDetail = err.detail ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) : '';
    } catch {}
    throw new Error(errorDetail || 'The document could not be uploaded. Please try again.');
  }
  return response.json();
}

export async function runCrossDocumentVerification(applicationId) {
  if (USE_MOCK) {
    await delay(650);
    return {
      application_id: applicationId,
      status: 'consistent',
      documents: [],
      mismatches: [],
      missing_fields: [],
      missing_documents: [],
      uncertainty: [],
      disclaimer: 'Deterministic comparison of extracted text only (Demo mock mode).',
    };
  }

  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.crossDocumentVerification(applicationId)}`, {
    method: 'POST',
  });
  if (!response.ok) {
    let errorDetail = '';
    try {
      const err = await response.json();
      errorDetail = err.detail ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) : '';
    } catch {}
    throw new Error(errorDetail || 'Cross-document verification failed. Please try again.');
  }
  return response.json();
}
