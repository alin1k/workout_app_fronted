import { useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar.jsx';
import Icon from '../components/Icon.jsx';

// Placeholder screen — the actual reset flow is a future implementation.
function ResetPassword() {
  const navigate = useNavigate();

  return (
    <>
      <AppBar onBack={() => navigate(-1)} title="Reset password" subtitle="Account" />
      <div className="scroll">
        <div className="page">
          <div className="empty fade-in" style={{ marginTop: 40 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-soft)',
                color: 'var(--primary-deep)',
              }}
            >
              <Icon name="key" size={32} stroke={1.7} />
            </div>
            <div>
              <div className="display-lg" style={{ marginBottom: 6 }}>Coming soon</div>
              <div className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, maxWidth: 280 }}>
                Password reset isn’t available yet. Check back in a future update.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;
