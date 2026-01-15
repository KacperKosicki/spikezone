import { auth } from "../firebase";

const API = "http://localhost:5000";

export async function getAuthHeader() {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

// ✅ multipart upload (FormData)
export async function apiUpload(path, formData, { method = "POST" } = {}) {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...authHeader,
      // UWAGA: NIE ustawiamy Content-Type przy FormData (browser zrobi boundary)
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Upload failed");
  return data;
}
