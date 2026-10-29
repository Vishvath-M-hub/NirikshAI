import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Info,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { createApplication, uploadDocument } from '../api/applications.js';

const statesList = [
  'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh', 'Gujarat',
  'Andhra Pradesh', 'Telangana', 'Kerala', 'West Bengal', 'Rajasthan', 'Madhya Pradesh',
];

const institutionTypes = [
  'Private-Self Financing',
  'Government',
  'Government Aided',
  'Deemed University',
];

const programmes = [
  'Engineering and Technology',
  'Management',
  'Pharmacy',
  'Architecture and Planning',
  'Computer Applications (MCA)',
];

export default function NewApplication() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  // Form State
  const [institutionCode, setInstitutionCode] = useState('1-234567189');
  const [institutionName, setInstitutionName] = useState('Institution Name');
  const [institutionType, setInstitutionType] = useState('Private-Self Financing');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Chennai');
  const [address, setAddress] = useState('OMR, Chennai - 600119');

  const [applicationType, setApplicationType] = useState('Extension of Approval');
  const [programme, setProgramme] = useState('Engineering and Technology');

  // Documents State
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [createdAppId, setCreatedAppId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setFiles((prev) => [...prev, ...selected]);
  }

  function handleRemoveFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateAndSubmit() {
    setIsUploading(true);
    setErrorMsg('');
    try {
      // 1. Create Application
      const newApp = await createApplication({
        institutionName,
        institutionCode,
        applicationType,
        state,
        city: district,
        institutionType,
        contactName: 'Dean / Principal',
        contactEmail: 'contact@institution.edu',
      });

      const appId = newApp.id;
      setCreatedAppId(appId);

      // 2. Upload PDFs if any
      for (const file of files) {
        await uploadDocument(appId, file);
      }

      setSuccessMsg(`Application #${appId} created successfully with ${files.length} documents!`);
      setActiveStep(4);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="new-application-page-container">
      {/* Page Title */}
      <div className="new-app-title-bar">
        <h1 className="new-app-heading">New Application</h1>
        <p className="new-app-subheading">Submit a new application for AICTE approval</p>
      </div>

      {/* 4-Step Stepper Component */}
      <div className="stepper-horizontal-bar">
        <div className={`step-item ${activeStep >= 1 ? 'completed active' : ''}`}>
          <div className="step-circle">{activeStep > 1 ? <Check size={14} /> : '1'}</div>
          <div className="step-label-group">
            <span className="step-title">Institution Details</span>
            <span className="step-desc">Basic information</span>
          </div>
        </div>

        <div className="step-connector" />

        <div className={`step-item ${activeStep >= 2 ? 'completed active' : ''}`}>
          <div className="step-circle">{activeStep > 2 ? <Check size={14} /> : '2'}</div>
          <div className="step-label-group">
            <span className="step-title">Application Details</span>
            <span className="step-desc">Type and programme</span>
          </div>
        </div>

        <div className="step-connector" />

        <div className={`step-item ${activeStep >= 3 ? 'completed active' : ''}`}>
          <div className="step-circle">{activeStep > 3 ? <Check size={14} /> : '3'}</div>
          <div className="step-label-group">
            <span className="step-title">Upload Documents</span>
            <span className="step-desc">Required documents</span>
          </div>
        </div>

        <div className="step-connector" />

        <div className={`step-item ${activeStep >= 4 ? 'completed active' : ''}`}>
          <div className="step-circle">{activeStep >= 4 ? <Check size={14} /> : '4'}</div>
          <div className="step-label-group">
            <span className="step-title">Review &amp; Submit</span>
            <span className="step-desc">Check and confirm</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="login-error-alert" style={{ marginBottom: '1.5rem' }}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Institution Details */}
      {activeStep === 1 && (
        <div className="form-step-card">
          <h2 className="step-section-heading">Institution Information</h2>
          <div className="step-form-grid-2">
            <div className="form-group-modern">
              <label>Institution Code <span className="req">*</span></label>
              <input
                type="text"
                value={institutionCode}
                onChange={(e) => setInstitutionCode(e.target.value)}
                placeholder="1-234567189"
                required
              />
            </div>

            <div className="form-group-modern">
              <label>Institution Name <span className="req">*</span></label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Clg Name"
                required
              />
            </div>

            <div className="form-group-modern">
              <label>Institution Type <span className="req">*</span></label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
              >
                {institutionTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group-modern">
              <label>State <span className="req">*</span></label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {statesList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group-modern">
              <label>District <span className="req">*</span></label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Chennai"
                required
              />
            </div>

            <div className="form-group-modern">
              <label>Address <span className="req">*</span></label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="OMR, Chennai - 600119"
                required
              />
            </div>
          </div>

          <div className="step-actions-footer">
            <button
              type="button"
              className="modern-primary-action-btn"
              onClick={() => setActiveStep(2)}
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Application Details */}
      {activeStep === 2 && (
        <div className="form-step-card">
          <h2 className="step-section-heading">Application &amp; Programme Details</h2>
          <div className="step-form-grid-2">
            <div className="form-group-modern">
              <label>Application Type <span className="req">*</span></label>
              <select
                value={applicationType}
                onChange={(e) => setApplicationType(e.target.value)}
              >
                <option value="Extension of Approval">Extension of Approval</option>
                <option value="New Institution">New Institution</option>
                <option value="Increase in Intake">Increase in Intake</option>
              </select>
            </div>

            <div className="form-group-modern">
              <label>Programme <span className="req">*</span></label>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
              >
                {programmes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="step-actions-footer">
            <button
              type="button"
              className="modern-secondary-btn"
              onClick={() => setActiveStep(1)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="modern-primary-action-btn"
              onClick={() => setActiveStep(3)}
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Upload Documents */}
      {activeStep === 3 && (
        <div className="form-step-card">
          <h2 className="step-section-heading">Upload Required Documents</h2>
          <p className="step-section-desc">Upload PDF documents such as Affiliation Letter, Land Documents, and Faculty Statement.</p>

          <div
            className="modern-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={40} className="text-blue-500" />
            <p className="dropzone-primary-text">Click to browse or drag &amp; drop PDF files</p>
            <p className="dropzone-subtext">Supports PDF format up to 10 MB per file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="uploaded-files-list">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '1rem 0 0.5rem' }}>Selected Documents:</h3>
              {files.map((f, i) => (
                <div key={i} className="uploaded-file-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} className="text-blue" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="file-remove-btn"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="step-actions-footer">
            <button
              type="button"
              className="modern-secondary-btn"
              onClick={() => setActiveStep(2)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="modern-primary-action-btn"
              disabled={isUploading}
              onClick={handleCreateAndSubmit}
            >
              <span>{isUploading ? 'Creating & Uploading…' : 'Submit Application'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {activeStep === 4 && (
        <div className="form-step-card text-center" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: '#ecfdf5', borderRadius: '50%', color: '#059669', marginBottom: '1rem' }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Application Submitted Successfully!</h2>
          <p style={{ color: '#64748b', maxWidth: 500, margin: '0.5rem auto 1.5rem' }}>
            Application #{createdAppId} has been registered and is ready for automated AICTE verification and compliance screening.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to={`/applications/${createdAppId}`} className="modern-primary-action-btn">
              <span>View Application</span>
            </Link>
            <Link to="/ai-review" className="modern-secondary-btn">
              <Sparkles size={16} />
              <span>Run AI Review</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
