import reviewSample from '../data/mock/reviewSample.json';
import { API_BASE_URL, delay, ENDPOINTS, REQUEST_TIMEOUT_MS, USE_MOCK } from './client.js';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstArray(...values) {
  return values.find(Array.isArray) ?? [];
}

function stringValue(value) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function pageValue(item) {
  return item.page ?? item.page_number ?? item.pageNumber ?? item.source_page ?? item.sourcePage ?? '';
}

function formatFindingStatus(value) {
  const str = stringValue(value).trim();
  if (!str) return 'Needs review';
  const lower = str.toLowerCase().replace(/_/g, ' ');
  if (lower === 'potentially relevant' || lower === 'potentially_relevant') return 'Potentially relevant';
  if (lower === 'insufficient evidence' || lower === 'insufficient_evidence') return 'Insufficient evidence';
  if (lower === 'needs review') return 'Needs review';
  if (lower === 'potential match') return 'Potential match';
  return str.split(/[_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Normalizes backend RAG review response without dropping findings or inventing content.
 * @param {unknown} raw
 * @param {{ applicationId?: string|number, documentName?: string, documentId?: string|number }} context
 */
export function normalizeReviewResponse(raw, context = {}) {
  const response = isRecord(raw) ? raw : {};
  const payload = isRecord(response.result)
    ? response.result
    : isRecord(response.data)
      ? response.data
      : response;

  const backendStatus = stringValue(payload.status);
  const backendMessage = stringValue(payload.message);

  const findingsSource = firstArray(payload.findings, payload.issues, payload.review_findings);
  const referencesSource = firstArray(
    payload.retrieved_references,
    payload.retrievedReferences,
    payload.references,
    payload.passages,
    payload.sources,
    payload.handbook_references,
    payload.handbookReferences,
  );
  const fieldsSource = payload.extractedFields ?? payload.extracted_fields ?? payload.fields ?? [];

  const findings = findingsSource.map((item, index) => {
    const finding = isRecord(item) ? item : {};
    const docEvidence = isRecord(finding.document_evidence) ? finding.document_evidence : {};
    const rawHbRefs = firstArray(finding.handbook_references, finding.handbookReferences);
    const handbookReferences = rawHbRefs.map((ref) => {
      if (isRecord(ref)) {
        return {
          chunkId: stringValue(ref.chunk_id ?? ref.chunkId),
          sourcePage: ref.source_page ?? ref.sourcePage ?? ref.page ?? '',
        };
      }
      return { chunkId: stringValue(ref), sourcePage: '' };
    });

    const statusRaw = stringValue(finding.status ?? finding.category ?? finding.type ?? 'potentially_relevant');
    const statusNormalized = formatFindingStatus(statusRaw);
    const quote = stringValue(docEvidence.quote ?? finding.evidence ?? finding.quote);
    const sourcePage = docEvidence.source_page ?? finding.source_page ?? pageValue(finding);

    return {
      id: stringValue(finding.id ?? `finding-${index + 1}`),
      status: statusNormalized,
      rawStatus: statusRaw,
      description: stringValue(finding.description ?? finding.explanation ?? finding.message),
      explanation: stringValue(finding.relationship_explanation ?? finding.explanation ?? finding.description),
      relationshipExplanation: stringValue(finding.relationship_explanation),
      uncertainty: stringValue(finding.uncertainty),
      documentEvidence: {
        quote,
        sourcePage,
      },
      page: sourcePage,
      evidence: quote,
      handbookReferences,
      referenceId: handbookReferences[0]?.chunkId || stringValue(finding.referenceId ?? finding.reference_id ?? ''),
    };
  });

  const references = referencesSource.map((item, index) => {
    const reference = isRecord(item) ? item : { title: stringValue(item) };
    const chunkId = stringValue(reference.chunk_id ?? reference.chunkId ?? reference.id ?? reference.reference_id);
    const title = stringValue(reference.section_title ?? reference.sectionTitle ?? reference.title ?? reference.clause_title ?? chunkId);
    const page = reference.source_page ?? reference.sourcePage ?? pageValue(reference);
    const relevance = reference.relevance_score ?? reference.relevanceScore ?? reference.relevance ?? reference.score ?? '';
    const excerpt = stringValue(reference.excerpt ?? reference.text ?? reference.content);
    return {
      id: chunkId || `ref-${index + 1}`,
      chunkId,
      title,
      page,
      excerpt,
      relevance: typeof relevance === 'number' ? relevance : stringValue(relevance),
    };
  });

  const extractedFields = Array.isArray(fieldsSource)
    ? fieldsSource.map((item) => {
        const field = isRecord(item) ? item : {};
        return {
          name: stringValue(field.name ?? field.field ?? field.field_name ?? field.key),
          value: stringValue(field.value ?? field.extracted_value ?? field.extractedValue),
          page: pageValue(field),
        };
      })
    : isRecord(fieldsSource)
      ? Object.entries(fieldsSource).map(([name, value]) => ({
          name,
          value: stringValue(isRecord(value) ? value.value : value),
          page: isRecord(value) ? pageValue(value) : '',
        }))
      : [];

  const summary = {
    needsReview: findings.filter((f) => f.rawStatus === 'potentially_relevant' || f.status === 'Potentially relevant' || f.status === 'Needs review').length,
    potentialMatch: findings.filter((f) => f.status === 'Potential match').length,
    insufficientEvidence: findings.filter((f) => f.rawStatus === 'insufficient_evidence' || f.status === 'Insufficient evidence').length,
    totalFindings: findings.length,
  };

  return {
    applicationId: stringValue(payload.applicationId ?? payload.application_id ?? context.applicationId),
    documentId: stringValue(payload.documentId ?? payload.document_id ?? context.documentId),
    documentName: stringValue(payload.documentName ?? payload.document_name ?? context.documentName),
    reviewedAt: stringValue(payload.reviewedAt ?? payload.reviewed_at ?? payload.timestamp ?? new Date().toISOString()),
    isSample: payload.isSample === true || payload.is_sample === true,
    backendStatus,
    backendMessage,
    summary,
    extractedFields,
    references,
    findings,
    report: stringValue(payload.report ?? payload.review_report ?? payload.narrative ?? (backendMessage ? `Status: ${backendStatus}\n\n${backendMessage}` : '')),
  };
}

function makeAbortError() {
  const error = new Error('Review cancelled.');
  error.name = 'AbortError';
  return error;
}

function waitForMockReview(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(makeAbortError());
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, 650);
    function handleAbort() {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', handleAbort);
      reject(makeAbortError());
    }
    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function makeReviewError(message, code, statusCode, rawResponse) {
  const error = new Error(message);
  error.code = code;
  if (statusCode !== undefined) error.statusCode = statusCode;
  if (rawResponse !== undefined) error.rawResponse = rawResponse;
  return error;
}

function httpErrorMessage(status, detail) {
  const descriptions = {
    400: 'Invalid document upload or bad request.',
    404: 'Application or document not found.',
    413: 'The document exceeds size limits (maximum 300 pages or 10 MB).',
    422: 'The document cannot be processed (no extractable text or corrupted PDF).',
    500: 'Internal server error while processing the document.',
    502: 'The AI model response could not be validated against the regulation schema.',
    503: 'AI service or handbook retrieval is temporarily unavailable or busy.',
    504: 'The AI review service request timed out.',
  };
  const description = descriptions[status] ?? 'The backend returned an error.';
  return `HTTP ${status}: ${description}${detail ? ` Details: ${detail}` : ''}`;
}

/**
 * Runs grounded AI review for a document using POST /applications/{application_id}/documents/{document_id}/rag-review
 * @param {string|number} applicationId
 * @param {string|number} documentId
 * @param {{ signal?: AbortSignal, applicationName?: string, documentName?: string }} options
 */
export async function runReview(applicationId, documentId, options = {}) {
  if (USE_MOCK) {
    await waitForMockReview(options.signal);
    return {
      ...normalizeReviewResponse({}, {
        applicationId,
        documentId,
        documentName: options.documentName,
      }),
      rawResponse: null,
      isAvailable: false,
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  if (options.signal?.aborted) forwardAbort();
  else options.signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const url = `${API_BASE_URL}${ENDPOINTS.ragReview(applicationId, documentId)}`;
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
    });
    const responseText = await response.text();
    let raw;
    try {
      raw = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw makeReviewError('The backend response could not be parsed as JSON.', 'UNREADABLE_RESPONSE');
      }
    }

    if (!response.ok) {
      const detailValue = isRecord(raw) ? raw.detail : '';
      const detail = typeof detailValue === 'string' ? detailValue : detailValue === undefined ? '' : JSON.stringify(detailValue);
      throw makeReviewError(httpErrorMessage(response.status, detail), 'HTTP_ERROR', response.status, raw);
    }

    const result = normalizeReviewResponse(raw, {
      applicationId,
      documentId,
      documentName: options.documentName,
    });
    return { ...result, rawResponse: raw, isAvailable: true };
  } catch (error) {
    if (timedOut) throw makeReviewError('The review took too long (request timed out).', 'TIMEOUT');
    if (options.signal?.aborted) throw makeAbortError();
    if (error.code) throw error;
    if (error instanceof TypeError) {
      throw makeReviewError('Cannot reach the backend. Check that the FastAPI server is running and that CORS allows this origin.', 'NETWORK');
    }
    throw makeReviewError('The backend response could not be read.', 'UNREADABLE_RESPONSE');
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
}

export async function getSampleReview() {
  await delay(100);
  return {
    ...reviewSample,
    isSample: true,
    summary: { ...reviewSample.summary },
    extractedFields: reviewSample.extractedFields.map((field) => ({ ...field })),
    references: reviewSample.references.map((reference) => ({ ...reference })),
    findings: reviewSample.findings.map((finding) => ({ ...finding })),
  };
}
