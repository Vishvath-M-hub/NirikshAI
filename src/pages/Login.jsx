import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  FileCheck,
  Lock,
  Search,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { loginUser, registerDemoUsers } from '../api/auth.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [selectedRole, setSelectedRole] = useState('institution'); // 'institution' | 'aicte_official'
  const [username, setUsername] = useState('institution1');
  const [password, setPassword] = useState('inst@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  function handleRoleToggle(role) {
    setSelectedRole(role);
    if (role === 'institution') {
      setUsername('institution1');
      setPassword('inst@2026');
    } else {
      setUsername('official1');
      setPassword('aicte@2026');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await loginUser(username.trim(), password);
      login(userData);
      if (userData.role === 'aicte_official') {
        navigate('/aicte-dashboard', { replace: true });
      } else {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedUsers() {
    setSeeding(true);
    setSeedMsg('');
    try {
      const r = await registerDemoUsers();
      setSeedMsg(r.message || 'Demo users created.');
    } catch (err) {
      setSeedMsg(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="login-split-page">
      {/* Left Promotional Banner */}
      <div className="login-left-banner">
        {/* Brand Header */}
        <div className="login-brand-group">
          <div className="login-brand-icon-wrapper">
            <span className="login-logo-n">N</span>
          </div>
          <div>
            <h1 className="login-brand-heading">
              Niriksh<span className="login-brand-accent">AI</span>
            </h1>
            <p className="login-brand-subtags">Inspect · Verify · Ensure</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="login-hero-block">
          <h2 className="login-hero-title">
            AI-Powered Compliance Portal<br />for AICTE Approvals
          </h2>
          <p className="login-hero-subtitle">
            Transparent. Accurate. Compliant.<br />
            For a Stronger Higher Education Ecosystem.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="login-features-list">
          <div className="login-feature-item">
            <div className="feature-icon-box">
              <BrainCircuit size={20} className="text-blue" />
            </div>
            <div className="feature-item-text">
              <h4>AI-Powered Document Validation</h4>
              <p>Against AICTE norms</p>
            </div>
          </div>

          <div className="login-feature-item">
            <div className="feature-icon-box">
              <Search size={20} className="text-blue" />
            </div>
            <div className="feature-item-text">
              <h4>Regulatory Knowledge Assistant</h4>
              <p>with Handbook References</p>
            </div>
          </div>

          <div className="login-feature-item">
            <div className="feature-icon-box">
              <FileCheck size={20} className="text-blue" />
            </div>
            <div className="feature-item-text">
              <h4>Secure &amp; Transparent Workflow</h4>
              <p>for Institutions and AICTE Officials</p>
            </div>
          </div>

          <div className="login-feature-item">
            <div className="feature-icon-box">
              <Zap size={20} className="text-blue" />
            </div>
            <div className="feature-item-text">
              <h4>Faster, Data-Driven Decisions</h4>
              <p>with Complete Traceability</p>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="login-left-footer">
          <p className="login-empower-text">
            Empowering Quality Education<br />
            Through Trust and Technology
          </p>
        </div>
      </div>

      {/* Right Login Card with Background Graphic Backdrop */}
      <div className="login-right-section">
        {/* Responsive Background Image Layer */}
        <div
          className="login-bg-image-layer"
          style={{ backgroundImage: `url('/landing-bg.png')` }}
          aria-hidden="true"
        />
        {/* Soft gradient backdrop to ensure high contrast & 100% form readability */}
        <div className="login-bg-tint-overlay" aria-hidden="true" />

        {/* Top AICTE Authority Tag */}
        <div className="aicte-authority-tag">
          <strong>All India Council for Technical Education</strong>
          <span>Towards a Quality Technical Education Ecosystem</span>
        </div>

        {/* Floating Auth Card */}
        <div className="login-card-container">
          <div className="login-card-header">
            <h3>Welcome to Niriksh<span className="accent-orange">AI</span></h3>
            <p>Sign in to continue to the AICTE Compliance Portal</p>
          </div>

          {/* Role Toggle Selector */}
          <div className="login-role-tabs">
            <button
              type="button"
              className={`role-tab-btn ${selectedRole === 'institution' ? 'active' : ''}`}
              onClick={() => handleRoleToggle('institution')}
            >
              Institution
            </button>
            <button
              type="button"
              className={`role-tab-btn ${selectedRole === 'aicte_official' ? 'active' : ''}`}
              onClick={() => handleRoleToggle('aicte_official')}
            >
              AICTE Official
            </button>
          </div>

          {error && (
            <div className="login-error-alert" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-body">
            <div className="login-input-group">
              <label htmlFor="login-username">Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-leading-icon" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-leading-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-form-options">
              <label className="remember-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="forgot-password-link">Forgot password?</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-primary-submit-btn"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider-row">
            <span>OR</span>
          </div>

          <button
            type="button"
            onClick={handleSeedUsers}
            disabled={seeding}
            className="login-secondary-demo-btn"
          >
            <Sparkles size={16} />
            <span>{seeding ? 'Setting up…' : 'Create Demo Users'}</span>
          </button>
          {seedMsg && <p className="seed-feedback-msg">{seedMsg}</p>}
        </div>
      </div>
    </div>
  );
}
