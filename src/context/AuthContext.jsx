import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, configureAuth } from '../lib/api.js';
import Toast from '../components/Toast.jsx';

const AuthContext = createContext(null);
const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' while we validate a stored token, 'unauthed' once we know
  // there isn't one (or it was rejected), 'authed' on success.
  const [status, setStatus] = useState(
    localStorage.getItem(TOKEN_KEY) ? 'loading' : 'unauthed'
  );
  // Token kept in a ref so api.js's getToken() reader always sees the latest
  // value without re-running effects.
  const tokenRef = useRef(localStorage.getItem(TOKEN_KEY) || null);
  const navigate = useNavigate();

  // Session-expired toast lives here, not in AppProvider — AppProvider gets
  // unmounted as soon as we flip to unauthed, taking any in-flight toast with
  // it. AuthProvider sits above the gate, so its toast survives the swap.
  const [sessionToast, setSessionToast] = useState(null);
  const sessionToastTimer = useRef(null);
  const flashSession = useCallback((message) => {
    setSessionToast({ message, icon: 'alert' });
    clearTimeout(sessionToastTimer.current);
    sessionToastTimer.current = setTimeout(() => setSessionToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(sessionToastTimer.current), []);

  const clearAuth = useCallback(() => {
    tokenRef.current = null;
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setStatus('unauthed');
  }, []);

  // Wire api.js. Runs before the boot-time /me probe (next useEffect) thanks
  // to React's "effects run in declaration order" guarantee.
  useEffect(() => {
    configureAuth({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        // Guard against rapid-fire 401s from multiple in-flight requests all
        // triggering logout. First one wins; the rest are no-ops.
        if (tokenRef.current == null) return;
        clearAuth();
        flashSession('Your session expired — please log in again');
        navigate('/login');
      },
    });
  }, [clearAuth, flashSession, navigate]);

  // Boot: if we have a stored token, validate it. authApi.me bypasses the
  // global 401 handler, so a bad token here just resolves to "show login"
  // without a "session expired" flash — there's no session to expire yet.
  useEffect(() => {
    if (!tokenRef.current) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await authApi.me();
      if (cancelled) return;
      if (error) {
        tokenRef.current = null;
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setStatus('unauthed');
      } else {
        setUser(data);
        setStatus('authed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username, password) => {
    const { data, error } = await authApi.login(username.trim(), password);
    if (error) return { error };
    tokenRef.current = data.access_token;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
    setStatus('authed');
    return { user: data.user };
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  const value = { user, status, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Toast message={sessionToast?.message} icon={sessionToast?.icon} />
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
