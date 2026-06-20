// Single point through which all backend calls flow.
// Every method returns { data, error } and never throws.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Wired by AuthProvider via configureAuth() on mount. Until that runs the
// reader returns null and the 401 hook is a no-op, which is the right
// behavior for any request that happens before mount (there shouldn't be
// any, but defensiveness is cheap).
let getToken = () => null;
let onUnauthorized = () => {};

export function configureAuth(hooks) {
  if (hooks.getToken) getToken = hooks.getToken;
  if (hooks.onUnauthorized) onUnauthorized = hooks.onUnauthorized;
}

// `skipAuthHandler` — used by authApi (login / me). Those callers need to
// branch on 401 themselves (login failure / boot-time token check) instead
// of triggering the global session-expired flow.
async function request(method, path, body, { skipAuthHandler = false } = {}) {
  const token = getToken();
  const init = {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(BASE_URL + path, init);
  } catch {
    return {
      data: null,
      error: {
        error: 'NetworkError',
        message: 'Could not reach the server.',
        status: 0,
      },
    };
  }

  // 204 No Content
  if (res.status === 204) {
    return { data: null, error: null };
  }

  // Parse JSON body if there is one.
  let parsed = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (res.ok) {
    return { data: parsed, error: null };
  }

  // Non-2xx: normalize to the documented error shape
  // { error, message, status, field? }
  const error = parsed && typeof parsed === 'object'
    ? {
        error: parsed.error || 'Error',
        message: parsed.message || 'Request failed',
        status: parsed.status ?? res.status,
        ...(parsed.field ? { field: parsed.field } : {}),
      }
    : {
        error: 'Error',
        message: 'Request failed',
        status: res.status,
      };

  // Global 401 → session expired. authApi opts out so login failures and
  // boot-time /me probes don't trigger a redirect cascade.
  if (res.status === 401 && !skipAuthHandler) {
    onUnauthorized();
  }

  return { data: null, error };
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),

  // Special helper for PATCH /sets/<id>. The backend returns a 400 with
  // message "no fields to update" when nothing mutable was sent. Treat that
  // as a silent no-op so the edit-set form can close without surfacing an
  // error.
  async updateSet(id, body) {
    const result = await request('PATCH', `/sets/${id}`, body ?? {});
    if (
      result.error &&
      result.error.status === 400 &&
      result.error.message === 'no fields to update'
    ) {
      return { data: null, error: null, noop: true };
    }
    return result;
  },
};

// Auth endpoints bypass the global 401 handler — callers branch on the
// 401 themselves (Login form shows it inline, AuthProvider treats boot-time
// /me failure as "show login screen").
export const authApi = {
  login: (username, password) =>
    request('POST', '/auth/login', { username, password }, { skipAuthHandler: true }),
  me: () => request('GET', '/auth/me', undefined, { skipAuthHandler: true }),
  // skipAuthHandler because the backend answers 401 for a wrong current
  // password — without the opt-out the global handler would read that as
  // "session expired" and log the user out mid-form.
  resetPassword: (currentPassword, newPassword) =>
    request(
      'POST',
      '/auth/reset-password',
      { current_password: currentPassword, new_password: newPassword },
      { skipAuthHandler: true }
    ),
};
