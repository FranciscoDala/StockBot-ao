const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let body = options.body;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const isFormData = body instanceof FormData || body instanceof URLSearchParams;

  if (!isFormData && body) {
    if (typeof body === "object") {
      body = JSON.stringify(body);
    }
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
    credentials: "include", // <- ADICIONA ESSA LINHA AQUI
    mode: "cors", // <- E ESSA TAMBÉM PRA GARANTIR
  });

  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("temp_token");
      localStorage.removeItem("lojas_temp");
    }
    const error = new Error("sessão expirada");
    // @ts-ignore
    error.status = res.status;
    throw error;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || `erro ${res.status}`);
    const error = new Error(detail);
    // @ts-ignore
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  get: (path: string, options?: RequestInit) => apiFetch(path, { ...options, method: "GET" }),

  // FIX: Login do FastAPI usa x-www-form-urlencoded, não JSON
  login: (username: string, password: string) =>
    apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password })
    }),

  post: (path: string, body?: any, options?: RequestInit) => {
    return apiFetch(path, { ...options, method: "POST", body });
  },

  // NOVO: Helper pra upload com FormData
  upload: (path: string, formData: FormData, options?: RequestInit) =>
    apiFetch(path, { ...options, method: "POST", body: formData }),

  put: (path: string, body?: any, options?: RequestInit) => apiFetch(path, { ...options, method: "PUT", body }),
  delete: (path: string, body?: any, options?: RequestInit) => apiFetch(path, { ...options, method: "DELETE", body }),
};
