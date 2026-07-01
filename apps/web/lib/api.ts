// lib/api.ts
const API_URL = "http://127.0.0.1:8000/api/v1";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token"); // <- Padrão certo

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.detail || `Erro ${res.status}`);
    // @ts-ignore
    error.status = res.status;
    throw error;
  }

  return res.json();
}