// У розробці запити йдуть на /api (проксується Vite на :3001). У production
// адресу бекенду можна задати змінною VITE_API_URL під час збірки.
const BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const raw = localStorage.getItem('pl_auth');
  const token = raw ? JSON.parse(raw).token : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// універсальна обгортка над fetch: додає токен і обробляє помилки
export async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// окремий виклик для завантаження файлу (multipart/form-data)
export async function apiUpload(path, formData) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}
