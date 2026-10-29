import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Applications from './pages/Applications.jsx';
import NewApplication from './pages/NewApplication.jsx';
import ApplicationDetails from './pages/ApplicationDetails.jsx';
import ReviewHistory from './pages/ReviewHistory.jsx';
import AIReview from './pages/AIReview.jsx';
import Login from './pages/Login.jsx';
import AICTEDashboard from './pages/AICTEDashboard.jsx';
import AICTEReviewPanel from './pages/AICTEReviewPanel.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Full-page routes (no shared Layout) */}
        <Route path="login" element={<Login />} />
        <Route path="aicte-dashboard" element={<AICTEDashboard />} />
        <Route path="aicte-review/:id" element={<AICTEReviewPanel />} />

        {/* Institution / general routes inside shared Layout */}
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/new" element={<NewApplication />} />
          <Route path="applications/:id/review" element={<AIReview />} />
          <Route path="applications/:id" element={<ApplicationDetails />} />
          <Route path="ai-review" element={<AIReview />} />
          <Route path="review-history" element={<ReviewHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
