"use client";

import { Store, User, Lock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay, // <- 1. Importa o Overlay
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const API_URL = "http://127.0.0.1:8000/api/v1";

// <- MSG COMPLETA COM CONTATO
const MENSAGEM_LOJA_DESATIVADA =
  "A sua loja foi desativada, vá até o escritório ou entra em contacto com o admin da stocckbot.\n\n" +
  "Contacto:\n" +
  "E-mail: stockbot26@gmail.com\n" +
  "WhatsApp: +244930438947";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@stock.ao");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lojaBloqueadaOpen, setLojaBloqueadaOpen] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Email ou senha inválidos");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.nivel === "admin") {
        router.replace("/admin");
      } else {
        router.replace(`/loja/${data.loja_slug}/dashboard`);
      }

    } catch (err: any) {
      const msg = err.message || "";

      if (msg.toLowerCase().includes("loja foi desativada")) {
        setLojaBloqueadaOpen(true);
      } else {
        setError(msg);
      }
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
            {loading? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      {/* <- MODAL GLASS + BLOQUEADO */}
      <Dialog
        open={lojaBloqueadaOpen}
        onOpenChange={(open) => {
          if (!open) return; // <- Só fecha no botão
        }}
      >
        {/* <- 2. Overlay explícito com blur garantido */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />

        <DialogContent
          className="sm:max-w-[425px] bg-zinc-950/85 backdrop-blur-xl border-red-500/50 shadow-2xl shadow-red-900/40 z-50" // <- Glass no card
          onInteractOutside={(e) => e.preventDefault()} // <- Bloqueia clique fora
          onEscapeKeyDown={(e) => e.preventDefault()} // <- Bloqueia ESC
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500 text-xl">
              <AlertTriangle className="w-6 h-6" />
              Acesso Bloqueado
            </DialogTitle>
            <DialogDescription className="text-zinc-300 pt-2 text-base whitespace-pre-line">
              {MENSAGEM_LOJA_DESATIVADA}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
              onClick={() => setLojaBloqueadaOpen(false)} // <- Só fecha aqui
            >
              OK, Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}