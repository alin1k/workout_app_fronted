import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from '../components/Icon.jsx';
import Button from '../components/Button.jsx';
import Field from '../components/Field.jsx';
import TextInput from '../components/TextInput.jsx';

function Login() {
  const { status, login } = useAuth();
  const navigate = useNavigate();

  // Already authed (URL-bar navigation, stale tab) → bounce home.
  useEffect(() => {
    if (status === 'authed') navigate('/', { replace: true });
  }, [status, navigate]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (submitting) return;
    if (username.trim() === '' || password === '') {
      // Server would collapse this into the same 401 — a local message
      // saves a round trip and is friendlier than "invalid".
      setError('Enter your username and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await login(username, password);
    if (result.error) {
      // Per the handoff: never reveal which of user-missing vs wrong-password
      // failed. 401 always collapses to one generic message.
      if (result.error.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError(result.error.message || 'Could not sign in.');
      }
      setSubmitting(false);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <>
      <header className="appbar" style={{ borderBottom: 'none' }}>
        <div className="grow row gap10">
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
              boxShadow: '0 6px 14px -8px var(--primary-deep)',
            }}
          >
            <Icon name="leaf" size={21} />
          </span>
          <div>
            <div className="display-lg" style={{ fontSize: 21, lineHeight: 1 }}>Grove</div>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Training log
            </div>
          </div>
        </div>
      </header>

      <div className="scroll">
        <div className="page" style={{ paddingTop: 24 }}>
          <div className="col gap16">
            <div>
              <div className="display-xl">Sign in</div>
              <div className="muted" style={{ marginTop: 4, fontSize: 14.5 }}>
                Pick up where you left off.
              </div>
            </div>

            {error && (
              <div
                className="err fade-in"
                style={{
                  background: 'var(--danger-soft)',
                  padding: '10px 12px',
                  borderRadius: 'calc(var(--radius)*0.6)',
                }}
              >
                <Icon name="alert" size={16} /> {error}
              </div>
            )}

            <Field label="Username">
              <TextInput
                value={username}
                onChange={setUsername}
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="your username"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
            </Field>

            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  style={{ paddingRight: 48 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                    borderRadius: 999,
                  }}
                >
                  <Icon name={showPwd ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </Field>

            <Button
              variant="primary"
              size="lg"
              className="btn-block"
              onClick={submit}
              disabled={submitting}
              style={{ marginTop: 4 }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <div
              className="muted"
              style={{ textAlign: 'center', fontSize: 13, marginTop: 8, lineHeight: 1.55 }}
            >
              Grove is invite-only. Ask the owner to set you up an account.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
