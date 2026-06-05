import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Field = ({ label, type = 'text', value, onChange, error, autoFocus, suffix, testId }: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
  suffix?: ReactNode;
  testId?: string;
}) => (
  <div className="field">
    <label>{label}</label>
    <div className={`field-wrap${error ? ' field-wrap--error' : ''}`}>
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      />
      {suffix}
    </div>
    {error && <span className="field-error">{error}</span>}
  </div>
);

const PasswordEye = ({ visible, onToggle }: { visible: boolean; onToggle: () => void }) => (
  <button type="button" onClick={onToggle} className="pw-toggle" aria-label="Toggle password visibility">
    {visible ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 4.06-5.06M9.9 4.24A10 10 0 0 1 12 4c6.5 0 10 7 10 7a18.7 18.7 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      </svg>
    )}
  </button>
);

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    const next: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    const strongPasswordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!email) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "That doesn't look like an email";

    if (!password) next.password = 'Password is required';
    else if (!strongPasswordPattern.test(password)) {
      next.password = 'Use 8+ characters with a capital letter, number, and special character';
    }

    if (!confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    setFormError('');
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Signup failed');
        return;
      }

      localStorage.setItem('token', data.token);
      setSuccess(true);
      navigate('/dashboard');
    } catch {
      setFormError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setFormError('');
    setSuccess(false);
    setLoading(false);
  };

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="logo">
          <svg width={21} height={21} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10.5" stroke="#F5F0E1" strokeWidth="1.4" />
            <path d="M7.5 12.2l3.2 3.2 6-6.4" stroke="#F5F0E1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Testable<span className="logo-dot">.</span>
        </div>

        <div className="tagline">
          <h1>
            Pick up <br />where your <br />
            <span className="tagline-accent">brain left off.</span>
          </h1>
        </div>

        <div className="flashcard-stack">
          <div className="flashcard">
            <div className="flashcard-set">
              Bio 101 · set
            </div>
            <div className="flashcard-term">
              Mitochondria
            </div>
            <div className="flashcard-hint">
              tap to flip
            </div>
          </div>
          <div className="flashcard-shadow" />
        </div>

        <p className="login-footer">
          A CS35L project by Eric, Emily, Boyuan, Aaron &amp; Jasmine
        </p>
      </div>

      <div className="login-right">
        <div>
          <h2 className="login-title">
            Create account
          </h2>
          <p className="login-subtitle">
            Already have an account? <a href="/login" className="login-link">Sign in</a>
          </p>
        </div>

        <Field 
          label="Email" 
          type="email" 
          value={email} 
          onChange={setEmail} 
          error={errors.email} 
          autoFocus 
          testId="signup-email" 
        />

        <Field
          label="Password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          error={errors.password}
          suffix={<PasswordEye visible={showPw} onToggle={() => setShowPw(!showPw)} />}
          testId="signup-password"
        />

        <Field
          label="Confirm password"
          type={showConfirmPw ? 'text' : 'password'}
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          suffix={<PasswordEye visible={showConfirmPw} onToggle={() => setShowConfirmPw(!showConfirmPw)} />}
          testId="signup-confirm-password"
        />

        {formError && <span className="field-error">{formError}</span>}

        <button 
          className="btn-primary" 
          onClick={submit} 
          disabled={loading} 
          data-testid="signup-submit"
        >
          {loading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="spin">
              <circle cx="12" cy="12" r="9" stroke="#0A1238" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="#0A1238" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              Create account
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#0A1238" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>

        <p className="login-terms">
          By continuing you agree to our <a href="#" className="login-link-muted">Terms</a> &amp; <a href="#" className="login-link-muted">Privacy</a>.
        </p>

        {success && (
          <div className="success-overlay">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0A1238" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="success-title">
              Account created.
            </div>
            <div className="success-sub">
              Your study space is ready.
            </div>
            <button onClick={reset} className="success-reset">
              reset demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
