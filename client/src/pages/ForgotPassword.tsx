import { useState } from 'react';
import './Login.css';

const Field = ({ label, type = 'text', value, onChange, error, autoFocus }: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
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
    </div>
    {error && <span className="field-error">{error}</span>}
  </div>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setEmailError('');
    setFormError('');
    setMessage('');

    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("That doesn't look like an email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setFormError(data.error || 'Could not request a reset link');
        return;
      }

      setMessage(data.message || 'Reset password link has been sent to your email if this account exists.');
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
            <div className="flashcard-set">Bio 101 · set</div>
            <div className="flashcard-term">Mitochondria</div>
            <div className="flashcard-hint">tap to flip</div>
          </div>
          <div className="flashcard-shadow" />
        </div>

        <p className="login-footer">
          A CS35L project by Eric, Emily, Boyuan, Aaron &amp; Jasmine
        </p>
      </div>

      <div className="login-right">
        <div>
          <h2 className="login-title">Reset password</h2>
          <p className="login-subtitle">
            Remembered it? <a href="/login" className="login-link">Sign in</a>
          </p>
        </div>

        <Field label="Email" type="email" value={email} onChange={setEmail} error={emailError} autoFocus />

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
              Reset
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
