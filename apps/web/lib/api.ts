const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // FIX 1: Se já é string, assume que é JSON. Se é object, vira JSON aqui.
  let body = options.body;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const isFormData = body instanceof FormData || body instanceof URLSearchParams;

  if (!isFormData && body) {
    // Se for object, vira string. Se já for string, deixa quieto.
    if (typeof body === "object") {
      body = JSON.stringify(body);
    }
    // Só seta JSON se não for FormData
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
    body, // <- manda o body já tratado
  });

  // FIX 2: 401 e 403 = sessão morreu. Joga fora e deixa o componente redirecionar
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
  post: (path: string, body?: any, options?: RequestInit) => {
    // FIX 3: Deixa o apiFetch tratar. Só passa o object direto.
    return apiFetch(path, { ...options, method: "POST", body });
  },
  put: (path: string, body?: any, options?: RequestInit) => apiFetch(path, { ...options, method: "PUT", body }),
  delete: (path: string, body?: any, options?: RequestInit) => apiFetch(path, { ...options, method: "DELETE", body }),
};
