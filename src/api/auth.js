import { API_BASE_URL, USE_MOCK } from './client.js';

async function authRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE_URL}${path}`, opts);
  if (!res.ok) {
    let detail = '';
    try { const j = await res.json(); detail = j.detail || ''; } catch {}
    throw new Error(detail || `Request failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function loginUser(username, password) {
  if (USE_MOCK) {
    if (username === 'institution1' && password === 'inst@2026')
      return { token: 'mock-token-inst', role: 'institution', username, user_id: 1, institution_id: 1 };
    if (username === 'official1' && password === 'aicte@2026')
      return { token: 'mock-token-official', role: 'aicte_official', username, user_id: 2, institution_id: null };
    throw new Error('Invalid credentials (demo: institution1/inst@2026 or official1/aicte@2026)');
  }
  return authRequest('/auth/login', { method: 'POST', body: { username, password } });
}

export async function registerDemoUsers() {
  return authRequest('/auth/register-demo-users', { method: 'POST' });
}

export async function submitApplication(applicationId, token) {
  if (USE_MOCK) return { id: applicationId, status: 'submitted' };
  return authRequest(`/applications/${applicationId}/submit`, {
    method: 'PATCH',
    headers: { 'X-Auth-Token': token },
  });
}

export async function approveApplication(applicationId, token) {
  if (USE_MOCK) return { id: applicationId, status: 'approved' };
  return authRequest(`/applications/${applicationId}/approve`, {
    method: 'PATCH',
    body: { reason: '' },
    headers: { 'X-Auth-Token': token },
  });
}

export async function rejectApplication(applicationId, reason, token) {
  if (USE_MOCK) return { id: applicationId, status: 'rejected' };
  return authRequest(`/applications/${applicationId}/reject`, {
    method: 'PATCH',
    body: { reason },
    headers: { 'X-Auth-Token': token },
  });
}

export async function requestCorrections(applicationId, notes, token) {
  if (USE_MOCK) return { id: applicationId, status: 'under_review' };
  return authRequest(`/applications/${applicationId}/request-corrections`, {
    method: 'PATCH',
    body: { notes },
    headers: { 'X-Auth-Token': token },
  });
}

