import mockDashboard from '../data/mock/dashboard.json';
import { getApplications } from './applications.js';
import { delay, USE_MOCK } from './client.js';

export async function getDashboardData() {
  if (USE_MOCK) {
    await delay(950);
    return mockDashboard;
  }

  const applications = await getApplications();
  const counts = applications.reduce((totals, application) => {
    const status = application.status || 'draft';
    totals[status] = (totals[status] ?? 0) + 1;
    return totals;
  }, {});

  return {
    applications,
    metrics: [
      { label: 'Total Applications', value: applications.length, trend: 'Live database records' },
      { label: 'Under Review', value: counts['under_review'] ?? counts['Under Review'] ?? 0, trend: 'In review process' },
      { label: 'Draft Applications', value: counts['draft'] ?? counts['Draft'] ?? 0, trend: 'In preparation' },
      { label: 'Approved', value: counts['approved'] ?? counts['Approved'] ?? 0, trend: 'Completed approval' },
    ],
    recentActivity: applications.slice(0, 5).map((app) => ({
      id: String(app.id),
      institution: app.institution || app.institution_name || `Application ${app.id}`,
      action: `Status: ${app.status}`,
      timestamp: app.created_at || app.submitted_at || new Date().toISOString(),
    })),
  };
}
