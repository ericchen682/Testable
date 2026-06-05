import { type ReactNode, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const Field = ({ label, type = 'text', value, onChange, error, autoFocus, suffix }: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
  suffix?: ReactNode;
}) => (
  <div className="field">
    <label>{label}</label>
    <div className={`field-wrap${error ? ' field-wrap--error' : ''}`}>
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const next: { password?: string; confirmPassword?: string } = {};
    const strongPasswordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!password) next.password = 'Password is required';
    else if (!strongPasswordPattern.test(password)) {
      next.password = 'Use 8+ characters with a capital letter, number, and special character';
    }

    if (!confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    setFormError('');
    setMessage('');
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: searchParams.get('token'), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setFormError(data.error || 'Could not reset password');
        return;
      }

      setMessage(data.message || 'Your password has been reset. You can sign in now.');
      setTimeout(() => navigate('/login'), 1200);
    } catch {
      setFormError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
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
            Choose new password
          </h2>
          <p className="login-subtitle">
            Back to <a href="/login" className="login-link">sign in</a>
          </p>
        </div>

        <Field
          label="New password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoFocus
          suffix={<PasswordEye visible={showPw} onToggle={() => setShowPw(!showPw)} />}
        />
        <Field
          label="Confirm password"
          type={showConfirmPw ? 'text' : 'password'}
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          suffix={<PasswordEye visible={showConfirmPw} onToggle={() => setShowConfirmPw(!showConfirmPw)} />}
        />

        {formError && <span className="field-error">{formError}</span>}
        {message && <span className="field-success">{message}</span>}

        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="spin">
              <circle cx="12" cy="12" r="9" stroke="#0A1238" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="#0A1238" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              Save password
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#0A1238" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
