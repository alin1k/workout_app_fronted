import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

function AuthSplash() {
  return (
    <div
      className="empty"
      style={{ flex: 1, justifyContent: 'center', paddingBottom: 60 }}
      aria-busy="true"
      aria-label="Checking session"
    >
      <span
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--accent-soft)',
          color: 'var(--primary-deep)',
        }}
      >
        <Icon name="leaf" size={30} stroke={1.7} />
      </span>
    </div>
  );
}

function RequireAuth({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <AuthSplash />;
  if (status === 'unauthed') return <Navigate to="/login" replace />;
  return children;
}

export default RequireAuth;
