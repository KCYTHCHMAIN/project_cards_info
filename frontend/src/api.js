// src/api.js
const raw = (import.meta?.env?.VITE_API_BASE || '').trim();
const API_BASE = (raw || 'http://localhost:5000').replace(/\/+$/, '');

async function http(path, { method = 'GET', headers = {}, body } = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => http('/api/healthz'),
  listProfiles: () => http('/api/profiles'),
  getProfile: (id) => http(`/api/profiles/${id}`),
  createProfile: (payload) => http('/api/profiles', { method: 'POST', body: payload }),
  updateProfile: (id, payload) => http(`/api/profiles/${id}`, { method: 'PUT', body: payload }),
  deleteProfile: (id) => http(`/api/profiles/${id}`, { method: 'DELETE' }),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return fetch(`${API_BASE}/api/upload-avatar`, { method: 'POST', body: fd })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const e = new Error(data?.error || 'upload_failed');
          e.status = res.status; e.data = data; throw e;
        }
        return data;
      });
  }
};

export const {
  health, listProfiles, getProfile, createProfile, updateProfile, deleteProfile, uploadAvatar
} = api;

export { API_BASE };
export default api;
