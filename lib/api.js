// API helper with auth token
export async function apiFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pt_token') : null;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('pt_token');
      localStorage.removeItem('pt_user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pt_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function logout() {
  localStorage.removeItem('pt_token');
  localStorage.removeItem('pt_user');
  window.location.href = '/login';
}
