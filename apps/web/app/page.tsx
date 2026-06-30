"use client";

import { Store, User, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000/api/v1"; // <- 127.0.0.1 evita bug de CORS do localhost

export default function LoginPage() {
  const [email, setEmail] = useState("admin@stock.ao");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email); // <- Certo: username
      formData.append("password", password); // <- Certo: password

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json(); // <- Pega o erro real do FastAPI
        throw new Error(errData.detail || "Email ou senha inválidos");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      
      // FIX: Usa o slug que veio do backend pra redirecionar pro SaaS
      router.replace(`/loja/${data.loja_slug}/dashboard`); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-green-900/20">
        <div className="flex flex-col items-center gap-2">
          <Store className="h-10 w-10 text-green-500" />
          <h1 className="text-2xl font-bold">StockBot-AO</h1>
          <p className="text-sm text-zinc-400">Use: admin@stock.ao / admin123</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm text-zinc-300"><User size={16} /> Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border-zinc-700 bg-zinc-900 p-2" required />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm text-zinc-300"><Lock size={16} /> Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border-zinc-700 bg-zinc-900 p-2" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-green-600 p-2 font-bold text-white disabled:opacity-50 hover:bg-green-500">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}