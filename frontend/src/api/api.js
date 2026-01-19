import { auth } from "../firebase";

// ✅ CRA: bierze z .env (local) lub z Vercel Env Vars (prod)
// jeśli nie ustawione, fallback na localhost
const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").trim();

export async function getAuthHeader() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function makeApiError(res, data, fallbackMsg) {
  const err = new Error(data?.message || fallbackMsg);

  // ✅ mapowanie kodu
  err.code = data?.code;
  if (!err.code && res.status === 401) err.code = "UNAUTHORIZED";

  err.status = res.status;
  err.data = data;
  return err;
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw makeApiError(res, data, "Request failed");
  return data;
}

export async function apiUpload(path, formData, { method = "POST" } = {}) {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...authHeader,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw makeApiError(res, data, "Upload failed");
  return data;
}
