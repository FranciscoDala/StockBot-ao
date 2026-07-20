"use client";

import { Store, User, Lock, AlertTriangle, Mail, Phone } from "lucide-react"; // 👈 add Mail, Phone
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
    (typeof window!== 'undefined' && window.location.hostname === 'localhost'
       ? "http://127.0.0.1:8000/api/v1"
        : "https://gentle-playfulness-production-d333.up.railway.app/api/v1");

// 👈 MENSAGEM PROFISSIONAL NOVA
const MENSAGEM_LOJA_DESATIVADA = `A tua loja encontra-se temporariamente desativada.
Para reativar o acesso, entra em contacto com a equipa de suporte da StockBot.
Horário: Segunda a Sábado, 08h às 16h`;

const ROUTES = {
    ADMIN: "/admin",
    LOGIN: "/login",
    SELECT_LOJA_GESTOR: "/admin/selecionar-loja",
    SELECT_LOJA_FUNC: "/admin/selecionar-loja"
};

// CORRIGIDO: TUDO MAIUSCULO IGUAL BACKEND
type LojaSelectOut = { id: string; nome: string; slug: string; role: "DONO" | "GERENTE" | "VENDEDOR" | "CAIXA" | "ESTOQUISTA" };
type UserData = {
    id: string; nome: string; email: string; is_superuser?: boolean;
    nivel?: "ADMIN" | "GERENTE" | "VENDEDOR" | "DONO" | "CAIXA" | "ESTOQUISTA";
    role?: "ADMIN" | "GERENTE" | "DONO" | "VENDEDOR" | "CAIXA" | "ESTOQUISTA" | "MULTI_LOJA";
    loja_id?: string | null;
    loja?: { id: string; nome: string; slug: string } | null;
};

type LoginResponse = {
    access_token: string;
    token_type: string;
    user: UserData | null;
    need_selection: boolean;
    lojas: LojaSelectOut[];
};

const setCookie = (name: string, value: string, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd? '; Secure' : '';
    const sameSite = isProd? '; SameSite=None' : '; SameSite=Lax';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${secure}${sameSite}`;
};

const getCookie = (name: string): string | undefined => {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name? decodeURIComponent(parts[1]) : r;
    }, '');
};

const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

const clearAllAuthCookies = () => {
    deleteCookie('token');
    deleteCookie('user');
    deleteCookie('role');
    deleteCookie('temp_token');
    deleteCookie('lojas_temp');
    deleteCookie('user_temp');
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");
    const [lojaBloqueadaOpen, setLojaBloqueadaOpen] = useState(false);
    const router = useRouter();
    const redirectedRef = useRef(false);

    // TODOS vão pra /loja/[id] se já tiver loja
    const safeRedirect = (user: UserData) => {
        if (user.is_superuser || user.nivel === "ADMIN") return router.replace(ROUTES.ADMIN);
        if (user.loja_id) return router.replace(`/loja/${user.loja_id}`);
        return router.replace(ROUTES.SELECT_LOJA_GESTOR);
    };

    useEffect(() => {
        if (redirectedRef.current) return;
        const token = getCookie("token");
        const userStr = getCookie("user");
        if (token && userStr) {
            try {
                const user: UserData = JSON.parse(userStr as string);
                redirectedRef.current = true;
                safeRedirect(user);
                return;
            } catch {
                clearAllAuthCookies();
            }
        }
        setChecking(false);
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        clearAllAuthCookies();

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: email, password: password })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMsg = errorData.detail || `Erro ${res.status}`;

                // 👈 NOVA REGRA: LOJA DESATIVADA
                if (res.status === 403 && String(errorMsg).toLowerCase().includes("loja desativada")) {
                    setLojaBloqueadaOpen(true);
                    return; // para aqui e não mostra erro em baixo
                }

                throw new Error(errorMsg);
            }

            const data: LoginResponse = await res.json();

            // REGRA 0: MULTI-LOJA - PRECISA ESCOLHER PRIMEIRO
            if (data.need_selection && data.lojas.length > 0) {
                setCookie('temp_token', data.access_token, 1 / 24 / 6);
                setCookie('role', 'MULTI_LOJA', 1 / 24 / 6);
                setCookie('lojas_temp', JSON.stringify(data.lojas), 1 / 24 / 6);
                setCookie('user_temp', JSON.stringify(data.user), 1 / 24 / 6);
                redirectedRef.current = true;
                const isGestor = data.user?.nivel === "DONO" || data.user?.nivel === "GERENTE" || data.user?.is_superuser;
                return router.replace(isGestor? ROUTES.SELECT_LOJA_GESTOR : ROUTES.SELECT_LOJA_FUNC);
            }

            if (!data.user) throw new Error("Backend não retornou dados do usuário");

            // REGRA 1: ADMIN
            if (data.user.is_superuser || data.user.nivel === "ADMIN") {
                setCookie('token', data.access_token, 7);
                setCookie('role', 'ADMIN', 7);
                setCookie('user', JSON.stringify(data.user), 7);
                redirectedRef.current = true;
                return router.replace(ROUTES.ADMIN);
            }

            // REGRA 2: FUNCIONARIO: VENDEDOR, CAIXA, ESTOQUISTA
            if (["VENDEDOR", "CAIXA", "ESTOQUISTA"].includes(data.user.nivel!)) {
                setCookie('token', data.access_token, 7);
                setCookie('role', data.user.nivel!, 7);
                setCookie('user', JSON.stringify(data.user), 7);
                redirectedRef.current = true;
                return router.replace(`/loja/${data.user.loja_id}`);
            }

            // REGRA 3: DONO/GERENTE COM 1 LOJA
            if (data.user.nivel === "DONO" || data.user.nivel === "GERENTE") {
                setCookie('token', data.access_token, 7);
                setCookie('role', data.user.nivel, 7);
                setCookie('user', JSON.stringify(data.user), 7);
                redirectedRef.current = true;
                return router.replace(`/loja/${data.user.loja_id}`);
            }

            // FALLBACK
            setCookie('token', data.access_token, 7);
            setCookie('role', data.user.role || 'VENDEDOR', 7);
            setCookie('user', JSON.stringify(data.user), 7);
            redirectedRef.current = true;
            safeRedirect(data.user);

        } catch (err: any) {
            const msg = String(err.message || err).toLowerCase();
            if (msg.includes("sem loja vinculada")) {
                setError("Usuário sem loja vinculada. Crie uma loja primeiro.");
            } else if (msg.includes("401") || msg.includes("403") || msg.includes("credenciais")) {
                setError("Email ou senha incorretos");
            } else {
                setError(err.message || "Erro ao fazer login");
            }
        } finally {
            setLoading(false);
        }
    };

    if (checking) return <div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>

    return (
        <main className="flex min-h-screen items-center justify-center p-4 bg-black">
            <div className="w-full max-w-sm space-y-6 rounded-2xl border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-green-900/20">
                <div className="flex flex-col items-center gap-2">
                    <Store className="h-15 w-15 text-green-500" />
                    <h1 className="text-2xl font-bold text-white">stockbot</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm text-zinc-300"><User size={16} /> E-mail</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border-zinc-700 bg-zinc-900 p-2 text-white focus:border-green-500 outline-none" required />
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm text-zinc-300"><Lock size={16} /> Palavra-passe</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border-zinc-700 bg-zinc-900 p-2 text-white focus:border-green-500 outline-none" required />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full rounded-md bg-green-600 p-2 font-bold text-white disabled:opacity-50 hover:bg-green-500 transition">
                        {loading? "Acessando..." : "Acessar"}
                    </button>
                </form>
                <div className="py-2">
                    <p className="text-sm text-zinc-400 text-center text-justify">
                        <b className="text-green-400">Gerência</b> e <b className="text-green-400">controla</b> melhor a sua loja apartir de qualquer lugar do mundo.
                        <a
                            href="https://wa.me/244930438947?text=Ola%20quero%20criar%20uma%20loja"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                        >
                            <b className="text-red-400">Criar minha loja</b>.
                        </a>
                    </p>
                </div>
            </div>

            {/* MODAL LOJA DESATIVADA */}
            <Dialog open={lojaBloqueadaOpen} onOpenChange={(open) => { if (!open) return; }}>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
                <DialogContent
                    className="sm:max-w-[450px] bg-zinc-950/95 backdrop-blur-xl border-red-500/50 z-50 gap-0 p-0"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="p-6 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <DialogTitle className="text-red-500 text-xl font-bold">Acesso Temporariamente Bloqueado</DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="px-6 pb-4">
                        <DialogDescription className="text-zinc-300 text-base whitespace-pre-line leading-relaxed">
                            {MENSAGEM_LOJA_DESATIVADA}
                        </DialogDescription>

                        <div className="mt-4 space-y-2 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Mail size={14} className="text-green-500" />
                                <span>stockbot26@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Phone size={14} className="text-green-500" />
                                <span>+244 930 438 947</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-zinc-800">
                        <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11"
                            onClick={() => setLojaBloqueadaOpen(false)}
                        >
                            Entendi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Toaster richColors position="top-right" />
        </main>
    );
}
